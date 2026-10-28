import 'server-only';
import { db } from './db';
import { rankHouses } from './standings';
import { averageScore } from './visits';

/** Every approved house in a contest with its verified likes and average scorecard, in contest order. */
export async function seasonStandings(seasonKey: string) {
  const [houses, likes, scores] = await Promise.all([
    db.house.findMany({ where: { season: seasonKey, status: 'APPROVED' } }),
    db.vote.groupBy({ by: ['houseId'], where: { house: { season: seasonKey }, liked: true, verifiedAt: { not: null } }, _count: { _all: true } }),
    db.vote.groupBy({
      by: ['houseId'],
      where: { house: { season: seasonKey }, verifiedAt: { not: null } },
      _avg: { creativity: true, lighting: true, storytelling: true, sound: true },
      _count: { creativity: true },
    }),
  ]);
  const likesBy = new Map(likes.map((l) => [l.houseId, l._count._all]));
  const scoresBy = new Map(scores.map((s) => [s.houseId, s]));
  return rankHouses(houses.map((h) => {
    const s = scoresBy.get(h.id);
    return { ...h, likes: likesBy.get(h.id) ?? 0, avgScore: s ? averageScore(s._avg) : null, scorecards: s?._count.creativity ?? 0 };
  }));
}

export type HouseStanding = Awaited<ReturnType<typeof seasonStandings>>[number];
