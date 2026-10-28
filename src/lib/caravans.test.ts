import { describe, expect, it } from 'vitest';
import { makeCode, normalizeCode, squadReview } from './caravans';

describe('caravans', () => {
  it('makes readable codes', () => {
    const code = makeCode();
    expect(code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  });

  it('normalizes typed codes', () => {
    expect(normalizeCode(' ab-c2 9x ')).toBe('ABC29X');
  });

  it('rolls scorecards into one squad review', () => {
    const r = squadReview([
      { liked: true, comment: 'Loved the fog!', creativity: 9, lighting: 8, storytelling: 7, sound: null },
      { liked: false, comment: null, creativity: 7, lighting: 10, storytelling: 9, sound: 6 },
    ]);
    expect(r.reviewers).toBe(2);
    expect(r.likes).toBe(1);
    expect(r.scores).toEqual({ creativity: 8, lighting: 9, storytelling: 8, sound: 6 });
    expect(r.favorite).toBe('Lighting');
    expect(r.cheers).toEqual(['Loved the fog!']);
    expect(r.overall).toBe(7.8);
  });

  it('names no favorite on a tie', () => {
    const v = { liked: true, comment: null, creativity: 7, lighting: 7, storytelling: 7, sound: 7 };
    expect(squadReview([v, v]).favorite).toBeNull();
  });
});
