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
import { CulturePattern, Symbolism, type CulturePatternProps, type PatternType } from '../domain/CulturePattern';
import type { ICultureRepository, FindPatternsOptions } from '../domain/ICultureRepository';
import type { PaginationMeta } from '@/shared/types/api.types';
import { NotFoundError, ConflictError, ForbiddenError } from '@/shared/errors/AppError';
import { buildMeta, parsePagination } from '@/shared/utils/pagination';

// ── DTOs (Data Transfer Objects) ──────────────────────────────────────────────

export interface CreatePatternDto {
  name:       string;
  nameLocal:  string;
  imgUrl:     string;
  type:       PatternType;
  cssClass:   string;
  era?:       string;
  license?:   string;
  summary:    string;
  history:    string;
  technique:  string;
  symbolism:  Symbolism;
  ceremonial: string;
  sources?:   string[];
  createdById?: string;
  colors?:    any[];
  symbols?:   any[];
  origin?:    any;
  artisanQuote?: any;
  symbolUsage?: string;
  svgPattern?: string;
}

export interface UpdatePatternDto extends Partial<CreatePatternDto> {}

export interface QueryPatternDto extends FindPatternsOptions {
  page?:    number;
  perPage?: number;
}

export interface PatternListResult {
  items: CulturePattern[];
  meta:  PaginationMeta;
}

// ── Service ───────────────────────────────────────────────────────────────────
export class CultureService {
  constructor(private readonly repository: ICultureRepository) {}

  // ── Cas d'usage : lister les motifs ───────────────────────────────────────
  async listPatterns(query: QueryPatternDto, requesterId?: string): Promise<PatternListResult> {
    const { page, perPage, skip } = parsePagination(query);

    const { items, totalItems } = await this.repository.findMany({
      ...query,
      page, perPage,
      onlyPublished: !requesterId,
    });

    return { items, meta: buildMeta(totalItems, page, perPage) };
  }

  // ── Cas d'usage : récupérer un motif ──────────────────────────────────────
  async getPatternBySlug(slug: string): Promise<CulturePattern> {
    const pattern = await this.repository.findBySlug(slug);
    if (!pattern) { throw new NotFoundError(`Motif "${slug}"`); }

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
      id:          randomUUID(),
      slug,
      name:        dto.name,
      nameLocal:   dto.nameLocal,
      imgUrl:      dto.imgUrl ?? null,
      type:        dto.type,
      cssClass:    dto.cssClass,
      era:         dto.era ?? null,
      license:     dto.license ?? null,
      summary:     dto.summary,
      history:     dto.history,
      technique:   dto.technique,
      symbolism:   dto.symbolism,
      ceremonial:  dto.ceremonial,
      sources:     dto.sources ?? [],
      downloads:   0,
      views:       0,
      status:      'DRAFT',
      isFeatured:  false,
      createdById: dto.createdById ?? 'system',
      createdAt:   new Date(),
      updatedAt:   new Date(),
      origin:      dto.origin,
      colors:      dto.colors,
      symbols:     dto.symbols,
      artisanQuote: dto.artisanQuote,
    });

    return this.repository.save(pattern);
  }

  // ── Cas d'usage : mettre à jour un motif ──────────────────────────────────
  async updatePattern(id: string, dto: UpdatePatternDto, requesterRole: string): Promise<CulturePattern> {
    const pattern = await this.repository.findById(id);
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }

    if (!this.isCuratorOrAdmin(requesterRole)) {
      throw new ForbiddenError('Seuls les curateurs, admins et super_admins peuvent modifier');
    }

    // Vérifier si le slug a changé et si le nouveau slug existe déjà
    if (dto.nameLocal && dto.nameLocal !== pattern.nameLocal) {
      const newSlug = this.generateSlug(dto.nameLocal);
      if (newSlug !== pattern.slug && await this.repository.exists(newSlug)) {
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
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }

    return this.repository.update(pattern.feature());
  }

  // ── Cas d'usage : retirer la mise en avant d'un motif ─────────────────────
  async unfeaturePattern(id: string, requesterRole: string): Promise<CulturePattern> {
    if (!this.isAdminLike(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent retirer la mise en avant');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }

    return this.repository.update(pattern.unfeature());
  }

  // ── Cas d'usage : mettre à jour le statut d'un motif ───────────────────────
  async updatePatternStatus(id: string, status: string, requesterRole: string): Promise<CulturePattern> {
    if (!['admin', 'super_admin'].includes(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent modifier le statut');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }

    const updated = pattern.updateStatus(status.toUpperCase() as any);
    return this.repository.update(updated);
  }

  // ── Cas d'usage : incrémenter les téléchargements ─────────────────────────
  async trackDownload(slug: string): Promise<CulturePattern> {
    const pattern = await this.repository.findBySlug(slug);
    if (!pattern) { throw new NotFoundError(`Motif "${slug}"`); }

    return this.repository.update(pattern.incrementDownload());
  }

  // ── Cas d'usage : récupérer un motif pour téléchargement ─────────────────────
  async getPatternForDownload(id: string): Promise<CulturePattern> {
    const pattern = await this.repository.findById(id);
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }
    return pattern;
  }

  // ── Cas d'usage : incrémenter le compteur de téléchargements par ID ───────────
  async incrementDownload(id: string): Promise<void> {
    const pattern = await this.repository.findById(id);
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }
    
    const updated = pattern.incrementDownload();
    await this.repository.update(updated);
  }

  // ── Cas d'usage : supprimer un motif ──────────────────────────────────────
  async deletePattern(id: string, requesterRole: string): Promise<void> {
    if (!this.isAdminLike(requesterRole)) {
      throw new ForbiddenError('Seuls les admins et super_admins peuvent supprimer');
    }

    const pattern = await this.repository.findById(id);
    if (!pattern) { throw new NotFoundError(`Motif #${id}`); }

    await this.repository.delete(id);
  }

  // ── Utilitaires de rôle ───────────────────────────────────────────────────
  private normalizeRole(role?: string): string {
    return (role ?? '').toLowerCase();
  }

  private isCuratorOrAdmin(role?: string): boolean {
    const normalized = this.normalizeRole(role);
    return ['curator', 'admin', 'super_admin'].includes(normalized);
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

