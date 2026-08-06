import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ActivityService } from '@/modules/activity/application/activity.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export class ActivityController {
  constructor(private readonly service: ActivityService) {}

  getUserActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const query = QuerySchema.parse(req.query);
      const result = await this.service.getUserActivity(userId, query);

      res.json(ok(result.items, 'Activity retrieved', result.meta));
    } catch (err) {
      next(err);
    }
  };

  getGlobalStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getGlobalStats();
      res.json(ok(stats, 'Global statistics'));
    } catch (err) {
      next(err);
    }
  };

  getGlobalActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = QuerySchema.parse(req.query);
      const result = await this.service.getGlobalActivity({
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      });
      res.json(ok(result, 'Global activity retrieved'));
    } catch (err) {
      next(err);
    }
  };
}
