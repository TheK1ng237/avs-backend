import type { Activity } from '@prisma/client';

export interface ActivityListParams {
  page: number;
  perPage: number;
}

export class ActivityService {
  constructor(private readonly repository: any) {}

  async getUserActivity(
    userId: string,
    params: ActivityListParams,
  ): Promise<{
    items: Activity[];
    meta: {
      page: number;
      perPage: number;
      totalPages: number;
      totalItems: number;
    };
  }> {
    const skip = (params.page - 1) * params.perPage;

    const [items, total] = await Promise.all([
      this.repository.findByUser(userId, {
        skip,
        take: params.perPage,
      }),
      this.repository.countByUser(userId),
    ]);

    return {
      items,
      meta: {
        page: params.page,
        perPage: params.perPage,
        totalItems: total,
        totalPages: Math.ceil(total / params.perPage),
      },
    };
  }

  async logActivity(
    userId: string,
    action: string,
    targetId: string,
    targetType: string,
    metadata?: any,
  ): Promise<Activity> {
    return this.repository.create({
      userId,
      action,
      targetId,
      targetType,
      metadata,
    });
  }

  async getGlobalStats(): Promise<{
    totalPatterns: number;
    totalUsers: number;
    totalArtisans: number;
    totalDownloads: number;
  }> {
    return this.repository.getGlobalStats();
  }

  async getGlobalActivity(params?: { skip?: number; take?: number }): Promise<Activity[]> {
    return this.repository.findGlobal(params);
  }
}
