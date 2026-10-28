import 'server-only';
import { db } from './db';
import { inBlock } from './blocks';
import { publicPin } from './mapPins';
import type { HouseStanding } from './seasonStandings';

export type PlacedBlock = { id: string; name: string; blurb: string; address: string; lat: number; lng: number; radiusM: number; featured: boolean };

/** Active blocks that have a map spot. */
export async function placedBlocks(): Promise<PlacedBlock[]> {
  const blocks = await db.anchorBlock.findMany({
    where: { active: true, lat: { not: null }, lng: { not: null } },
    select: { id: true, name: true, blurb: true, address: true, lat: true, lng: true, radiusM: true, featured: true },
    orderBy: { name: 'asc' },
  });
  return blocks.map((b) => ({ ...b, lat: b.lat!, lng: b.lng! }));
}

/** The contest houses inside a block, in contest order, matched by public pin. */
export function housesIn(block: PlacedBlock, standings: HouseStanding[]): HouseStanding[] {
  return standings.filter((h) => h.lat !== null && h.lng !== null
    && inBlock(block, publicPin({ id: h.id, lat: h.lat, lng: h.lng, showExactAddress: h.showExactAddress })));
}
