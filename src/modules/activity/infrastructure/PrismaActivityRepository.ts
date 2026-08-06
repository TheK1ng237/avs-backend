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
    totalUsers: number;
    totalArtisans: number;
    totalDownloads: number;
  }> {
    const [totalPatterns, totalUsers, totalArtisans, stats] = await Promise.all([
      this.db.pattern.count(),
      this.db.user.count(),
      this.db.artisan.count(),
      this.db.pattern.aggregate({
        _sum: { downloads: true },
      }),
    ]);

    return {
      totalPatterns,
      totalUsers,
      totalArtisans,
      totalDownloads: stats._sum?.downloads ?? 0,
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
