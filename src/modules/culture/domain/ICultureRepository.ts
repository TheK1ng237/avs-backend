// =============================================================================
// Repository Interface — Port (Hexagonal Architecture)
// Équivalent Java : interface CultureRepository (Spring Data JPA)
//
// MIGRATION PATH : Pour migrer vers Java/Spring Boot, implémenter cette
// interface côté Java. La couche Application (Service) n'a pas besoin de changer.
// =============================================================================

import type { CulturePattern, PatternType, Origin, Symbol } from './CulturePattern';

export interface FindPatternsOptions {
  page?: number;
  perPage?: number;
  region?: Origin;
  patternType?: PatternType;
  search?: string;
  onlyPublished?: boolean;
  createdById?: string;
}

export interface FindResult<T> {
  items: T[];
  totalItems: number;
}

export interface FindSymbolsOptions {
  onlyPublished?: boolean;
  createdById?: string;
}

export interface SymbolEntry extends Symbol {
  pattern: {
    id: string;
    slug: string;
    name: string;
    nameLocal: string;
    type: PatternType;
    status: string;
    sources: string[];
    origin: {
      people: string;
      region: string;
      country: string;
      flag: string;
    } | null;
  } | null;
}

export interface CreateSymbolData {
  name: string;
  nameFr: string;
  cssPreview: string;
  imageUrl: string;
  imageKey?: string | null;
  meaning: string;
  usage: string;
  sacred: boolean;
}

export type UpdateSymbolData = Partial<CreateSymbolData>;

// Port — contrat indépendant de l'implémentation
export interface ICultureRepository {
  findById(id: string): Promise<CulturePattern | null>;
  findBySlug(slug: string): Promise<CulturePattern | null>;
  findMany(options: FindPatternsOptions): Promise<FindResult<CulturePattern>>;
  save(pattern: CulturePattern): Promise<CulturePattern>;
  update(pattern: CulturePattern): Promise<CulturePattern>;
  delete(id: string): Promise<void>;
  exists(slug: string): Promise<boolean>;
  findSymbols(options: FindSymbolsOptions): Promise<SymbolEntry[]>;
  findSymbolById(id: string): Promise<Symbol | null>;
  createSymbol(patternId: string | null, data: CreateSymbolData): Promise<Symbol>;
  updateSymbol(id: string, data: UpdateSymbolData): Promise<Symbol>;
  deleteSymbol(id: string): Promise<void>;
}
