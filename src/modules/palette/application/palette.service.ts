import type { Palette } from '@prisma/client';

export interface ColorTokenInput {
  name: string;
  hex: string;
  meaning: string;
  origin: string;
  css: string;
}

export interface CreatePaletteDto {
  name: string;
  origin: string;
  description: string;
  patternCSS?: string;
  tokens: ColorTokenInput[];
}

export interface PaletteListParams {
  page: number;
  perPage: number;
}

export class PaletteService {
  constructor(private readonly repository: any) {}

  async listPalettes(params: PaletteListParams): Promise<{
    items: Palette[];
    meta: { page: number; perPage: number; totalItems: number; totalPages: number };
  }> {
    const skip = (params.page - 1) * params.perPage;
    const [items, total] = await Promise.all([
      this.repository.findAll({
        skip,
        take: params.perPage,
        isPublished: true,
        include: { tokens: true },
      }),
      this.repository.count(),
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

  async getPaletteById(id: string): Promise<Palette> {
    const palette = await this.repository.findById(id, { include: { tokens: true } });
    if (!palette) throw new Error('Palette not found');
    return palette;
  }

  async createPalette(data: CreatePaletteDto): Promise<Palette> {
    return this.repository.create({
      ...data,
      tokens: {
        createMany: {
          data: data.tokens,
        },
      },
    });
  }

  async updatePalette(id: string, data: Partial<CreatePaletteDto>): Promise<Palette> {
    return this.repository.update(id, data);
  }

  async publishPalette(id: string): Promise<Palette> {
    return this.repository.update(id, { isPublished: true });
  }

  async deletePalette(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
