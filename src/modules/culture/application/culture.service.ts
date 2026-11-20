// =============================================================================
// Application Service — CultureService
// Orchestration des cas d'usage (Use Cases).
// Équivalent Java : @Service CultureService
//
// NOTE ARCHITECTURALE : Ce service ne connaît PAS Prisma, MongoDB ou Express.
// Il parle uniquement au Repository via l'interface ICultureRepository.
// Pour migrer vers Java, réimplémenter ICultureRepository avec Spring Data JPA.
// =============================================================================

import { randomUUID } from 'crypto';
import {
  CulturePattern,
  Symbolism,
  type CulturePatternProps,
  type PatternType,
  type Status,
  type Symbol,
} from '../domain/CulturePattern';
import type {
  ICultureRepository,
  FindPatternsOptions,
  FindSymbolsOptions,
  CreateSymbolData,
  UpdateSymbolData,
  SymbolEntry,
} from '../domain/ICultureRepository';
import type { PaginationMeta } from '@/shared/types/api.types';
import { NotFoundError, ConflictError, ForbiddenError } from '@/shared/errors/AppError';
import { buildMeta, parsePagination } from '@/shared/utils/pagination';

// ── DTOs (Data Transfer Objects) ──────────────────────────────────────────────

export interface CreatePatternDto {
  name: string;
  nameLocal: string;
  imgUrl: string;
  type: PatternType;
  cssClass: string;
  era?: string;
  license?: string;
  summary: string;
  history: string;
  technique: string;
  symbolism: Symbolism;
  ceremonial: string;
  sources?: string[];
  createdById?: string;
  colors?: any[];
  symbols?: any[];
  origin?: any;
  artisanQuote?: any;
  symbolUsage?: string;
  format?: 'SVG' | 'CSS' | 'HYBRID';
  cssCode?: string | null;
  svgContent?: string | null;
}

export interface UpdatePatternDto extends Partial<CreatePatternDto> {}

export interface QueryPatternDto extends FindPatternsOptions {
  page?: number;
  perPage?: number;
}

export interface PatternListResult {
  items: CulturePattern[];
  meta: PaginationMeta;
}

export interface CreateCultureSymbolDto extends CreateSymbolData {}

export interface UpdateCultureSymbolDto extends UpdateSymbolData {}

// ── Service ───────────────────────────────────────────────────────────────────
export class CultureService {
  constructor(private readonly repository: ICultureRepository) {}

  // ── Cas d'usage : lister les motifs ───────────────────────────────────────
  async listPatterns(query: QueryPatternDto, requesterId?: string): Promise<PatternListResult> {
    const { page, perPage, skip } = parsePagination(query);

    const { items, totalItems } = await this.repository.findMany({
      ...query,
      page,
      perPage,
      onlyPublished: !requesterId,
    });

    return { items, meta: buildMeta(totalItems, page, perPage) };
  }

  // ── Cas d'usage : récupérer un motif ──────────────────────────────────────
  async getPatternBySlug(slug: string): Promise<CulturePattern> {
    const pattern = await this.repository.findBySlug(slug);
    if (!pattern) {
      throw new NotFoundError(`Motif "${slug}"`);
    }

    const updated = pattern.incrementView();
    return this.repository.update(updated);
  }

  // ── Cas d'usage : créer un motif ──────────────────────────────────────────
  async createPattern(dto: CreatePatternDto): Promise<CulturePattern> {
    const slug = this.generateSlug(dto.nameLocal);

    if (await this.repository.exists(slug)) {
      throw new ConflictError(`Motif avec le slug "${slug}"`);
    }

    const pattern = CulturePattern.create({
      id: randomUUID(),
      slug,
      name: dto.name,
      nameLocal: dto.nameLocal,
      imgUrl: dto.imgUrl ?? null,
      type: dto.type,
      format: dto.format ?? (dto.imgUrl ? 'SVG' : 'CSS'),
      cssClass: dto.cssClass,
      cssCode: dto.cssCode,
      svgContent: dto.svgContent,
      era: dto.era ?? null,
      license: dto.license ?? null,
      summary: dto.summary,
      history: dto.history,
      technique: dto.technique,
      symbolism: dto.symbolism,
      ceremonial: dto.ceremonial,
      sources: dto.sources ?? [],
      downloads: 0,
      views: 0,
      status: 'DRAFT',
      isFeatured: false,
      createdById: dto.createdById ?? 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      origin: dto.origin,
      colors: dto.colors,
      symbols: dto.symbols,
      artisanQuote: dto.artisanQuote,
    });

    return this.repository.save(pattern);
  }

  // ── Cas d'usage : mettre à jour un motif ──────────────────────────────────
  async updatePattern(
    id: string,
    dto: UpdatePatternDto,
    requesterRole: string,
  ): Promise<CulturePattern> {
    const pattern = await this.repository.findById(id);
    if (!pattern) {
      throw new NotFoundError(`Motif #${id}`);
    }

    if (!this.isCuratorOrAdmin(requesterRole)) {
      throw new ForbiddenError('Seuls les curateurs, admins et super_admins peuvent modifier');
    }

    // Vérifier si le slug a changé et si le nouveau slug existe déjà
    if (dto.nameLocal && dto.nameLocal !== pattern.nameLocal) {
      const newSlug = this.generateSlug(dto.nameLocal);
      if (newSlug !== pattern.slug && (await this.repository.exists(newSlug))) {
        throw new ConflictError(`Motif avec le slug "${newSlug}" existe déjà`);
      }
    }

    // Ne pas inclure le slug dans les updates pour éviter les conflits
    const { slug, ...dtoWithoutSlug } = dto as any;
    const updated = pattern.update(dtoWithoutSlug);
    return this.repository.update(updated);
  }

  // ── Cas d'usage : mettre en avant un motif ────────────────────────────────
  async featurePattern(id: string, requesterRole: string): Promise<CulturePattern> {
    if (!this.isAdminLike(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent mettre en avant un motif');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) {
      throw new NotFoundError(`Motif #${id}`);
    }

    return this.repository.update(pattern.feature());
  }

  // ── Cas d'usage : retirer la mise en avant d'un motif ─────────────────────
  async unfeaturePattern(id: string, requesterRole: string): Promise<CulturePattern> {
    if (!this.isAdminLike(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent retirer la mise en avant');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) {
      throw new NotFoundError(`Motif #${id}`);
    }

    return this.repository.update(pattern.unfeature());
  }

  // ── Cas d'usage : mettre à jour le statut d'un motif ───────────────────────
  async updatePatternStatus(
    id: string,
    status: string,
    requesterRole: string,
  ): Promise<CulturePattern> {
    if (!['admin', 'super_admin'].includes(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent modifier le statut');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) {
      throw new NotFoundError(`Motif #${id}`);
    }

    const updated = pattern.updateStatus(status.toUpperCase() as any);
    return this.repository.update(updated);
  }

  // ── Cas d'usage : incrémenter les téléchargements ─────────────────────────
  async trackDownload(slug: string): Promise<CulturePattern> {
    const pattern = await this.repository.findBySlug(slug);
    if (!pattern) {
      throw new NotFoundError(`Motif "${slug}"`);
    }

    return this.repository.update(pattern.incrementDownload());
  }

  // ── Cas d'usage : récupérer un motif pour téléchargement ─────────────────────
  async getPatternForDownload(idOrSlug: string): Promise<CulturePattern> {
    const pattern = await this.repository.findByIdOrSlug(idOrSlug);
    if (!pattern) {
      throw new NotFoundError(`Motif #${idOrSlug}`);
    }
    return pattern;
  }

  // ── Cas d'usage : incrémenter le compteur de téléchargements par ID ───────────
  async incrementDownload(id: string): Promise<void> {
    const pattern = await this.repository.findById(id);
    if (!pattern) {
      throw new NotFoundError(`Motif #${id}`);
    }

    const updated = pattern.incrementDownload();
    await this.repository.update(updated);
  }

  // ── Cas d'usage : supprimer un motif ──────────────────────────────────────
  async deletePattern(id: string, requesterRole: string): Promise<void> {
    if (!this.isAdminLike(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent supprimer');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) {
      throw new NotFoundError(`Motif #${id}`);
    }

    await this.repository.delete(id);
  }

  async listSymbols(requesterId?: string, requesterRole?: string): Promise<SymbolEntry[]> {
    if (this.isAdminLike(requesterRole)) return this.repository.findSymbols({});
    if (!requesterId) return this.repository.findSymbols({ onlyPublished: true });
    return this.repository.findSymbols({ createdById: requesterId });
  }

  async listPublishedSymbols(): Promise<SymbolEntry[]> {
    return this.repository.findSymbols({ onlyPublished: true });
  }

  async createSymbol(
    patternId: string | null,
    dto: CreateCultureSymbolDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<Symbol> {
    if (!this.isCuratorOrAdmin(requesterRole)) {
      throw new ForbiddenError('Seuls les curateurs et administrateurs peuvent créer un symbole');
    }

    if (patternId && !(await this.repository.findById(patternId))) {
      throw new NotFoundError(`Motif #${patternId}`);
    }

    return this.repository.createSymbol(patternId, requesterId, dto);
  }

  async updateSymbol(
    id: string,
    dto: UpdateCultureSymbolDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<Symbol> {
    this.assertCanManageRole(requesterRole);
    const symbol = await this.repository.findSymbolById(id);
    if (!symbol) {
      throw new NotFoundError(`Symbole #${id}`);
    }
    this.assertCanManageSymbol(symbol, requesterId, requesterRole);

    return this.repository.updateSymbol(id, dto);
  }

  async getSymbolById(id: string, requesterId: string, requesterRole: string): Promise<Symbol> {
    this.assertCanManageRole(requesterRole);
    const symbol = await this.repository.findSymbolById(id);
    if (!symbol) {
      throw new NotFoundError(`Symbole #${id}`);
    }

    this.assertCanManageSymbol(symbol, requesterId, requesterRole);
    return symbol;
  }

  async deleteSymbol(id: string, requesterId: string, requesterRole: string): Promise<void> {
    this.assertCanManageRole(requesterRole);
    const symbol = await this.repository.findSymbolById(id);
    if (!symbol) {
      throw new NotFoundError(`Symbole #${id}`);
    }
    this.assertCanManageSymbol(symbol, requesterId, requesterRole);

    await this.repository.deleteSymbol(id);
  }

  async updateSymbolStatus(id: string, status: Status, requesterRole: string): Promise<Symbol> {
    if (!this.isAdminLike(requesterRole)) {
      throw new ForbiddenError('Seuls les administrateurs peuvent changer le statut d’un symbole');
    }

    if (!(await this.repository.findSymbolById(id))) {
      throw new NotFoundError(`Symbole #${id}`);
    }

    return this.repository.updateSymbolStatus(id, status);
  }

  // ── Utilitaires de rôle ───────────────────────────────────────────────────
  private normalizeRole(role?: string): string {
    return (role ?? '').toLowerCase();
  }

  private isCuratorOrAdmin(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['curator', 'admin', 'super_admin'].includes(normalized);
  }

  private assertCanManageSymbol(symbol: Symbol, requesterId: string, requesterRole: string): void {
    this.assertCanManageRole(requesterRole);
    if (!this.isAdminLike(requesterRole) && symbol.createdById !== requesterId) {
      throw new ForbiddenError('Vous ne pouvez gérer que les symboles dont vous êtes l’auteur');
    }
  }

  private assertCanManageRole(requesterRole: string): void {
    if (!this.isCuratorOrAdmin(requesterRole)) {
      throw new ForbiddenError('Un rôle curateur ou administrateur est requis');
    }
  }

  private isAdminLike(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['admin', 'super_admin'].includes(normalized);
  }

  // ── Utilitaire : génération de slug ───────────────────────────────────────
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 64);
  }
}
