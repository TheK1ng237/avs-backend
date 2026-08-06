import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaletteService } from '@/modules/palette/application/palette.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';

const ColorTokenSchema = z.object({
  name: z.string().min(2).max(64),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  meaning: z.string().max(256),
  origin: z.string().max(128),
  css: z.string().max(64),
});

const CreateSchema = z.object({
  name: z.string().min(2).max(128),
  origin: z.string().min(2).max(128),
  description: z.string().min(10).max(1000),
  patternCSS: z.string().optional(),
  tokens: z.array(ColorTokenSchema).min(1).max(10),
});

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export class PaletteController {
  constructor(private readonly service: PaletteService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = QuerySchema.parse(req.query);
      const result = await this.service.listPalettes(query);
      res.json(ok(result.items, 'OK', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const palette = await this.service.getPaletteById(id);
      res.json(ok(palette, 'Palette retrieved'));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = CreateSchema.parse(req.body);
      const palette = await this.service.createPalette(data);
      res.status(StatusCodes.CREATED).json(ok(palette, 'Palette created'));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const data = CreateSchema.partial().parse(req.body);
      const palette = await this.service.updatePalette(id, data);
      res.json(ok(palette, 'Palette updated'));
    } catch (err) {
      next(err);
    }
  };

  publish = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const palette = await this.service.publishPalette(id);
      res.json(ok(palette, 'Palette published'));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      await this.service.deletePalette(id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}
