import { expect, it } from 'vitest';
import { rankHouses } from './standings';

const h = (id: string, likes: number, avgScore: number | null, day: number) => ({ id, likes, avgScore, createdAt: new Date(2026, 9, day) });

it('ranks by likes, then average score, then entry date', () => {
  const ranked = rankHouses([h('late', 3, 8, 5), h('scored', 3, 9, 6), h('top', 5, 2, 9), h('early', 3, 8, 1), h('none', 0, null, 1)]);
  expect(ranked.map((x) => x.id)).toEqual(['top', 'scored', 'early', 'late', 'none']);
});

it('puts unscored houses below scored ones with the same likes', () => {
  expect(rankHouses([h('a', 1, null, 1), h('b', 1, 1, 2)]).map((x) => x.id)).toEqual(['b', 'a']);
});
