export interface PatternColor {
  hex: string;
  name: string;
  meaning: string;
}

export interface PatternSymbol {
  name: string;
  nameFr: string;
  cssPreview: string;
  meaning: string;
  usage: string;
  sacred: boolean;
  imageUrl?: string;
}

export interface PatternOrigin {
  people: string;
  region: string;
  country: string;
  flag: string;
  coords: [number, number];
}

export interface ArtisanQuote {
  text: string;
  author: string;
  role: string;
  country: string;
}

export interface PatternSymbolism {
  meaning: string;
  keywords?: string[];
  usage: string;
}

export interface PatternDoc {
  id: string;
  slug: string;
  name: string;
  nameLocal: string;
  imgUrl: string;
  type: string;
  cssClass: string;
  status: string;
  isFeatured: boolean;
  origin: PatternOrigin;
  era: string;
  license: string;
  colors: PatternColor[];
  summary: string;
  history: string;
  technique: string;
  symbolism: PatternSymbolism;
  ceremonial: string;
  symbols: PatternSymbol[];
  artisanQuote?: ArtisanQuote;
  sources: string[];
  downloads: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export function toPatternDoc(domain: any): PatternDoc {
  return {
    id: domain.id,
    slug: domain.slug,
    name: domain.name,
    nameLocal: domain.nameLocal,
    imgUrl: domain.imgUrl,
    type: domain.type,
    cssClass: domain.cssClass,
    status: domain.status,
    isFeatured: domain.isFeatured,
    origin: {
      people: domain.origin?.people || '',
      region: domain.origin?.region || '',
      country: domain.origin?.country || '',
      flag: domain.origin?.flag || '',
      coords: (domain.origin?.coords as [number, number]) || [0, 0],
    },
    era: domain.era || '',
    license: domain.license || 'cc-by',
    colors: (domain.colors || []) as PatternColor[],
    summary: domain.summary || '',
    history: domain.history || '',
    technique: domain.technique || '',
    symbolism: domain.symbolism,
    ceremonial: domain.ceremonial || '',
    symbols: (domain.symbols || []) as PatternSymbol[],
    artisanQuote: domain.artisanQuote
      ? {
          text: domain.artisanQuote.text,
          author: domain.artisanQuote.author,
          role: domain.artisanQuote.role,
          country: domain.artisanQuote.country,
        }
      : undefined,
    sources: domain.sources || [],
    downloads: domain.downloads || 0,
    views: domain.views || 0,
    createdAt: domain.createdAt.toISOString(),
    updatedAt: domain.updatedAt.toISOString(),
  };
}
