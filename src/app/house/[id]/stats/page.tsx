import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getBracket } from '@/lib/brackets';
import { crowdLine } from '@/lib/crowd';
import { crowdCounts } from '@/lib/crowdCounts';
import { checkInsByHour, hourLabel, milesTraveledTo } from '@/lib/hostStats';
import { seasonStandings } from '@/lib/seasonStandings';
import { seasonCalendar } from '@/lib/seasonConfig';
import { SCORE_CATEGORIES } from '@/lib/visits';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import styles from './stats.module.css';
import { isStaff } from '@/lib/roles';

export const metadata: Metadata = { title: 'My house stats · Porchlight' };

/** Evening hours shown on the chart, 4 pm through 1 am. Check-ins outside them still count everywhere else. */
const CHART_HOURS = [16, 17, 18, 19, 20, 21, 22, 23, 0, 1];

/** The host's "Flex" dashboard: how their display is doing, from check-ins and scorecards. */
export default async function HouseStats({ params }: { params: Promise<{ id: string }> }) {
  const { getSeason } = await seasonCalendar();
  const { id } = await params;
  const user = await requireUser(`/house/${id}/stats`);
  const house = await db.house.findUnique({ where: { id } });
  if (!house || (house.ownerId !== user.id && !isStaff(user.role))) notFound();
  const season = getSeason(house.season);
  const bracket = getBracket(house.bracket);

  const checkIns = await db.checkIn.findMany({ where: { houseId: id }, select: { userId: true, createdAt: true, method: true } });
  const guestIds = [...new Set(checkIns.map((c) => c.userId))];
  const [guestTrail, avg, likes, cheers, crowd, standings] = await Promise.all([
    // Every guest's check-ins this season, so we can measure the hop from their previous stop.
    db.checkIn.findMany({
      where: { userId: { in: guestIds }, house: { season: house.season } },
      select: { userId: true, houseId: true, createdAt: true, house: { select: { lat: true, lng: true } } },
    }),
    db.vote.aggregate({ where: { houseId: id, verifiedAt: { not: null } }, _avg: { creativity: true, lighting: true, storytelling: true, sound: true }, _count: { creativity: true } }),
    db.vote.count({ where: { houseId: id, verifiedAt: { not: null }, liked: true } }),
    db.vote.count({ where: { houseId: id, verifiedAt: { not: null }, comment: { not: null } } }),
    crowdCounts({ houseIds: [id] }),
    house.status === 'APPROVED' ? seasonStandings(house.season) : Promise.resolve([]),
  ]);

  const miles = milesTraveledTo(id, guestTrail.map((c) => ({ userId: c.userId, houseId: c.houseId, createdAt: c.createdAt, lat: c.house.lat, lng: c.house.lng })));
  const hours = checkInsByHour(checkIns.map((c) => c.createdAt));
  const chart = CHART_HOURS.map((h) => ({ h, n: hours[h] }));
  const max = Math.max(1, ...chart.map((c) => c.n));
  const peak = hours.indexOf(Math.max(...hours));
  const qr = checkIns.filter((c) => c.method === 'QR').length;
  const scored = SCORE_CATEGORIES.map((c) => ({ ...c, v: avg._avg[c.key] })).filter((c) => c.v !== null);
  const best = scored.length ? scored.reduce((a, b) => ((b.v ?? 0) > (a.v ?? 0) ? b : a)) : null;
  const overall = standings.findIndex((h) => h.id === id) + 1;
  const inBracket = bracket ? standings.filter((h) => h.bracket === bracket.key).findIndex((h) => h.id === id) + 1 : 0;

  const tiles: [Icon3DName, string, string, string?][] = [
    ['people', 'Total visitors', String(guestIds.length), `${checkIns.length} check-ins`],
    ['heart', 'Verified likes', String(likes), `${avg._count.creativity} scorecards`],
    ['map', 'Miles traveled by guests', miles.toLocaleString('en-US'), 'from their previous stop'],
    ['fire', 'Peak hour', checkIns.length ? hourLabel(peak) : '–', checkIns.length ? `${hours[peak]} check-ins` : 'no visits yet'],
    ['trophy', bracket ? `Rank in ${bracket.label}` : 'Overall rank', (bracket ? inBracket : overall) ? `#${bracket ? inBracket : overall}` : '–', overall ? `#${overall} overall` : 'once approved'],
    ['chat', 'Cheers', String(cheers), 'kind comments from visitors'],
  ];

  return (
    <main className="wrap stack" style={{ gap: 28 }}>
      <Link href="/profile" className="small">← Back to my profile</Link>
      <div className="page-head">
        <Icon3D name="sparkles" size={72} />
        <div>
          <span className="label">{season ? `${season.name} ${season.year}` : house.season} · flex stats</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.4vw, 40px)' }}>{house.name}</h1>
          <p className="muted">{crowdLine(crowd[id] ?? 0)} · <Link href={`/house/${id}`}>View public page</Link></p>
        </div>
      </div>

      <div className={styles.tiles}>
        {tiles.map(([icon, label, value, note]) => (
          <div key={label} className={styles.tile}>
            <div className={styles.tileTop}><span className="label">{label}</span><Icon3D name={icon} size={26} /></div>
            <b className="num">{value}</b>
            {note && <small>{note}</small>}
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        <section className="panel stack" aria-labelledby="rush">
          <div className="row spread"><h2 id="rush" style={{ fontSize: 20 }}>Rush hour</h2><span className="small muted">Check-ins by hour, all season</span></div>
          <div className={styles.chart} style={{ '--n': chart.length } as React.CSSProperties} role="img" aria-label={`Check-ins by hour. Busiest: ${checkIns.length ? hourLabel(peak) : 'none yet'}.`}>
            {chart.map(({ h, n }) => (
              <div key={h} className={styles.col}>
                <div className={styles.barWrap}><div className={`${styles.bar}${n > 0 && h === peak ? ` ${styles.peak}` : ''}`} style={{ height: `${(n / max) * 100}%` }}>{n > 0 && <span>{n}</span>}</div></div>
                <span className={styles.hour}>{hourLabel(h).replace(' ', '')}</span>
              </div>
            ))}
          </div>
          <div className={styles.baseline} />
          {checkIns.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              <span className="small muted">How guests checked in: {qr} by porch QR, {checkIns.length - qr} by location</span>
              <div className={styles.split} aria-hidden="true"><i style={{ width: `${(qr / checkIns.length) * 100}%` }} /><i style={{ flex: 1 }} /></div>
            </div>
          )}
        </section>

        <section className="panel stack" aria-labelledby="fav">
          <h2 id="fav" style={{ fontSize: 20 }}>Fan favorite</h2>
          {best ? <p className="muted small">Visitors rate your <b>{best.label.toLowerCase()}</b> highest.</p> : <p className="muted small">Scores show up here once visitors fill in their scorecards.</p>}
          <div className={styles.cats}>
            {SCORE_CATEGORIES.map((c) => {
              const v = avg._avg[c.key];
              return (
                <div key={c.key} className={`${styles.cat}${best?.key === c.key ? ` ${styles.best}` : ''}`}>
                  <span>{c.label}</span>
                  <span className={styles.catBar}><i style={{ width: `${v ? v * 10 : 0}%` }} /></span>
                  <b className="num">{v ? v.toFixed(1) : '–'}</b>
                </div>
              );
            })}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link href={`/house/${id}/sign`} className="btn sm primary">Print porch QR sign</Link>
            {house.ownerId === user.id && <Link href={`/house/${id}/lights`} className="btn sm ghost">Porch light triggers</Link>}
            {house.ownerId === user.id && <Link href={`/house/${id}/ar/edit`} className="btn sm ghost">Magic decorations</Link>}
          </div>
        </section>
      </div>
    </main>
  );
}
