// =============================================================================
// Domain Entity — CulturePattern
// Logique métier pure, indépendante de toute infrastructure.
// Équivalent Java : @Entity + Domain Object Pattern
// =============================================================================

export type PatternType = 'KENTE' | 'BOGOLAN' | 'ADINKRA' | 'NDEBELE' | 'KUBA' | 'NDOP' | 'WAX' | 'BERBER';
export type Status = 'DRAFT' | 'PUBLISHED' | 'REVIEW' | 'REJECTED';

// ── Interfaces des relations ───────────────────────────────────────────────────

export interface Origin {
  id:        string;
  people:    string;
  region:    string;
  country:   string;
  flag:      string;
  coords:    number[];
  patternId: string;
}

export interface PatternColor {
  id:        string;
  hex:       string;
  name:      string;
  meaning:   string;
  patternId: string;
}

export interface Symbol {
  id:         string;
  name:       string;
  nameFr:     string;
  cssPreview: string;
  imageUrl:   string;
  meaning:    string;
  usage:      string;
  sacred:     boolean;
  patternId:  string;
}

export interface ArtisanQuote {
  id:        string;
  text:      string;
  author:    string;
  role:      string;
  country:   string;
  patternId: string;
}

export interface Comment {
  id:        string;
  content:   string;
  rating?:   number;
  userId:    string;
  verified:  boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Props du domaine ───────────────────────────────────────────────────────────

export interface CulturePatternProps {
  // ── Identité ──────────────────────────────────────
  id:        string;
  slug:      string;
  name:      string | null;
  nameLocal: string;
  imgUrl:    string | null;
  createdById:string;

  // ── Classification ────────────────────────────────
  type:      PatternType;
  cssClass:  string;
  era:       string | null;
  license:   string | null;

  // ── Contenu textuel ───────────────────────────────
  summary:    string;
  history:    string;
  technique:  string;
  symbolism:  Symbolism;
  ceremonial: string;
  sources:    string[];

  // ── Stats ─────────────────────────────────────────
  downloads: number;
  views:     number;

  // ── Flags ─────────────────────────────────────────
  status: Status;
  isFeatured:  boolean;

  // ── Relations ─────────────────────────────────────
  origin?:       Origin;
  colors?:       PatternColor[];
  symbols?:      Symbol[];
  artisanQuote?: ArtisanQuote;
  comments?:     Comment[];

  // ── Timestamps ────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
}

export interface Symbolism{
  meaning: string;
  keywords: string[];
  usage: string
}

// ── Entité domaine ─────────────────────────────────────────────────────────────

export class CulturePattern {
  private constructor(private readonly props: CulturePatternProps) {}

  static create(props: CulturePatternProps): CulturePattern {
    // Règles métier (invariants)
    if (!props.slug.match(/^[a-z0-9-]+$/)) {
      throw new Error('Slug invalide : minuscules, chiffres et tirets uniquement');
    }
    return new CulturePattern(props);
  }

  // ── Accesseurs (immutabilité) ──────────────────────────────────────────────

  get id():          string          { return this.props.id; }
  get slug():        string          { return this.props.slug; }
  get name():        string | null   { return this.props.name; }
  get nameLocal():   string          { return this.props.nameLocal; }
  get imgUrl():      string | null   { return this.props.imgUrl; }
  get createdById(): string          {return this.props.createdById;}

  get type():        PatternType     { return this.props.type; }
  get cssClass():    string          { return this.props.cssClass; }
  get era():         string | null   { return this.props.era; }
  get license():     string | null   { return this.props.license; }

  get summary():     string          { return this.props.summary; }
  get history():     string          { return this.props.history; }
  get technique():   string          { return this.props.technique; }
  get symbolism():   Symbolism          { return this.props.symbolism; }
  get ceremonial():  string          { return this.props.ceremonial; }
  get sources():     string[]        { return [...this.props.sources]; }

  get downloads():   number          { return this.props.downloads; }
  get views():       number          { return this.props.views; }

  get status(): Status         { return this.props.status; }
  get isFeatured():  boolean         { return this.props.isFeatured; }

  get origin():       Origin | undefined       { return this.props.origin; }
  get colors():       PatternColor[] | undefined { return this.props.colors; }
  get symbols():      Symbol[] | undefined     { return this.props.symbols; }
  get artisanQuote(): ArtisanQuote | undefined { return this.props.artisanQuote; }
  get comments():     Comment[] | undefined    { return this.props.comments; }

  get createdAt():   Date            { return this.props.createdAt; }
  get updatedAt():   Date            { return this.props.updatedAt; }

  // ── Comportements domaine ──────────────────────────────────────────────────

  publish(): CulturePattern {
    return new CulturePattern({ ...this.props, status: 'PUBLISHED', updatedAt: new Date() });
  }

  unpublish(): CulturePattern {
    return new CulturePattern({ ...this.props, status: 'DRAFT', updatedAt: new Date() });
  }

  feature(): CulturePattern {
    return new CulturePattern({ ...this.props, isFeatured: true, updatedAt: new Date() });
  }

  unfeature(): CulturePattern {
    return new CulturePattern({ ...this.props, isFeatured: false, updatedAt: new Date() });
  }

  incrementView(): CulturePattern {
    return new CulturePattern({ ...this.props, views: this.props.views + 1 });
  }

  incrementDownload(): CulturePattern {
    return new CulturePattern({ ...this.props, downloads: this.props.downloads + 1 });
  }

  update(updates: Partial<CulturePatternProps>): CulturePattern {
    // Si nameLocal change, régénérer le slug
    let newProps = { ...updates, updatedAt: new Date() };
    if (updates.nameLocal && updates.nameLocal !== this.props.nameLocal) {
      const newSlug = this.generateSlug(updates.nameLocal);
      // Ne changer le slug que s'il est différent de l'actuel
      if (newSlug !== this.props.slug) {
        newProps = { ...newProps, slug: newSlug };
      }
    }
    return new CulturePattern({ ...this.props, ...newProps });
  }

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

  updateStatus(status: Status): CulturePattern {
    return new CulturePattern({ ...this.props, status, updatedAt: new Date() });
  }

  toObject(): CulturePatternProps { return { ...this.props }; }
}