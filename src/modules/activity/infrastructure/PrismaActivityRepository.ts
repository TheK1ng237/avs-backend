import type { Prisma } from '@prisma/client';
import { PrismaClient, Activity } from '@prisma/client';

export class PrismaActivityRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUser(
    userId: string,
    params?: { skip?: number; take?: number }
  ): Promise<Activity[]> {
    return this.db.activity.findMany({
      where: { userId },
      skip: params?.skip,
      take: params?.take ?? 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.db.activity.count({ where: { userId } });
  }

  async create(data: Prisma.ActivityCreateInput): Promise<Activity> {
    return this.db.activity.create({ data });
  }

  async getGlobalStats(): Promise<{
    totalPatterns: number;
    totalArtisans: number;
    totalDownloads: number;
    totalViews: number;
    totalCountries: number;
    totalSymbols: number;
  }> {
    const publishedPatternWhere = { status: 'PUBLISHED' as const };
    const [totalPatterns, totalArtisans, stats, totalCountries, totalSymbols] = await Promise.all([
      this.db.pattern.count({ where: publishedPatternWhere }),
      this.db.artisan.count({ where: { verified: true } }),
      this.db.pattern.aggregate({
        where: publishedPatternWhere,
        _sum: { downloads: true, views: true },
      }),
      this.db.origin.findMany({
        where: { pattern: publishedPatternWhere },
        distinct: ['country'],
        select: { country: true },
      }),
      this.db.symbol.count({ where: { pattern: publishedPatternWhere } }),
    ]);

    return {
      totalPatterns,
      totalArtisans,
      totalDownloads: stats._sum?.downloads ?? 0,
      totalViews: stats._sum?.views ?? 0,
      totalCountries: totalCountries.length,
      totalSymbols,
    };
  }

  async getUserStats(userId: string): Promise<{
    total: number;
    downloads: number;
    favorites: number;
    comments: number;
    reviews: number;
  }> {
    const [total, actions] = await Promise.all([
      this.db.activity.count({ where: { userId } }),
      this.db.activity.groupBy({
        by: ['action'],
        where: { userId },
        _count: true,
      }),
    ]);

    const counts = new Map(actions.map(({ action, _count }) => [action, _count]));
    return {
      total,
      downloads: counts.get('DOWNLOADED') ?? 0,
      favorites: counts.get('FAVORITED') ?? 0,
      comments: counts.get('COMMENTED') ?? 0,
      reviews: counts.get('REVIEWED') ?? 0,
    };
  }

  async findGlobal(params?: { skip?: number; take?: number }): Promise<Activity[]> {
    return this.db.activity.findMany({
      skip: params?.skip,
      take: params?.take ?? 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
