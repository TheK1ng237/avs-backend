// ═════════════════════════════════════════════════════════════════════════════
// Basic Unit Tests - Utility Functions
// ═════════════════════════════════════════════════════════════════════════════

describe('Utility: pagination', () => {
  it('should calculate correct skip value', () => {
    const page = 2;
    const perPage = 20;
    const skip = (page - 1) * perPage;

    expect(skip).toBe(20);
  });

  it('should calculate total pages', () => {
    const total = 150;
    const perPage = 20;
    const totalPages = Math.ceil(total / perPage);

    expect(totalPages).toBe(8);
  });

  it('should handle single page', () => {
    const total = 10;
    const perPage = 20;
    const totalPages = Math.ceil(total / perPage);

    expect(totalPages).toBe(1);
  });
});

describe('Utility: validators', () => {
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  it('should validate correct email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('should reject invalid email', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('should reject empty email', () => {
    expect(isValidEmail('')).toBe(false);
  });

  const isStrongPassword = (password: string): boolean => {
    return password.length >= 8;
  };

  it('should accept strong password', () => {
    expect(isStrongPassword('password123')).toBe(true);
  });

  it('should reject weak password', () => {
    expect(isStrongPassword('weak')).toBe(false);
  });
});

describe('Utility: slug generation', () => {
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  it('should generate valid slug from text', () => {
    const slug = generateSlug('Kente Cloth Pattern');

    expect(slug).toBe('kente-cloth-pattern');
  });

  it('should handle special characters', () => {
    const slug = generateSlug('Kente & Cloth! Pattern?');

    expect(slug).toBe('kente-cloth-pattern');
  });

  it('should handle multiple spaces', () => {
    const slug = generateSlug('Kente   Cloth   Pattern');

    expect(slug).toBe('kente-cloth-pattern');
  });
});

describe('Utility: date formatting', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-06-16T00:00:00Z');
    const formatted = date.toISOString();

    expect(formatted).toContain('2024-06-16');
  });

  it('should calculate date difference in days', () => {
    const date1 = new Date('2024-06-01');
    const date2 = new Date('2024-06-16');
    const diffDays = Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

    expect(diffDays).toBe(15);
  });
});

describe('Utility: object manipulation', () => {
  const omitKeys = (obj: Record<string, any>, keys: string[]): Record<string, any> => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  };

  it('should remove specified keys from object', () => {
    const obj = { id: '1', name: 'Test', secret: 'hidden' };
    const result = omitKeys(obj, ['secret']);

    expect(result).toEqual({ id: '1', name: 'Test' });
    expect(result.secret).toBeUndefined();
  });

  it('should handle multiple keys', () => {
    const obj = { id: '1', name: 'Test', secret: 'hidden', token: 'abc' };
    const result = omitKeys(obj, ['secret', 'token']);

    expect(result).toEqual({ id: '1', name: 'Test' });
  });
});
