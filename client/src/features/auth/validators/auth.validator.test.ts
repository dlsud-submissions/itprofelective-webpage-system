import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema } from './auth.validator';

describe('signupSchema', () => {
  it('accepts a valid signup payload', () => {
    const result = signupSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'supersecret',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a blank name', () => {
    const result = signupSchema.safeParse({
      name: '  ',
      email: 'ada@example.com',
      password: 'supersecret',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password under 8 characters', () => {
    const result = signupSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'not-an-email',
      password: 'supersecret',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({
      email: 'ada@example.com',
      password: 'anything',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'ada@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
