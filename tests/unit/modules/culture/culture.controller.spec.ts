jest.mock('@/infra/database/database', () => ({
  db: {
    pattern: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    staticPatternMetric: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/infra/storage/storage.factory', () => ({
  createStorageService: () => ({
    upload: jest.fn(),
    download: jest.fn(),
  }),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

import { db } from '@/infra/database/database';
import { CultureService } from '@/modules/culture/application/culture.service';
import type { ICultureRepository } from '@/modules/culture/domain/ICultureRepository';
import { CultureController } from '@/modules/culture/culture.controller';

const mockRepository: jest.Mocked<ICultureRepository> = {
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

const controller = new CultureController(new CultureService(mockRepository));
const patternDb = db.pattern as jest.Mocked<typeof db.pattern>;

describe('CultureController.trackView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('increments views for an unpublished pattern viewed by an admin', async () => {
    patternDb.findFirst.mockResolvedValue({
      id: 'pattern-id',
      status: 'DRAFT',
      createdById: 'creator-id',
      views: 0,
      downloads: 0,
    } as never);
    patternDb.update.mockResolvedValue({
      views: 1,
      downloads: 0,
    } as never);

    const response = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await controller.trackView(
      {
        params: { id: 'pattern-slug' },
        user: { userId: 'admin-id', role: 'admin' },
      } as never,
      response as never,
      jest.fn(),
    );

    expect(patternDb.update).toHaveBeenCalledWith({
      where: { id: 'pattern-id' },
      data: { views: { increment: 1 } },
      select: { views: true, downloads: true },
    });
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { views: 1, downloads: 0 },
      }),
    );
  });

  it('does not increment an unpublished pattern viewed by an anonymous user', async () => {
    patternDb.findFirst.mockResolvedValue({
      id: 'pattern-id',
      status: 'DRAFT',
      createdById: 'creator-id',
      views: 0,
      downloads: 0,
    } as never);

    const response = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await controller.trackView(
      { params: { id: 'pattern-slug' } } as never,
      response as never,
      jest.fn(),
    );

    expect(patternDb.update).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
  });
});
