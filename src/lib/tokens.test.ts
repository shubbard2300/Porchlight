import { describe, expect, it } from 'vitest';
import { hashToken, newToken } from './tokens';

describe('email tokens', () => {
  it('are long, URL safe and unique', () => {
    const a = newToken(), b = newToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });
  it('are stored only as a stable hash', () => {
    const t = newToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
    expect(hashToken(t)).toHaveLength(64);
  });
});
