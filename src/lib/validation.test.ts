import { describe, expect, it } from 'vitest';
import { houseSchema, joinSchema } from './validation';

describe('joinSchema', () => {
  const base = { accountType: 'VIEWER', email: '  Sam@Example.COM ', username: 'Sam_Rivera', terms: 'on' };
  it('normalizes email and username and reads checkboxes', () => {
    const r = joinSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe('sam@example.com');
      expect(r.data.username).toBe('sam_rivera');
      expect(r.data.marketingOptIn).toBe(false);
    }
  });
  it('rejects bad and reserved usernames', () => {
    expect(joinSchema.safeParse({ ...base, username: 'a b' }).success).toBe(false);
    expect(joinSchema.safeParse({ ...base, username: 'xy' }).success).toBe(false);
    expect(joinSchema.safeParse({ ...base, username: 'Admin' }).success).toBe(false);
  });
  it('requires accepting the rules and a known account type', () => {
    expect(joinSchema.safeParse({ ...base, terms: undefined }).success).toBe(false);
    expect(joinSchema.safeParse({ ...base, accountType: 'JUDGE' }).success).toBe(false);
  });
  it('lets hosts add an optional property location', () => {
    const r = joinSchema.safeParse({ ...base, accountType: 'HOST', propertyAddress: '1820 SE Alder Ct' });
    expect(r.success && r.data.propertyAddress).toBe('1820 SE Alder Ct');
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
