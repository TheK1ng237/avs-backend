import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { CultureService, UpdatePatternDto } from '@/modules/culture/application/culture.service';
import type { PatternType } from '@/modules/culture/domain/CulturePattern';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@/shared/utils/logger';
import { createStorageService } from '@/infra/storage/storage.factory';
import { PatternListResponseMapper } from './dto/PatternListResponse.mapper';
import { db } from '@/config/database';

// ── Multer configuration for SVG file upload ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'patterns');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isSvgField = file.fieldname === 'svgFile';
  const isImageField = file.fieldname.startsWith('symbolImage_');

  if (isSvgField) {
    if (
      file.mimetype === 'image/svg+xml' ||
      path.extname(file.originalname).toLowerCase() === '.svg'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only SVG files are allowed for svgFile'));
    }
  } else if (isImageField) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for symbol images'));
    }
  } else {
    cb(new Error('Unknown file field'));
  }
};

export const uploadSvg = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 21, // 1 SVG + up to 20 symbol images
  },
});

// ── Comprehensive Zod Schema matching frontend 3-step form ─────────────────────
const ColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid HEX color'),
  name: z.string().min(1, 'Color name required'),
  meaning: z.string().min(1, 'Color meaning required'),
});

const ArtisanQuoteSchema = z
  .object({
    text: z.string().min(10, 'Quote text must be at least 10 characters').max(500),
    author: z.string().min(2, 'Author name required').max(128),
    role: z.string().min(2, 'Role required').max(128),
    country: z.string().min(2, 'Country required').max(64),
  })
  .optional();

const SymbolSchema = z.object({
  name: z.string().min(1, 'Symbol name required'),
  nameFr: z.string().min(1, 'French name required'),
  cssPreview: z.string().min(1, 'CSS preview required'),
  meaning: z.string().min(1, 'Symbol meaning required'),
  usage: z.string().min(1, 'Symbol usage required'),
  sacred: z.boolean(),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

const SymbolisimSchema =z.object({
  meaning: z.string().min(10,"symbolism meaning is requierd").max(512),
  keywords:z.array(z.string().min(1)).min(1,"at least one keyword is requierd").max(10),
  usage: z.enum(['ceremonial', 'daily', 'royal', 'spiritual', 'universal'])
})
const CreateSchema = z.object({
  // Step 1: Identity
  nameLocal: z.string().min(2, 'Minimum 2 characters').max(128),
  nameEn: z.string().min(2, 'Minimum 2 characters').max(128),
  patternType: z.enum(['kente', 'bogolan', 'adinkra', 'ndebele', 'kuba', 'ndop', 'wax', 'berber']).transform(val => val.toUpperCase() as PatternType),
  region: z.enum([
    'west-africa',
    'east-africa',
    'central-africa',
    'north-africa',
    'south-africa',
    'diaspora',
  ]),
  country: z.string().length(2, 'Country code must be 2 characters').toUpperCase(),
  people: z.string().max(128).optional(),
  flag: z.string().max(8).optional(),
  coords: z.tuple([z.number(), z.number()]).optional(),
  kingdom: z.string().max(128).optional(),
  era: z.string().max(64).optional(),
  license: z.enum(['cc0', 'cc-by', 'cc-by-sa']).default('cc-by'),

  // Step 2: Description
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(500),
  history: z.string().min(10, 'History must be at least 10 characters').max(2000),
  technique: z.string().min(10, 'Technique must be at least 10 characters').max(1000),
  ceremonial: z.string().min(10, 'Ceremonial usage must be at least 10 characters').max(1000),
  

  // Step 3: Colors & Assets
  colors: z.array(ColorSchema).min(2, 'At least 2 colors required').max(5),
  svgPattern: z.string().optional(),
  artisanQuote: ArtisanQuoteSchema,
  sources: z.array(z.string().min(1)).min(1, 'At least one source required').max(10),
  symbols: z.array(SymbolSchema).min(1, 'At least one symbol required').max(20),
  symbolism:SymbolisimSchema
});

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  region: z
    .enum([
      'west-africa',
      'east-africa',
      'central-africa',
      'north-africa',
      'south-africa',
      'diaspora',
    ])
    .optional(),
  patternType: z.enum(['kente', 'bogolan', 'adinkra', 'ndebele', 'kuba', 'ndop', 'wax', 'berber']).optional(),
  search: z.string().max(128).optional(),
});

// ── Factory — injection du service ───────────────────────────────────────────
export class CultureController {
  constructor(private readonly service: CultureService) {}

  private storage = createStorageService();
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = '1', perPage = '20', search } = req.query as Record<string, string | undefined>;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      const pageNum = parseInt(page) || 1;
      const perPageNum = parseInt(perPage) || 20;
      const skip = (pageNum - 1) * perPageNum;

      let where: any = {};

      // Filtrage par rôle
      if (!userRole || userRole === 'viewer') {
        // Les viewers ne voient que les patterns publiés
        where.status = 'PUBLISHED';
      } else if (userRole === 'contributor' || userRole === 'curator') {
        // Les contributors et curateurs ne voient que leurs patterns
        where.createdById = userId;
      }
      // admin et super_admin voient tout (pas de filtre)

      // Ajouter le filtre de recherche si fourni
      if (search) {
        const searchCondition = {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { nameLocal: { contains: search, mode: 'insensitive' as const } },
          ],
        };

        if (where.OR) {
          // Combiner avec le filtre de rôle existant
          where.AND = [
            { OR: where.OR },
            searchCondition,
          ];
          delete where.OR;
        } else {
          Object.assign(where, searchCondition);
        }
      }

      const [patterns, totalItems] = await Promise.all([
        db.pattern.findMany({
          where,
          skip,
          take: perPageNum,
          orderBy: { createdAt: 'desc' },
          include: { origin: true, colors: true, symbols: true, artisanQuote: true ,symbolism:true},
        }),
        db.pattern.count({ where }),
      ]);

      const data = PatternListResponseMapper.toPatternDocArray(patterns);
      const totalPages = Math.ceil(totalItems / perPageNum);
      res.json(ok({ data, meta: { page: pageNum, perPage: perPageNum, totalItems, totalPages } }));
    } catch (err) {
      next(err);
    }
  };

  getBySlug = async (
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const pattern = await db.pattern.findUnique({
        where: { slug: req.params.slug },
        include: { origin: true, colors: true, symbols: true, artisanQuote: true ,symbolism:true},
      });

      if (!pattern) {
        res.status(404).json({ success: false, message: 'Pattern not found', data: null });
        return;
      }

      // Increment views
      await db.pattern.update({
        where: { id: pattern.id },
        data: { views: pattern.views + 1 },
      });

      const response = PatternListResponseMapper.toPatternDoc(pattern);
      res.json(ok(response));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      
      const formData: any = {};

      
      for (const [key, value] of Object.entries(req.body)) {
        if (value === undefined || value === null) continue;

        // Parse JSON fields
        if (typeof value === 'string') {
          try {
            formData[key] = JSON.parse(value);
          } catch {
            formData[key] = value;
          }
        } else {
          formData[key] = value;
        }
      }

      // Handle SVG file if uploaded
      if (req.files && typeof req.files === 'object' && 'svgFile' in req.files) {
        const svgFiles = req.files.svgFile;
        logger.info(`[CultureController.create] SVG files received: ${svgFiles?.length || 0}`);
        if (svgFiles && Array.isArray(svgFiles) && svgFiles.length > 0 && svgFiles[0]) {
          logger.info(`[CultureController.create] Uploading SVG file: ${svgFiles[0].originalname}`);
          const uploadResult = await this.storage.upload(svgFiles[0]);

          formData.svgFilePath = uploadResult.url;
          formData.svgKey = uploadResult.key;
          formData.svgProvider = uploadResult.provider;

          logger.info(
            `[CultureController.create] SVG uploaded: ${uploadResult.provider} - ${uploadResult.key}`,
          );
        }
      } else {
        logger.info(`[CultureController.create] No SVG files in req.files`);
      }

      // Handle symbol images if uploaded
      const symbolImages: { [key: string]: string } = {};

      if (req.files && typeof req.files === 'object') {
        logger.info(`[CultureController.create] Processing symbol images from req.files`);
        const fileKeys = Object.keys(req.files);
        logger.info(`[CultureController.create] Available fields: ${fileKeys.join(', ')}`);

        for (const [fieldname, files] of Object.entries(req.files)) {
          if (
            fieldname.startsWith('symbolImage_') &&
            Array.isArray(files) &&
            files.length > 0 &&
            files[0]
          ) {
            const symbolIndex = fieldname.replace('symbolImage_', '');
            logger.info(
              `[CultureController.create] Uploading symbol image ${symbolIndex}: ${files[0].originalname}`,
            );
            const uploadResult = await this.storage.upload(files[0], 'symbols');
            symbolImages[symbolIndex] = uploadResult.url;
            logger.info(
              `[CultureController.create] Symbol image uploaded: ${uploadResult.provider} - ${uploadResult.key} -> ${uploadResult.url}`,
            );
          }
        }
      } else {
        logger.info(`[CultureController.create] No req.files object`);
      }

      logger.info(
        `[CultureController.create] Total symbol images collected: ${Object.keys(symbolImages).length}`,
      );

      // Add image URLs to symbols - preserve existing URLs if no new image uploaded
      if (formData.symbols && Array.isArray(formData.symbols)) {
        formData.symbols = formData.symbols.map((symbol: any, index: number) => {
          const newImageUrl = symbolImages[index.toString()];
          // Only update imageUrl if a new image was uploaded
          if (newImageUrl) {
            return { ...symbol, imageUrl: newImageUrl };
          }
          // Keep existing imageUrl if present, otherwise keep as is
          return symbol.imageUrl ? { ...symbol, imageUrl: symbol.imageUrl } : symbol;
        });
      }

      // Validate with Zod schema
      const validatedData = CreateSchema.parse(formData);

      // Transform comprehensive form data to match existing service DTO
      const serviceDto = {
        name: validatedData.nameEn,
        nameLocal: validatedData.nameLocal,
        imgUrl: formData.svgFilePath || '',
        type: validatedData.patternType.toUpperCase() as any,
        cssClass: `pattern-${validatedData.patternType}`,
        era: validatedData.era,
        license: validatedData.license,
        summary: validatedData.summary,
        history: validatedData.history,
        technique: validatedData.technique,
        symbolism: validatedData.symbolism,
        ceremonial: validatedData.ceremonial,
        sources: validatedData.sources,
        createdById: req.user!.userId,
        colors: validatedData.colors,
        symbols: validatedData.symbols,
        origin: validatedData.region && validatedData.country ? {
          people: validatedData.people || '',
          region: validatedData.region,
          country: validatedData.country,
          flag: validatedData.flag || '',
          coords: validatedData.coords || [0, 0],
        } : undefined,
        artisanQuote: validatedData.artisanQuote,
        svgPattern: validatedData.svgPattern,
      };

      const result = await this.service.createPattern(serviceDto);
      logger.info(`Pattern created: ${result.id} - ${result.name}`);

      res
        .status(StatusCodes.CREATED)
        .json(ok(result.toObject(), 'Pattern created successfully and submitted for review'));
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }
      next(err);
    }
  };

  update = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Handle FormData parsing
      const formData: any = {};

      // Parse all form fields
      for (const [key, value] of Object.entries(req.body)) {
        if (value === undefined || value === null) continue;

        // Parse JSON fields
        if (typeof value === 'string') {
          try {
            formData[key] = JSON.parse(value);
          } catch {
            formData[key] = value;
          }
        } else {
          formData[key] = value;
        }
      }

      if (req.files && typeof req.files === 'object' && 'svgFile' in req.files) {
        const svgFiles = req.files.svgFile;
        logger.info(`[CultureController.update] SVG files received: ${svgFiles?.length || 0}`);
        if (svgFiles && Array.isArray(svgFiles) && svgFiles.length > 0 && svgFiles[0]) {
          logger.info(`[CultureController.update] Uploading SVG file: ${svgFiles[0].originalname}`);
          const uploadResult = await this.storage.upload(svgFiles[0]);

          formData.svgFilePath = uploadResult.url;
          formData.svgKey = uploadResult.key;
          formData.svgProvider = uploadResult.provider;
          logger.info(`[CultureController.update] SVG uploaded successfully`);
        }
      } else {
        logger.info(`[CultureController.update] No SVG files in req.files`);
      }

      // Handle symbol images if uploaded
      const symbolImages: Record<string, string> = {};

      if (req.files && typeof req.files === 'object') {
        logger.info(`[CultureController.create] Processing symbol images from req.files`);

        const uploadPromises = Object.entries(req.files).map(async ([fieldname, files]) => {
          if (
            fieldname.startsWith('symbolImage_') &&
            Array.isArray(files) &&
            files.length > 0 &&
            files[0]
          ) {
            const symbolIndex = fieldname.replace('symbolImage_', '');

            logger.info(
              `[CultureController.create] Uploading symbol image ${symbolIndex}: ${files[0].originalname}`,
            );

            const uploadResult = await this.storage.upload(files[0], 'symbols');

            return {
              index: symbolIndex,
              url: uploadResult.url,
            };
          }

          return null;
        });

        const results = await Promise.all(uploadPromises);

        results.forEach((res) => {
          if (res) {
            symbolImages[res.index] = res.url;
          }
        });

        logger.info(
          `[CultureController.create] Total symbol images collected: ${Object.keys(symbolImages).length}`,
        );
      }

      // Add image URLs to symbols - preserve existing URLs if no new image uploaded
      if (formData.symbols && Array.isArray(formData.symbols)) {
        formData.symbols = formData.symbols.map((symbol: any, index: number) => {
          const newImageUrl = symbolImages[index.toString()];
          // Only update imageUrl if a new image was uploaded
          if (newImageUrl) {
            return { ...symbol, imageUrl: newImageUrl };
          }
          // Keep existing imageUrl if present, otherwise keep as is
          return symbol.imageUrl ? { ...symbol, imageUrl: symbol.imageUrl } : symbol;
        });
      }

      // Create partial schema for updates (all fields optional)
      const UpdateSchema = CreateSchema.partial();
      const validatedData = UpdateSchema.parse(formData);

      // Transform comprehensive form data to match existing service DTO
      const serviceDto: UpdatePatternDto = {};

      // Map basic fields if provided
      if (validatedData.nameEn) serviceDto.name = validatedData.nameEn;
      if (validatedData.nameLocal) serviceDto.nameLocal = validatedData.nameLocal;
      if (validatedData.patternType) serviceDto.type = validatedData.patternType;
      if (validatedData.era) serviceDto.era = validatedData.era;
      if (validatedData.license) serviceDto.license = validatedData.license;
      if (validatedData.summary) serviceDto.summary = validatedData.summary;
      if (validatedData.history) serviceDto.history = validatedData.history;
      if (validatedData.technique) serviceDto.technique = validatedData.technique;
      if (validatedData.symbolism) serviceDto.symbolism = validatedData.symbolism;
      if (validatedData.ceremonial) serviceDto.ceremonial = validatedData.ceremonial;
      if (validatedData.sources) serviceDto.sources = validatedData.sources;
      if (formData.svgFilePath) serviceDto.imgUrl = formData.svgFilePath;
      
      // Map origin if provided
      if (validatedData.region && validatedData.country) {
        serviceDto.origin = {
          people: validatedData.people || '',
          region: validatedData.region,
          country: validatedData.country,
          flag: validatedData.flag || '',
          coords: validatedData.coords || [0, 0],
        };
      }
      
      // Map other optional fields
      if (validatedData.colors) serviceDto.colors = validatedData.colors;
      if (validatedData.symbols) serviceDto.symbols = validatedData.symbols;
      if (validatedData.artisanQuote) serviceDto.artisanQuote = validatedData.artisanQuote;
      if (validatedData.svgPattern) serviceDto.svgPattern = validatedData.svgPattern;

      const result = await this.service.updatePattern(
        req.params.id,
        serviceDto,
        req.user!.role,
      );
      logger.info(`Pattern updated: ${result.id} - ${result.name}`);

      res.json(ok(result.toObject(), 'Pattern updated successfully'));
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }
      next(err);
    }
  };

  updateStatus = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = req.body;
      const pattern = await this.service.updatePatternStatus(
        req.params.id,
        status,
        req.user!.role,
      );
      res.json(ok(pattern.toObject(), 'Statut mis à jour'));
    } catch (err) {
      next(err);
    }
  };

  toggleFeatured = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { featured } = req.body;
      const pattern = featured
        ? await this.service.featurePattern(req.params.id, req.user!.role)
        : await this.service.unfeaturePattern(req.params.id, req.user!.role);
      res.json(ok(pattern.toObject(), featured ? 'Motif mis en vedette' : 'Motif retiré des vedettes'));
    } catch (err) {
      next(err);
    }
  };

  remove = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.deletePattern(req.params.id, req.user!.role);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };

  download = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const pattern = await this.service.getPatternForDownload(req.params.id);
      
      // Extract the file path from the URL
      // URL format: https://.../storage/v1/object/public/patterns/filename.svg
      if (!pattern.imgUrl) {
        res.status(404).json({ success: false, message: 'Pattern SVG URL not found' });
        return;
      }

      const urlParts = pattern.imgUrl.split('/patterns/');
      if (urlParts.length < 2 || !urlParts[1]) {
        res.status(400).json({ success: false, message: 'Invalid pattern URL' });
        return;
      }
      const filePath = urlParts[1] as string;

      // Use storage provider to download the file
      const fileBuffer = await this.storage.download(filePath);

      if (!fileBuffer) {
        res.status(404).json({ success: false, message: 'Failed to download SVG from storage' });
        return;
      }
      
      // Increment download counter
      await this.service.incrementDownload(req.params.id);

      // Send SVG file
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${pattern.slug}.svg"`);
      res.send(fileBuffer);
    } catch (err) {
      next(err);
    }
  };

  getRecentGlobal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = '5' } = req.query as Record<string, string>;
      const limitNum = parseInt(limit) || 5;

      const patterns = await db.pattern.findMany({
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { origin: true, colors: true, symbols: true, artisanQuote: true, symbolism: true },
      });

      const data = PatternListResponseMapper.toPatternDocArray(patterns);
      res.json(ok(data, 'Recent patterns retrieved'));
    } catch (err) {
      next(err);
    }
  };
}
