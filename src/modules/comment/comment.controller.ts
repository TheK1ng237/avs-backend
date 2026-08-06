import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CommentService } from '@/modules/comment/application/comment.service';
import { ok } from '@/shared/types/api.types';
import { StatusCodes } from 'http-status-codes';

const CreateSchema = z.object({
  content: z.string().min(1).max(2000),
  rating: z.number().min(0).max(5).optional(),
});

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export class CommentController {
  constructor(private readonly service: CommentService) {}

  addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { patternId, artisanId } = req.params as any;
      const data = CreateSchema.parse(req.body);

      const comment = await this.service.addComment(
        userId,
        patternId || null,
        artisanId || null,
        data
      );

      res.status(StatusCodes.CREATED).json(ok(comment, 'Comment added'));
    } catch (err) {
      next(err);
    }
  };

  getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = QuerySchema.parse(req.query);
      const { patternId, artisanId } = req.params as any;

      const result = await this.service.getComments(patternId || undefined, artisanId || undefined, {
        page: query.page,
        perPage: query.perPage,
      });

      res.json(ok(result.items, 'Comments retrieved', result.meta));
    } catch (err) {
      next(err);
    }
  };

  deleteComment = async (req: Request<{id:string}>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const commentId = req.params.id ;
      if (!commentId) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Comment ID is required' });
        return;
      }
      await this.service.deleteComment(commentId, userId);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  };
}
