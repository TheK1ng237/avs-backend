import type { Prisma } from '@prisma/client';
// 1. Ajoute ArtisanSpecialty dans les imports
import { PrismaClient, Artisan, ArtisanSpecialty } from '@prisma/client';

export class PrismaArtisanRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Artisan | null> {
    return this.db.artisan.findUnique({ where: { id } });
  }

  async findAll(params?: { take?: number; skip?: number }): Promise<Artisan[]> {
    return this.db.artisan.findMany({
      take: params?.take ?? 10,
      skip: params?.skip ?? 0,
      orderBy: { rating: 'desc' },
    });
  }

  // 2. Modifie le type de specialty ici : ArtisanSpecialty au lieu de string
  async findFiltered(params: {
    skip?: number;
    take?: number;
    search?: string;
    specialty?: ArtisanSpecialty; 
  }): Promise<Artisan[]> {
    return this.db.artisan.findMany({
      skip: params.skip,
      take: params.take ?? 20,
      where: {
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { origin: { contains: params.search, mode: 'insensitive' } },
            { bio: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
        ...(params.specialty && {
          specialties: { has: params.specialty },
        }),
      },
      orderBy: { rating: 'desc' },
    });
  }

  // 3. Fais la même modification ici
  async countFiltered(params: { search?: string; specialty?: ArtisanSpecialty }): Promise<number> {
    return this.db.artisan.count({
      where: {
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { origin: { contains: params.search, mode: 'insensitive' } },
            { bio: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
        ...(params.specialty && {
          specialties: { has: params.specialty },
        }),
      },
    });
  }

  async create(data: Prisma.ArtisanCreateInput): Promise<Artisan> {
    return this.db.artisan.create({ data });
  }

  async update(id: string, data: Prisma.ArtisanUpdateInput): Promise<Artisan> {
    return this.db.artisan.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Artisan> {
    return this.db.artisan.delete({ where: { id } });
  }
}