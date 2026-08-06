import type { Comment } from '@prisma/client';

export interface CreateCommentDto {
  content: string;
  rating?: number;
}

export class CommentService {
  constructor(private readonly repository: any) {}

  async addComment(
    userId: string,
    patternId: string | null,
    artisanId: string | null,
    data: CreateCommentDto
  ): Promise<Comment> {
    if (!patternId && !artisanId) {
      throw new Error('Either patternId or artisanId must be provided');
    }

    return this.repository.create({
      userId,
      patternId,
      artisanId,
      content: data.content,
      rating: data.rating,
      type: patternId ? 'PATTERN' : 'ARTISAN',
    });
  }

  async getComments(
    patternId?: string,
    artisanId?: string,
    params?: { page?: number; perPage?: number }
  ): Promise<{
    items: Comment[];
    meta: { totalItems: number; page: number; totalPages: number; perPage: number };
  }> {
    const page = params?.page ?? 1;
    const perPage = params?.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
      this.repository.findByTarget(
        { patternId, artisanId },
        { skip, take: perPage }
      ),
      this.repository.countByTarget({ patternId, artisanId }),
    ]);

    return {
      items,
      meta: {
        totalItems: total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.repository.findById(commentId);
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId) throw new Error('Unauthorized');

    await this.repository.delete(commentId);
  }

  async verifyComment(commentId: string): Promise<Comment> {
    return this.repository.update(commentId, { verified: true });
  }
}
