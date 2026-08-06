// =============================================================================
// Infrastructure Adapter — PrismaCultureRepository
// Implémentation concrète de ICultureRepository avec Prisma.
// Équivalent Java : @Repository CultureRepositoryImpl (JPA/Hibernate)
//
// MIGRATION : Pour Java, remplacer par CultureRepositoryImpl implements
// CultureRepository avec @Autowired EntityManager. Le Service ne change pas.
// =============================================================================

import type { PrismaClient, Prisma } from '@prisma/client';
import type { ICultureRepository, FindPatternsOptions, FindResult } from '../domain/ICultureRepository';
import { CulturePattern, type PatternType } from '../domain/CulturePattern';

export class PrismaCultureRepository implements ICultureRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<CulturePattern | null> {
    const row = await this.prisma.pattern.findUnique({
      where: { id },
      include: { origin: true, colors: true, symbols: true, artisanQuote: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<CulturePattern | null> {
    const row = await this.prisma.pattern.findUnique({
      where: { slug },
      include: { origin: true, colors: true, symbols: true, artisanQuote: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlugRaw(slug: string) {
    return await this.prisma.pattern.findUnique({
      where: { slug },
      include: { origin: true, colors: true, symbols: true, artisanQuote: true },
    });
  }

  async findMany(opts: FindPatternsOptions): Promise<FindResult<CulturePattern>> {
    const { page = 1, perPage = 20, search } = opts;
    const skip = (page - 1) * perPage;

    const where: Prisma.PatternWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { nameLocal: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [rows, totalItems] = await Promise.all([
      this.prisma.pattern.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { origin: true, colors: true, symbols: true, artisanQuote: true },
      }),
      this.prisma.pattern.count({ where }),
    ]);

    return { items: rows.map(r => this.toDomain(r)), totalItems };
  }

  async save(pattern: CulturePattern): Promise<CulturePattern> {
    const data = this.toPersistence(pattern);
    const row  = await this.prisma.pattern.create({ data });
    return this.toDomain(row);
  }

  async update(pattern: CulturePattern): Promise<CulturePattern> {
    const props = pattern.toObject();
    
    const data: any = {
      // Ne pas mettre à jour le slug pour éviter les conflits
      name: props.name || '',
      nameLocal: props.nameLocal || 'Unknown',
      imgUrl: props.imgUrl || '',
      type: props.type,
      cssClass: props.cssClass,
      era: props.era,
      license: props.license,
      summary: props.summary,
      history: props.history,
      technique: props.technique,
      symbolism: props.symbolism,
      ceremonial: props.ceremonial,
      sources: props.sources,
      downloads: props.downloads,
      views: props.views,
      status: props.status,
      isFeatured: props.isFeatured,
      updatedAt: props.updatedAt,
    };

    // Lier le creator si createdById exists
    if (props.createdById) {
      data.creator = { connect: { id: props.createdById } };
    }

    // Upsert origin relation
    if (props.origin) {
      data.origin = {
        upsert: {
          create: {
            id: `${props.id}_origin`,
            people: props.origin.people,
            region: props.origin.region,
            country: props.origin.country,
            flag: props.origin.flag,
            coords: props.origin.coords,
          },
          update: {
            people: props.origin.people,
            region: props.origin.region,
            country: props.origin.country,
            flag: props.origin.flag,
            coords: props.origin.coords,
          },
        },
      };
    }

    // Upsert symbolism relation
    if (props.symbolism) {
      data.symbolism = {
        upsert: {
          create: {
            id: `${props.id}_symbolism`,
            meaning: props.symbolism.meaning,
            keywords: props.symbolism.keywords,
            usage: props.symbolism.usage,
          },
          update: {
            meaning: props.symbolism.meaning,
            keywords: props.symbolism.keywords,
            usage: props.symbolism.usage,
          },
        },
      };
    }

    // Upsert artisanQuote relation
    if (props.artisanQuote) {
      data.artisanQuote = {
        upsert: {
          create: {
            id: `${props.id}_quote`,
            text: props.artisanQuote.text,
            author: props.artisanQuote.author,
            role: props.artisanQuote.role,
            country: props.artisanQuote.country,
          },
          update: {
            text: props.artisanQuote.text,
            author: props.artisanQuote.author,
            role: props.artisanQuote.role,
            country: props.artisanQuote.country,
          },
        },
      };
    }

    // Delete and recreate colors and symbols (simpler approach)
    if (props.colors && props.colors.length > 0) {
      await this.prisma.patternColor.deleteMany({ where: { patternId: props.id } });
      data.colors = {
        create: props.colors.map((color: any) => ({
          hex: color.hex,
          name: color.name,
          meaning: color.meaning,
        })),
      };
    }

    if (props.symbols && props.symbols.length > 0) {
      await this.prisma.symbol.deleteMany({ where: { patternId: props.id } });
      data.symbols = {
        create: props.symbols.map((symbol: any) => ({
          name: symbol.name,
          nameFr: symbol.nameFr,
          cssPreview: symbol.cssPreview,
          imageUrl: symbol.imageUrl || '',
          meaning: symbol.meaning,
          usage: symbol.usage,
          sacred: symbol.sacred,
        })),
      };
    }

    const row = await this.prisma.pattern.update({ where: { id: props.id }, data });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.pattern.delete({ where: { id } });
  }

  async exists(slug: string): Promise<boolean> {
    const count = await this.prisma.pattern.count({ where: { slug } });
    return count > 0;
  }

  // ── Mappers Domain ↔ Persistence ─────────────────────────────────────────
  private toDomain(row: any): CulturePattern {
    return CulturePattern.create({
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameLocal: row.nameLocal,
      imgUrl: row.imgUrl,
      type: row.type as PatternType,
      cssClass: row.cssClass,
      era: row.era,
      license: row.license,
      summary: row.summary,
      history: row.history,
      technique: row.technique,
      symbolism: row.symbolism,
      ceremonial: row.ceremonial,
      sources: row.sources || [],
      downloads: row.downloads || 0,
      views: row.views || 0,
      status: row.status,
      isFeatured: row.isFeatured || false,
      origin: row.origin || undefined,
      colors: row.colors || undefined,
      symbols: row.symbols || undefined,
      artisanQuote: row.artisanQuote || undefined,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toPersistence(pattern: CulturePattern): Prisma.PatternCreateInput & { id: string } {
    const props = pattern.toObject();
    
    const data: any = {
      id: props.id,
      slug: props.slug,
      name: props.name || '',
      nameLocal: props.nameLocal || 'Unknown',
      imgUrl: props.imgUrl || '',
      type: props.type,
      cssClass: props.cssClass,
      era: props.era,
      license: props.license,
      summary: props.summary,
      history: props.history,
      technique: props.technique,
      symbolism: props.symbolism,
      ceremonial: props.ceremonial,
      sources: props.sources,
      downloads: props.downloads,
      views: props.views,
      status: props.status,
      isFeatured: props.isFeatured,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };

    // Lier le creator si createdById exists
    if (props.createdById) {
      data.creator = { connect: { id: props.createdById } };
    }

    // Créer les relations si présentes
    if (props.origin) {
      data.origin = {
        create: {
          id: `${props.id}_origin`,
          people: props.origin.people,
          region: props.origin.region,
          country: props.origin.country,
          flag: props.origin.flag,
          coords: props.origin.coords,
        },
      };
    }

    if (props.colors && props.colors.length > 0) {
      data.colors = {
        create: props.colors.map((color: any) => ({
          hex: color.hex,
          name: color.name,
          meaning: color.meaning,
        })),
      };
    }

    if (props.symbols && props.symbols.length > 0) {
      data.symbols = {
        create: props.symbols.map((symbol: any) => ({
          name: symbol.name,
          nameFr: symbol.nameFr,
          cssPreview: symbol.cssPreview,
          imageUrl: symbol.imageUrl || '',
          meaning: symbol.meaning,
          usage: symbol.usage,
          sacred: symbol.sacred,
        })),
      };
    }

    if (props.symbolism) {
      data.symbolism = {
        create: {
          id: `${props.id}_symbolism`,
          meaning: props.symbolism.meaning,
          keywords: props.symbolism.keywords,
          usage: props.symbolism.usage,
        },
      };
    }

    if (props.artisanQuote) {
      data.artisanQuote = {
        create: {
          id: `${props.id}_quote`,
          text: props.artisanQuote.text,
          author: props.artisanQuote.author,
          role: props.artisanQuote.role,
          country: props.artisanQuote.country,
        },
      };
    }

    return data;
  }
}

