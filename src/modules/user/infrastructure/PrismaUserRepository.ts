import type { Prisma } from '@prisma/client';
import { PrismaClient, User } from '@prisma/client';
import { ConflictError } from '@/shared/errors/AppError';

export class PrismaUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findAll(params?: { take?: number; skip?: number }): Promise<User[]> {
    return this.db.user.findMany({
      take: params?.take ?? 10,
      skip: params?.skip ?? 0,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return this.db.user.create({ data });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw new ConflictError('Cette adresse email est déjà utilisée');
      }
      throw error;
    }
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.delete({ where: { id } });
  }

  async countPatterns(userId: string): Promise<number> {
    // Pattern model doesn't have createdById relationship yet
    // Returning 0 as placeholder
    return 0;
  }

  async countDownloads(userId: string): Promise<number> {
    // Pattern model doesn't have createdById relationship yet
    // Returning 0 as placeholder
    return 0;
  }

  async countViews(userId: string): Promise<number> {
    // Pattern model doesn't have createdById relationship yet
    // Returning 0 as placeholder
    return 0;
  }
}
