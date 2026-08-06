import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ArtisanService } from '@/modules/artisan/application/artisan.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';

const CreateSchema = z.object({
  name: z.string().min(2).max(128),
  craft: z.string().min(2).max(128),
  origin: z.string().min(2).max(128),
  country: z.string().length(2).toUpperCase(),
  bio: z.string().min(10).max(2000),
  specialties: z.array(z.string()).min(1).max(5),
});

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(128).optional(),
  specialty: z.string().optional(),
});

export class ArtisanController {
  constructor(private readonly service: ArtisanService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = QuerySchema.parse(req.query);
      const result = await this.service.listArtisans(query);
      res.json(ok(result.items, 'OK', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {

      const id=req.params.id;
      if (!id) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Artisan ID is required' });
        return;
      }
      
      const artisan = await this.service.getArtisanById(id);
      res.json(ok(artisan, 'Artisan retrieved'));
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data = CreateSchema.parse(req.body);
      const artisan = await this.service.createArtisan(userId, data);
      res.status(StatusCodes.CREATED).json(ok(artisan, 'Artisan created'));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = CreateSchema.partial().parse(req.body);
      const id = req.params.id;
      if (!id) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Artisan ID is required' });
        return;
      }
      const artisan = await this.service.updateArtisan(id , data);
      res.json(ok(artisan, 'Artisan updated'));
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Artisan ID is required' });
        return;
      }
      await this.service.deleteArtisan(id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };

  verify = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Artisan ID is required' });
        return;
      }
      const artisan = await this.service.verifyArtisan(id);
      res.json(ok(artisan, 'Artisan verified'));
    } catch (err) {
      next(err);
    }
  };
}
