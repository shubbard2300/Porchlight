import { describe, expect, it } from 'vitest';
import { houseSchema, signupSchema } from './validation';

describe('signupSchema', () => {
  it('normalizes email and reads checkboxes', () => {
    const r = signupSchema.safeParse({ name: 'Sam', email: '  Sam@Example.COM ', password: 'longenough', terms: 'on' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe('sam@example.com');
      expect(r.data.marketingOptIn).toBe(false);
    }
  });
  it('requires accepting the rules', () => {
    const r = signupSchema.safeParse({ name: 'Sam', email: 'sam@example.com', password: 'longenough' });
    expect(r.success).toBe(false);
  });
});

describe('houseSchema', () => {
  const base = {
    season: 'halloween-2026', name: 'The Hollow', address: '1820 SE Alder Ct', litFrom: '6 pm', litUntil: '10 pm',
    description: 'A skeleton choir every twenty minutes.', contribution: '25', permission: 'on', tags: ['Fog'],
  };
  it('rejects unknown tags and odd contribution amounts', () => {
    expect(houseSchema.safeParse(base).success).toBe(false);
    expect(houseSchema.safeParse({ ...base, tags: ['Handmade'], contribution: '13' }).success).toBe(false);
  });
  it('accepts a complete entry', () => {
    const r = houseSchema.safeParse({ ...base, tags: ['Handmade'] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.contribution).toBe(25);
  });
});
