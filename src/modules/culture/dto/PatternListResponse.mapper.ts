// =============================================================================
// Response Mapper — PatternListResponse
// Transforme les entités Prisma vers le format de réponse API
// =============================================================================

import type { Prisma } from '@prisma/client';
import type { PatternDoc, PatternSymbol, PatternColor, PatternSymbolism } from './PatternResponse.dto';

export class PatternListResponseMapper {
  static toPatternDoc(
    pattern: Prisma.PatternGetPayload<{
      include: {
        origin: true;
        colors: true;
        symbols: true;
        symbolism:true;
        artisanQuote: true;
      };
    }>,
  ): PatternDoc {
    return {
      id: pattern.id,
      slug: pattern.slug,
      name: pattern.name,
      nameLocal: pattern.nameLocal,
      imgUrl: pattern.imgUrl,
      type: pattern.type,
      cssClass: pattern.cssClass,
      status: pattern.status ?? '',
      isFeatured: pattern.isFeatured,
      origin: {
        people: pattern.origin?.people ?? '',
        region: pattern.origin?.region ?? '',
        country: pattern.origin?.country ?? '',
        flag: pattern.origin?.flag ?? '',
        coords: (pattern.origin?.coords as [number, number]) ?? [0, 0],
      },
      era: pattern.era ?? '',
      license: pattern.license ?? 'cc-by',
      colors: (pattern.colors as PatternColor[]) ?? [],
      summary: pattern.summary,
      history: pattern.history,
      technique: pattern.technique,
      symbolism: {
        meaning:pattern.symbolism?.meaning ?? "",
        keywords:pattern.symbolism?.keywords ,
        usage:pattern.symbolism?.usage ?? ""
      },
      ceremonial: pattern.ceremonial,
      symbols: (pattern.symbols as unknown as PatternSymbol[]) ?? [],
      artisanQuote: pattern.artisanQuote
        ? {
            text: pattern.artisanQuote.text,
            author: pattern.artisanQuote.author,
            role: pattern.artisanQuote.role,
            country: pattern.artisanQuote.country,
          }
        : undefined,
      sources: pattern.sources ?? [],
      downloads: pattern.downloads,
      views: pattern.views,
      createdAt: pattern.createdAt.toISOString(),
      updatedAt: pattern.updatedAt.toISOString(),
    };
  }

  static toPatternDocArray(
    patterns: Prisma.PatternGetPayload<{
      include: {
        origin: true;
        colors: true;
        symbols: true;
        symbolism:true;
        artisanQuote: true;
      };
    }>[],
  ): PatternDoc[] {
    return patterns.map(p => this.toPatternDoc(p));
  }
}
