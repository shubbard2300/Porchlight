import { afterEach, describe, expect, it, vi } from 'vitest';
import { gaMeasurementId, withSignupMark } from './analytics';

describe('withSignupMark', () => {
  it('adds the role to a path with a query and a hash', () => {
    expect(withSignupMark('/?welcome=1#map', 'VIEWER')).toBe('/?welcome=1&signup=viewer#map');
  });
  it('adds a query when there is none', () => {
    expect(withSignupMark('/profile', 'HOST')).toBe('/profile?signup=host');
    expect(withSignupMark('/submit?welcome=1', 'HOST')).toBe('/submit?welcome=1&signup=host');
  });
});

describe('gaMeasurementId', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('reports only from the live site', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(gaMeasurementId()).toBeNull();
    vi.stubEnv('VERCEL_ENV', 'production');
    expect(gaMeasurementId()).toBe('G-K2GRKN33FE');
  });
  it('can be switched off', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('GA_MEASUREMENT_ID', 'off');
    expect(gaMeasurementId()).toBeNull();
  });
});
