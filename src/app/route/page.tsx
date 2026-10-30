import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { bracketsFor } from '@/lib/brackets';
import { crowdCounts } from '@/lib/crowdCounts';
import { currentUser } from '@/lib/auth';
import { forViewer, publicPin } from '@/lib/mapPins';
import { seasonStandings } from '@/lib/seasonStandings';
import { contestToday, defaultSeason, getSeason, visibleSeasons } from '@/lib/seasons';
import { seasonTheme } from '@/lib/theme';
import { houseValue } from '@/lib/routeWeaver';
import { placedBlocks } from '@/lib/blockStandings';
import { Icon3D } from '@/components/Icon3D';
import { RouteWeaver, type RouteHouse, type RoutePitstop } from './RouteWeaver';

export const metadata: Metadata = { title: 'Route Weaver · Porchlight' };

/** Plans a loop of the best houses for the time a visitor has, then hands it to their maps app. */
export default async function RoutePage({ searchParams }: { searchParams: Promise<{ season?: string; from?: string }> }) {
  const today = contestToday();
  const seasons = visibleSeasons(today);
  const query = await searchParams;
  const requested = getSeason(query.season);
  const season = requested && seasons.includes(requested) ? requested : defaultSeason(today);
  const theme = seasonTheme(season);
  const [standings, crowd, merchants, blocks] = await Promise.all([
    seasonStandings(season.key),
    crowdCounts({ season: season.key }),
    db.merchant.findMany({
      where: { active: true, lat: { not: null }, lng: { not: null } },
      select: { id: true, name: true, tier: true, offer: true, lat: true, lng: true },
    }),
    placedBlocks(),
  ]);

  const signedIn = !!(await currentUser());
  const houses: RouteHouse[] = standings.map((h) => forViewer(h, signedIn)).flatMap((h, i) => h.lat === null || h.lng === null ? [] : [{
    id: h.id,
    name: h.name,
    bracket: h.bracket,
    neighborhood: h.neighborhood,
    address: h.showExactAddress ? h.address : null,
    ...publicPin({ id: h.id, lat: h.lat, lng: h.lng, showExactAddress: h.showExactAddress }),
    exact: h.showExactAddress,
    rank: i + 1,
    likes: h.likes,
    avgScore: h.avgScore,
    value: houseValue(h),
    crowd: crowd[h.id] ?? 0,
    lit: `${h.litFrom}–${h.litUntil}`,
  }]);
  const pitstops: RoutePitstop[] = merchants.map((m) => ({ ...m, lat: m.lat!, lng: m.lng! }));
  const brackets = bracketsFor(season.name).filter((b) => houses.some((h) => h.bracket === b.key));

  return (
    <main className="wrap stack" style={{ gap: 28 }}>
      <nav className="tabs" aria-label="Holiday contests">
        {seasons.map((s) => (
          <Link key={s.key} href={`/route?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>
            <Icon3D name={seasonTheme(s).icon} size={24} />{s.name} {s.year}
          </Link>
        ))}
      </nav>
      <div className="page-head">
        <Icon3D name="map" size={72} />
        <div>
          <span className="label">Route Weaver</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.4vw, 40px)' }}>Plan your {season.name} light tour</h1>
          <p className="muted">Tell us where you&rsquo;re starting and how long you have. We&rsquo;ll pick a loop of the most-loved houses that gets you back on time, then hand it to your maps app.</p>
        </div>
      </div>
      {houses.length === 0 ? (
        <p className="notice">No houses are on the {season.name} map yet. Check back once the first porches light up.</p>
      ) : (
        <RouteWeaver
          houses={houses}
          pitstops={pitstops}
          brackets={brackets.map((b) => ({ key: b.key, label: b.label, icon: b.icon }))}
          seasonIcon={theme.icon}
          blocks={blocks.map((b) => ({ id: b.id, name: b.name, lat: b.lat, lng: b.lng }))}
          initialFrom={houses.some((h) => h.id === query.from) || blocks.some((b) => `block:${b.id}` === query.from) ? query.from : undefined}
        />
      )}
    </main>
  );
}
