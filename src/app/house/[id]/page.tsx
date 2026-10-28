import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { votingOpen } from '@/lib/checkIns';
import { getSeason } from '@/lib/seasons';
import { getBracket } from '@/lib/brackets';
import { seasonStandings } from '@/lib/seasonStandings';
import { CROWD_LEVELS, crowdLevel, crowdLine } from '@/lib/crowd';
import { crowdCounts } from '@/lib/crowdCounts';
import { seasonTheme } from '@/lib/theme';
import { avatarUrl, displayName } from '@/lib/users';
import { SCORE_CATEGORIES, averageScore } from '@/lib/visits';
import { Icon3D } from '@/components/Icon3D';
import { VisitPanel, type VisitState } from '@/components/VisitPanel';
import styles from './house.module.css';

const FLASH: Record<string, string> = {
  'qr-first': 'Checked in with the porch sign. +20 XP! Now fill in your scorecard.',
  qr: 'Checked in with the porch sign.',
  'bad-code': 'That QR code doesn’t match this house. Try scanning the sign again.',
  own: 'That’s your own porch sign. It works for visitors.',
  closed: 'Voting isn’t open for this contest right now.',
  missing: 'That house isn’t in the contest.',
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ checkin?: string }> };

async function load(id: string) {
  return db.house.findUnique({ where: { id }, include: { owner: { select: { username: true, displayName: true } } } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const house = await load((await params).id);
  return { title: house?.status === 'APPROVED' ? `${house.name} · Porchlight` : 'Porchlight' };
}

export default async function HousePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { checkin } = await searchParams;
  const [house, user] = await Promise.all([load(id), currentUser()]);
  const canPreview = user && house && (house.ownerId === user.id || user.role === 'ADMIN');
  if (!house || (house.status !== 'APPROVED' && !canPreview)) notFound();

  const season = getSeason(house.season);
  const theme = season ? seasonTheme(season) : null;
  const verified = { houseId: id, verifiedAt: { not: null } };
  const [likes, visitors, avg, comments, myCheckIn, myVote] = await Promise.all([
    db.vote.count({ where: { ...verified, liked: true } }),
    db.checkIn.groupBy({ by: ['userId'], where: { houseId: id } }).then((g) => g.length),
    db.vote.aggregate({ where: verified, _avg: { creativity: true, lighting: true, storytelling: true, sound: true }, _count: { creativity: true } }),
    db.vote.findMany({
      where: { ...verified, comment: { not: null } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, comment: true, liked: true, user: { select: { id: true, username: true, displayName: true, avatarUpdatedAt: true } } },
    }),
    user ? db.checkIn.findFirst({ where: { userId: user.id, houseId: id }, select: { id: true } }) : null,
    user ? db.vote.findUnique({ where: { userId_houseId: { userId: user.id, houseId: id } } }) : null,
  ]);

  const state: VisitState = !user ? 'guest'
    : house.ownerId === user.id ? 'own'
    : house.status !== 'APPROVED' || !votingOpen(house.season) ? 'closed'
    : myCheckIn ? 'checked-in' : 'needs-checkin';
  const overall = averageScore({
    creativity: avg._avg.creativity, lighting: avg._avg.lighting, storytelling: avg._avg.storytelling, sound: avg._avg.sound,
  });
  const bracket = getBracket(house.bracket);
  const here = (await crowdCounts({ houseIds: [house.id] }))[house.id] ?? 0;
  const standings = house.status === 'APPROVED' ? await seasonStandings(house.season) : [];
  const overallPlace = standings.findIndex((h) => h.id === house.id) + 1 || null;
  const bracketPlace = bracket ? standings.filter((h) => h.bracket === bracket.key).findIndex((h) => h.id === house.id) + 1 || null : null;
  const where = house.showExactAddress ? house.address : `Near ${house.neighborhood ?? 'the neighborhood'}. The exact spot is shared when you check in.`;

  return (
    <main className="wrap stack" style={{ gap: 28 }}>
      <Link href={`/?season=${house.season}#map`} className="small">← Back to the {season ? `${season.name} ${season.year}` : ''} map</Link>
      {house.status !== 'APPROVED' && <p className="notice warn">Only you can see this page until the house is approved.</p>}
      <div className={styles.layout}>
        <div className="stack" style={{ gap: 24 }}>
          <div className={styles.gallery}>
            <div className={styles.hero}>
              {house.photoUrls[0] ? <img src={house.photoUrls[0]} alt={`${house.name} at night`} /> : <Icon3D name={theme?.icon ?? 'house'} size={120} />}
            </div>
            {house.photoUrls.length > 1 && (
              <div className={styles.thumbs}>
                {house.photoUrls.slice(1).map((u, i) => <a key={u} href={u} target="_blank" rel="noopener"><img src={u} alt={`${house.name}, photo ${i + 2}`} loading="lazy" /></a>)}
              </div>
            )}
          </div>
          <div className={styles.title}>
            {house.neighborhood && <span className="label">{house.neighborhood}</span>}
            <h1>{house.name}</h1>
            {(bracket || overallPlace) && (
              <div className="row" style={{ gap: 8 }}>
                {bracket && <Link href={`/?season=${house.season}&bracket=${bracket.key}#map`} className="pill chip-link"><Icon3D name={bracket.icon} size={18} />{bracket.label}{bracketPlace ? ` · #${bracketPlace}` : ''}</Link>}
                {overallPlace && <Link href={`/leaderboard?season=${house.season}`} className="pill chip-link"><Icon3D name="trophy" size={18} />#{overallPlace} overall</Link>}
              </div>
            )}
            <p className="muted">{where} · lit {house.litFrom}–{house.litUntil}</p>
            <p className="small muted">Decorated by {displayName(house.owner)}</p>
          </div>
          <p>{house.description}</p>
          {house.tags.length > 0 && <div className="row" style={{ gap: 6 }}>{house.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>}
          {house.showExactAddress && house.lat !== null && (
            <a className="btn ghost" style={{ justifySelf: 'start' }} href={`https://www.google.com/maps/dir/?api=1&destination=${house.lat},${house.lng}`} target="_blank" rel="noopener">
              <Icon3D name="map" size={22} />Directions
            </a>
          )}

          <section className="stack" aria-labelledby="cheers">
            <h2 id="cheers" style={{ fontSize: 22 }}>Cheers from visitors</h2>
            {comments.length === 0 ? <p className="muted small">No cheers yet. Visit, check in and be the first.</p> : (
              <ul className={styles.comments}>
                {comments.map((c) => (
                  <li key={c.id} className={styles.comment}>
                    {avatarUrl(c.user) ? <img src={avatarUrl(c.user)!} alt="" className={styles.ava} /> : <span className={styles.ava} aria-hidden="true">{c.user.username[0].toUpperCase()}</span>}
                    <div>
                      <span className={styles.who}>{displayName(c.user)}{c.liked && <Icon3D name="heart" size={16} label="loved it" />}</span>
                      <p className="small">{c.comment}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.side}>
          <div className="stats">
            <div className="stat"><span className="label">Verified likes</span><b className="num">{likes}</b></div>
            <div className="stat"><span className="label">Visitors</span><b className="num">{visitors}</b></div>
          </div>
          {house.status === 'APPROVED' && (
            <p className={styles.crowd}><i style={{ background: CROWD_LEVELS[crowdLevel(here)].color }} />{crowdLine(here)}</p>
          )}
          {user && (house.ownerId === user.id || user.role === 'ADMIN') && <Link href={`/house/${house.id}/stats`} className="btn ghost"><Icon3D name="sparkles" size={22} />{house.ownerId === user.id ? 'My flex stats' : 'Host stats'}</Link>}
          <div className="panel stack" style={{ gap: 14 }}>
            <div className="row spread">
              <h2 style={{ fontSize: 20 }}>Scorecard</h2>
              <span className="muted small">{overall === null ? 'No scores yet' : `${overall} / 10 from ${avg._count.creativity} ${avg._count.creativity === 1 ? 'visitor' : 'visitors'}`}</span>
            </div>
            <div className={styles.scores}>
              {SCORE_CATEGORIES.map((c) => {
                const v = avg._avg[c.key];
                return (
                  <div key={c.key} className={styles.score}>
                    <span>{c.label}</span>
                    <span className={styles.bar}><i style={{ width: `${v ? (v / 10) * 100 : 0}%` }} /></span>
                    <b className="num">{v ? v.toFixed(1) : '–'}</b>
                  </div>
                );
              })}
            </div>
          </div>
          <VisitPanel
            houseId={house.id}
            state={state}
            flash={checkin ? FLASH[checkin] ?? null : null}
            myVote={myVote && { liked: myVote.liked, comment: myVote.comment, creativity: myVote.creativity, lighting: myVote.lighting, storytelling: myVote.storytelling, sound: myVote.sound }}
          />
        </aside>
      </div>
    </main>
  );
}
