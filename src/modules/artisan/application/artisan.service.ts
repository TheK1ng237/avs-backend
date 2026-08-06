import type { Artisan } from '@prisma/client';
import type { IRepository } from '@/shared/types/repository.types';

export interface CreateArtisanDto {
  name: string;
  craft: string;
  origin: string;
  country: string;
  bio: string;
  specialties: string[];
}

export interface UpdateArtisanDto {
  name?: string;
  craft?: string;
  origin?: string;
  country?: string;
  bio?: string;
  specialties?: string[];
  rating?: number;
}

export interface ArtisanListParams {
  page: number;
  perPage: number;
  search?: string;
  specialty?: string;
}

export class ArtisanService {
  constructor(private readonly repository: IRepository<Artisan>) {}

  async listArtisans(params: ArtisanListParams): Promise<{
    items: Artisan[];
    meta: { page: number; perPage: number; totalPages: number; totalItems: number };
  }> {
    const skip = (params.page - 1) * params.perPage;
    const [items, total] = await Promise.all([
      (this.repository as any).findFiltered({
        skip,
        take: params.perPage,
        search: params.search,
        specialty: params.specialty,
      }),
      (this.repository as any).countFiltered({
        search: params.search,
        specialty: params.specialty,
      }),
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

  async getArtisanById(id: string): Promise<Artisan> {
    const artisan = await this.repository.findById(id);
    if (!artisan) throw new Error('Artisan not found');
    return artisan;
  }

  async createArtisan(userId: string, data: CreateArtisanDto): Promise<Artisan> {
    return (this.repository as any).create({
      userId,
      ...data,
    });
  }

  async updateArtisan(id: string, data: UpdateArtisanDto): Promise<Artisan> {
    const artisan = await this.repository.update(id, data);
    return artisan;
  }

  async deleteArtisan(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async verifyArtisan(id: string): Promise<Artisan> {
    return this.repository.update(id, { verified: true });
  }

  async updateRating(id: string, rating: number): Promise<Artisan> {
    return this.repository.update(id, { rating });
  }
}
