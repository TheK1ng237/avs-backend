import { CultureService } from '@/modules/culture/application/culture.service';
import type { ICultureRepository } from '@/modules/culture/domain/ICultureRepository';
import { CulturePattern, type Symbol } from '@/modules/culture/domain/CulturePattern';
import { ForbiddenError, NotFoundError } from '@/shared/errors/AppError';

const pattern = CulturePattern.create({
  id: 'pattern-1',
  slug: 'kente-royal',
  name: 'Royal Kente',
  nameLocal: 'Kente',
  imgUrl: '',
  createdById: 'curator-1',
  type: 'KENTE',
  cssClass: 'kente',
  era: null,
  license: 'cc-by',
  summary: 'A documented pattern with sufficient description.',
  history: '',
  technique: '',
  symbolism: { meaning: '', keywords: [], usage: '' },
  ceremonial: '',
  sources: [],
  downloads: 0,
  views: 0,
  status: 'DRAFT',
  isFeatured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const symbol: Symbol = {
  id: 'symbol-1',
  name: 'Sankofa',
  nameFr: 'Revenir en arrière pour avancer',
  cssPreview: '#D4A017',
  imageUrl: '',
  meaning: 'Learning from the past to build a better future.',
  usage: 'Used in teaching and cultural remembrance.',
  sacred: false,
  status: 'DRAFT',
  createdById: 'curator-1',
  patternId: 'pattern-1',
};

const repository: jest.Mocked<ICultureRepository> = {
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findSymbols: jest.fn(),
  findSymbolById: jest.fn(),
  createSymbol: jest.fn(),
  updateSymbol: jest.fn(),
  updateSymbolStatus: jest.fn(),
  deleteSymbol: jest.fn(),
};

const service = new CultureService(repository);

describe('CultureService symbol management', () => {
  beforeEach(() => jest.clearAllMocks());

  it('limits anonymous symbol listings to published symbols', async () => {
    repository.findSymbols.mockResolvedValue([]);

    await service.listPublishedSymbols();

    expect(repository.findSymbols).toHaveBeenCalledWith({ onlyPublished: true });
  });

  it('limits contributor listings to their own symbols', async () => {
    repository.findSymbols.mockResolvedValue([]);

    await service.listSymbols('contributor-1', 'contributor');

    expect(repository.findSymbols).toHaveBeenCalledWith({ createdById: 'contributor-1' });
  });

  it('lets admins list every symbol', async () => {
    repository.findSymbols.mockResolvedValue([]);

    await service.listSymbols('admin-1', 'admin');

    expect(repository.findSymbols).toHaveBeenCalledWith({});
  });

  it('creates a symbol on an existing pattern for a curator', async () => {
    repository.findById.mockResolvedValue(pattern);
    repository.createSymbol.mockResolvedValue(symbol);
    const data = {
      name: symbol.name,
      nameFr: symbol.nameFr,
      cssPreview: symbol.cssPreview,
      imageUrl: symbol.imageUrl,
      meaning: symbol.meaning,
      usage: symbol.usage,
      sacred: symbol.sacred,
    };

    await expect(service.createSymbol('pattern-1', data, 'curator-1', 'curator')).resolves.toEqual(
      symbol,
    );
    expect(repository.createSymbol).toHaveBeenCalledWith('pattern-1', 'curator-1', data);
  });

  it('rejects symbol creation for a missing pattern', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.createSymbol(
        'missing-pattern',
        {
          name: symbol.name,
          nameFr: symbol.nameFr,
          cssPreview: symbol.cssPreview,
          imageUrl: symbol.imageUrl,
          meaning: symbol.meaning,
          usage: symbol.usage,
          sacred: symbol.sacred,
        },
        'curator-1',
        'curator',
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects symbol modifications from contributors', async () => {
    await expect(service.deleteSymbol('symbol-1', 'contributor-1', 'contributor')).rejects.toThrow(
      ForbiddenError,
    );
    expect(repository.findSymbolById).not.toHaveBeenCalled();
  });

  it('prevents a curator from editing another author’s symbol', async () => {
    repository.findSymbolById.mockResolvedValue(symbol);

    await expect(
      service.updateSymbol('symbol-1', { meaning: 'Changed meaning.' }, 'curator-2', 'curator'),
    ).rejects.toThrow(ForbiddenError);
    expect(repository.updateSymbol).not.toHaveBeenCalled();
  });

  it('allows only admins to change symbol publication status', async () => {
    await expect(service.updateSymbolStatus('symbol-1', 'PUBLISHED', 'curator')).rejects.toThrow(
      ForbiddenError,
    );

    repository.findSymbolById.mockResolvedValue(symbol);
    repository.updateSymbolStatus.mockResolvedValue({ ...symbol, status: 'PUBLISHED' });
    await expect(
      service.updateSymbolStatus('symbol-1', 'PUBLISHED', 'admin'),
    ).resolves.toMatchObject({
      status: 'PUBLISHED',
    });
  });
});
