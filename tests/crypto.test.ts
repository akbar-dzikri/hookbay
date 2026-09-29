import { describe, expect, it } from 'vitest';
import { endpointSlug, hashPassword, slugify, verifyPassword } from '../src/lib/crypto';

describe('password hashing', () => {
  it('stores an scrypt scheme with a unique salt', () => {
    const first = hashPassword('correct horse battery staple');
    const second = hashPassword('correct horse battery staple');
    expect(first.startsWith('scrypt:')).toBe(true);
    expect(first).not.toBe(second);
  });

  it('verifies the right password and rejects the wrong one', () => {
    const stored = hashPassword('password123');
    expect(verifyPassword('password123', stored)).toBe(true);
    expect(verifyPassword('password124', stored)).toBe(false);
  });

  it('rejects malformed and unknown-scheme hashes', () => {
    expect(verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(verifyPassword('x', 'bcrypt:aa:bb')).toBe(false);
  });
});

describe('slugify', () => {
  it('normalises arbitrary text', () => {
    expect(slugify('Stripe Production — US!')).toBe('stripe-production-us');
    expect(slugify('   ')).toBe('workspace');
  });

  it('caps length', () => {
    expect(slugify('a'.repeat(80)).length).toBe(40);
  });
});

describe('endpointSlug', () => {
  it('is url safe, suffixed, and unique', () => {
    const first = endpointSlug('Stripe production');
    const second = endpointSlug('Stripe production');
    expect(first).toMatch(/^stripe-production-[a-z0-9]{4}$/);
    expect(first).not.toBe(second);
  });
});
