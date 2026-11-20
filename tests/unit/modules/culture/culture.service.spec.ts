import {
  CultureService,
  type CreatePatternDto,
} from '@/modules/culture/application/culture.service';
import type { ICultureRepository } from '@/modules/culture/domain/ICultureRepository';
import { CulturePattern, type CulturePatternProps } from '@/modules/culture/domain/CulturePattern';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

const mockRepo: jest.Mocked<ICultureRepository> = {
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByIdOrSlug: jest.fn(),
  findMany: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  findSymbols: jest.fn(),
  findSymbolById: jest.fn(),
  createSymbol: jest.fn(),
  updateSymbol: jest.fn(),
  deleteSymbol: jest.fn(),
};

const service = new CultureService(mockRepo);

const makePattern = (overrides: Partial<CulturePatternProps> = {}): CulturePattern =>
  CulturePattern.create({
    id: 'pattern-1',
    slug: 'test-pattern',
    name: 'Test Pattern',
    nameLocal: 'Test Pattern',
    imgUrl: '',
    createdById: 'user-1',
    type: 'KENTE',
    cssClass: 'kente',
    era: null,
    license: 'cc-by',
    summary: 'A documented pattern with sufficient description.',
    history: 'A documented history with sufficient details.',
    technique: 'A documented technique with sufficient details.',
    symbolism: { meaning: 'A documented meaning.', keywords: ['heritage'], usage: 'daily' },
    ceremonial: 'A documented use with sufficient details.',
    sources: [],
    downloads: 0,
    views: 0,
    status: 'DRAFT',
    isFeatured: false,
    colors: [],
    symbols: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('CultureService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getPatternForDownload', () => {
    it('resolves a pattern by database ID', async () => {
      mockRepo.findByIdOrSlug.mockResolvedValue(makePattern());

      const result = await service.getPatternForDownload('pattern-1');

      expect(mockRepo.findByIdOrSlug).toHaveBeenCalledWith('pattern-1');
      expect(result.id).toBe('pattern-1');
    });

    it('resolves a pattern by slug', async () => {
      mockRepo.findByIdOrSlug.mockResolvedValue(makePattern());

      const result = await service.getPatternForDownload('test-pattern');

      expect(mockRepo.findByIdOrSlug).toHaveBeenCalledWith('test-pattern');
      expect(result.slug).toBe('test-pattern');
    });
  });

  describe('getPatternBySlug', () => {
    it('returns the pattern and increments its view count', async () => {
      mockRepo.findBySlug.mockResolvedValue(makePattern());
      mockRepo.update.mockImplementation(async (pattern) => pattern);

      const result = await service.getPatternBySlug('test-pattern');

      expect(mockRepo.findBySlug).toHaveBeenCalledWith('test-pattern');
      expect(mockRepo.update).toHaveBeenCalled();
      expect(result.views).toBe(1);
    });

    it('throws NotFoundError when the pattern does not exist', async () => {
      mockRepo.findBySlug.mockResolvedValue(null);

      await expect(service.getPatternBySlug('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createPattern', () => {
    it('throws ConflictError when the generated slug already exists', async () => {
      mockRepo.exists.mockResolvedValue(true);
      const dto: CreatePatternDto = {
        name: 'Kente',
        nameLocal: 'Kente Royal',
        imgUrl: '',
        type: 'KENTE',
        cssClass: 'kente',
        summary: 'A documented pattern with sufficient description.',
        history: 'A documented history with sufficient details.',
        technique: 'A documented technique with sufficient details.',
        symbolism: { meaning: 'A documented meaning.', keywords: ['heritage'], usage: 'daily' },
        ceremonial: 'A documented use with sufficient details.',
      };

      await expect(service.createPattern(dto)).rejects.toThrow(ConflictError);
      expect(mockRepo.exists).toHaveBeenCalledWith('kente-royal');
    });
  });
});
