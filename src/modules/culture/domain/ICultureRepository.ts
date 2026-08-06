// =============================================================================
// Repository Interface — Port (Hexagonal Architecture)
// Équivalent Java : interface CultureRepository (Spring Data JPA)
//
// MIGRATION PATH : Pour migrer vers Java/Spring Boot, implémenter cette
// interface côté Java. La couche Application (Service) n'a pas besoin de changer.
// =============================================================================

import type { CulturePattern, PatternType, Origin } from './CulturePattern';

export interface FindPatternsOptions {
  page?:         number;
  perPage?:      number;
  region?:       Origin;
  patternType?:  PatternType;
  search?:       string;
  onlyPublished?:boolean;
  createdById?:  string;
}

export interface FindResult<T> {
  items:      T[];
  totalItems: number;
}

// Port — contrat indépendant de l'implémentation
export interface ICultureRepository {
  findById(id: string): Promise<CulturePattern | null>;
  findBySlug(slug: string): Promise<CulturePattern | null>;
  findMany(options: FindPatternsOptions): Promise<FindResult<CulturePattern>>;
  save(pattern: CulturePattern): Promise<CulturePattern>;
  update(pattern: CulturePattern): Promise<CulturePattern>;
  delete(id: string): Promise<void>;
  exists(slug: string): Promise<boolean>;
}
