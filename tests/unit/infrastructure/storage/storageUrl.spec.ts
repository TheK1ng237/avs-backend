import { extractStorageKeyFromUrl } from '@/infra/storage/storageUrl';

describe('extractStorageKeyFromUrl', () => {
  it('extracts root-level Supabase bucket keys', () => {
    expect(
      extractStorageKeyFromUrl(
        'https://project.supabase.co/storage/v1/object/public/avs-patterns/uuid-motif.svg',
      ),
    ).toBe('uuid-motif.svg');
  });

  it('preserves nested Supabase object paths', () => {
    expect(
      extractStorageKeyFromUrl(
        'https://project.supabase.co/storage/v1/object/public/avs-patterns/patterns/motif.svg',
      ),
    ).toBe('patterns/motif.svg');
  });

  it('decodes encoded object names', () => {
    expect(
      extractStorageKeyFromUrl(
        'https://project.supabase.co/storage/v1/object/public/avs-patterns/african%20motif.svg',
      ),
    ).toBe('african motif.svg');
  });

  it('returns null for unrelated URLs', () => {
    expect(extractStorageKeyFromUrl('https://example.com/image.svg')).toBeNull();
    expect(extractStorageKeyFromUrl('not a URL')).toBeNull();
  });
});
