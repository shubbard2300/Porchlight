import 'server-only';
import { db } from './db';
import { isNearby, likeAlertDue } from './alerts';
import { pushConfigured, sendPush } from './push';
import { getSeason, type Season } from './seasons';
import { displayName } from './users';

/** A house just went live: tell people who asked about new houses near their saved spot. */
export async function alertNearbyHouse(houseId: string) {
  if (!pushConfigured()) return;
  const house = await db.house.findUnique({ where: { id: houseId }, select: { id: true, name: true, ownerId: true, neighborhood: true, lat: true, lng: true, litFrom: true, litUntil: true, season: true } });
  if (!house || house.lat === null) return;
  const people = await db.user.findMany({
    where: { alertNearby: true, alertLat: { not: null }, id: { not: house.ownerId }, pushSubs: { some: {} } },
    select: { id: true, alertLat: true, alertLng: true, alertRadiusKm: true },
  });
  const near = people.filter((p) => isNearby(p, house)).map((p) => p.id);
  const season = getSeason(house.season);
  await sendPush(near, {
    title: `New porch near you: ${house.name}`,
    body: `${house.neighborhood ? `${house.neighborhood} · ` : ''}${season ? `${season.name} · ` : ''}lit ${house.litFrom}–${house.litUntil}`,
    url: `/house/${house.id}`,
    tag: `house-${house.id}`,
  });
}

/** Someone liked a house: ping its host, at most once per half hour per house. */
export async function alertHostLike(houseId: string, voterId: string) {
  if (!pushConfigured()) return;
  const house = await db.house.findUnique({ where: { id: houseId }, select: { id: true, name: true, ownerId: true, lastLikeAlertAt: true, owner: { select: { alertHost: true } } } });
  if (!house || !house.owner.alertHost || !likeAlertDue(house.lastLikeAlertAt)) return;
  // Claim the slot first so two votes landing together send one alert.
  const claimed = await db.house.updateMany({ where: { id: houseId, lastLikeAlertAt: house.lastLikeAlertAt }, data: { lastLikeAlertAt: new Date() } });
  if (claimed.count === 0) return;
  const [voter, likes] = await Promise.all([
    db.user.findUnique({ where: { id: voterId }, select: { username: true, displayName: true } }),
    db.vote.count({ where: { houseId, liked: true } }),
  ]);
  await sendPush([house.ownerId], {
    title: `${house.name} got a new like`,
    body: `${voter ? displayName(voter) : 'A visitor'} loved it. That's ${likes} verified ${likes === 1 ? 'like' : 'likes'} so far.`,
    url: `/house/${house.id}/stats`,
    tag: `likes-${house.id}`,
  });
}

/** A caravan member checked in: tell the rest of the squad where they are. */
export async function alertSquadCheckIn(caravanId: string, userId: string, houseId: string) {
  if (!pushConfigured()) return;
  const [caravan, who, house] = await Promise.all([
    db.caravan.findUnique({ where: { id: caravanId }, select: { name: true, members: { where: { leftAt: null, userId: { not: userId }, user: { alertSquad: true } }, select: { userId: true } } } }),
    db.user.findUnique({ where: { id: userId }, select: { username: true, displayName: true } }),
    db.house.findUnique({ where: { id: houseId }, select: { id: true, name: true } }),
  ]);
  if (!caravan || !who || !house) return;
  await sendPush(caravan.members.map((m) => m.userId), {
    title: `${caravan.name}: ${displayName(who)} checked in`,
    body: `At ${house.name}. Check in within 30 minutes for squad bonus XP.`,
    url: `/house/${house.id}`,
    tag: `caravan-${caravanId}`,
  });
}

/** The evening of the holiday: remind everyone who wants it that voting closes at midnight. */
export async function alertLastCall(season: Season) {
  const key = `lastcall:${season.key}`;
  const done = await db.setting.findUnique({ where: { key } });
  if (done || !pushConfigured()) return 0;
  await db.setting.create({ data: { key, value: new Date().toISOString() } });
  const people = await db.user.findMany({ where: { alertLastCall: true, pushSubs: { some: {} } }, select: { id: true } });
  return sendPush(people.map((p) => p.id), {
    title: `Last night to vote: ${season.name} ${season.year}`,
    body: 'Voting closes at midnight. Visit a few more porches and like your favorites.',
    url: '/route',
    tag: `lastcall-${season.key}`,
  });
}
