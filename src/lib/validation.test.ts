import { describe, expect, it } from 'vitest';
import { houseSchema, joinSchema, newPasswordSchema, photoMetaSchema, profileSchema } from './validation';

describe('joinSchema', () => {
  const base = { accountType: 'VIEWER', email: '  Sam@Example.COM ', username: 'Sam_Rivera', password: 'lanterns-glow', terms: 'on' };
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
  it('requires a password of at least 8 characters', () => {
    expect(joinSchema.safeParse({ ...base, password: undefined }).success).toBe(false);
    expect(joinSchema.safeParse({ ...base, password: 'short' }).success).toBe(false);
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

describe('newPasswordSchema', () => {
  it('needs both entries to match', () => {
    expect(newPasswordSchema.safeParse({ password: 'lanterns-glow', confirm: 'lanterns-glow' }).success).toBe(true);
    const r = newPasswordSchema.safeParse({ password: 'lanterns-glow', confirm: 'lanterns-glo' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(['confirm']);
  });
});

describe('photoMetaSchema', () => {
  it('accepts a photo with or without a full location', () => {
    expect(photoMetaSchema.safeParse({ width: '1600', height: '1200' }).success).toBe(true);
    const r = photoMetaSchema.safeParse({ width: '1600', height: '1200', lat: '45.5', lng: '-122.6', locationSource: 'photo', houseId: '' });
    expect(r.success && r.data.lat).toBe(45.5);
  });
  it('rejects half a location, out-of-range coordinates and 0,0', () => {
    expect(photoMetaSchema.safeParse({ width: 800, height: 600, lat: '45.5' }).success).toBe(false);
    expect(photoMetaSchema.safeParse({ width: 800, height: 600, lat: '95', lng: '10', locationSource: 'device' }).success).toBe(false);
    expect(photoMetaSchema.safeParse({ width: 800, height: 600, lat: '0', lng: '0', locationSource: 'device' }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('normalizes an edited username and rejects reserved ones', () => {
    const r = profileSchema.safeParse({ username: ' Holly_Lane ' });
    expect(r.success && r.data.username).toBe('holly_lane');
    expect(profileSchema.safeParse({ username: 'admin' }).success).toBe(false);
  });
});
