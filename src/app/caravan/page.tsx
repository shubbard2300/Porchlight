import type { Metadata } from 'next';
import Link from 'next/link';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { activeCaravan } from '@/lib/caravanServer';
import { CARAVAN_HOURS, MAX_MEMBERS, SQUAD_BONUS_XP, SQUAD_WINDOW_MIN, squadReview } from '@/lib/caravans';
import { appUrl } from '@/lib/email';
import { avatarUrl, displayName } from '@/lib/users';
import { Icon3D } from '@/components/Icon3D';
import { endCaravan, leaveCaravan } from '../actions/caravans';
import { ShareInvite } from './ShareInvite';
import { StartCaravan } from './StartCaravan';
import styles from './caravan.module.css';

export const metadata: Metadata = { title: 'Caravan · Porchlight' };

const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });

type Props = { searchParams: Promise<{ started?: string; joined?: string; ended?: string }> };

/** Caravan mode: tour with friends, earn squad bonuses, and leave a combined Squad Review on each house. */
export default async function CaravanPage({ searchParams }: Props) {
  const user = await requireUser('/caravan');
  const flags = await searchParams;
  const caravan = await activeCaravan(user.id);

  if (!caravan) {
    return (
      <main className="wrap stack" style={{ gap: 28, maxWidth: 820 }}>
        <div className="page-head">
          <Icon3D name="people" size={72} />
          <div>
            <span className="label">Caravan mode</span>
            <h1 style={{ fontSize: 'clamp(28px, 4.4vw, 40px)' }}>Tour the lights with your squad</h1>
            <p className="muted">Start a caravan for the night and invite friends with a link or QR code. When squadmates check in at the same porch within {SQUAD_WINDOW_MIN} minutes, each later arrival earns +{SQUAD_BONUS_XP} bonus XP, and your scorecards add up to a Squad Review on every house you visit. Votes still count one per person.</p>
          </div>
        </div>
        {flags.ended && <p className="notice" role="status">Caravan ended. Your squad reviews stay on the houses you visited.</p>}
        <div className={styles.split}>
          <section className="panel stack">
            <h2 style={{ fontSize: 20 }}>Start a caravan</h2>
            <p className="small muted">It lasts {CARAVAN_HOURS} hours, with room for {MAX_MEMBERS} people.</p>
            <StartCaravan />
          </section>
          <section className="panel stack">
            <h2 style={{ fontSize: 20 }}>Got a code?</h2>
            <form action="/caravan/join" method="get" className="stack">
              <label className="small muted" htmlFor="c-code">Enter the 6-letter code from your squad leader</label>
              <input id="c-code" name="code" maxLength={12} autoCapitalize="characters" autoComplete="off" placeholder="ABC234" className={styles.codeInput} />
              <button type="submit" className="btn ghost">Find caravan</button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  const isLeader = caravan.leaderId === user.id;
  const inviteUrl = appUrl(`/caravan/join?code=${caravan.code}`);
  const qr = await QRCode.toString(inviteUrl, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#14123a', light: '#ffffff' } });
  const [checkIns, votes] = await Promise.all([
    db.checkIn.findMany({
      where: { caravanId: caravan.id },
      orderBy: { createdAt: 'asc' },
      select: { userId: true, createdAt: true, house: { select: { id: true, name: true, neighborhood: true } } },
    }),
    db.vote.findMany({ where: { caravanId: caravan.id }, select: { houseId: true, liked: true, comment: true, creativity: true, lighting: true, storytelling: true, sound: true } }),
  ]);
  const names = new Map(caravan.members.map((m) => [m.userId, displayName(m.user)]));
  const stops = [...checkIns.reduce((acc, c) => {
    const s = acc.get(c.house.id) ?? { house: c.house, at: c.createdAt, who: new Set<string>() };
    s.who.add(c.userId);
    return acc.set(c.house.id, s);
  }, new Map<string, { house: { id: string; name: string; neighborhood: string | null }; at: Date; who: Set<string> }>()).values()];
  const checkInsBy = (userId: string) => checkIns.filter((c) => c.userId === userId).length;

  return (
    <main className="wrap stack" style={{ gap: 28 }}>
      {flags.started && <p className="notice" role="status">Your caravan is rolling! Share the invite so your squad can join.</p>}
      {flags.joined && <p className="notice" role="status">You joined {caravan.name}. Check in at houses together for squad bonuses.</p>}
      <div className="page-head">
        <Icon3D name="people" size={72} />
        <div>
          <span className="label">Caravan · rolling until {timeFmt.format(caravan.endsAt)}</span>
          <h1 style={{ fontSize: 'clamp(28px, 4.4vw, 44px)' }}>{caravan.name}</h1>
          <p className="muted">{caravan.members.length} of {MAX_MEMBERS} aboard · {stops.length} {stops.length === 1 ? 'stop' : 'stops'} so far</p>
        </div>
      </div>

      <div className={styles.split}>
        <section className={`panel ${styles.invite}`} aria-label="Invite">
          <div className={styles.qr} dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="stack" style={{ gap: 10 }}>
            <span className="label">Invite code</span>
            <b className={styles.code}>{caravan.code}</b>
            <p className="small muted">Friends scan the code or open the link to hop in.</p>
            <ShareInvite url={inviteUrl} name={caravan.name} />
          </div>
        </section>

        <section className="panel stack" aria-labelledby="squad">
          <h2 id="squad" style={{ fontSize: 20 }}>The squad</h2>
          <ul className={styles.members}>
            {caravan.members.map((m) => (
              <li key={m.id}>
                {avatarUrl(m.user) ? <img src={avatarUrl(m.user)!} alt="" className="avatar sm" /> : <span className="avatar sm" aria-hidden="true">{m.user.username[0].toUpperCase()}</span>}
                <span><b>{displayName(m.user)}</b>{m.userId === caravan.leaderId && <span className="pill" style={{ marginLeft: 8 }}>Leader</span>}</span>
                <span className="small muted num">{checkInsBy(m.userId)} {checkInsBy(m.userId) === 1 ? 'check-in' : 'check-ins'}</span>
              </li>
            ))}
          </ul>
          <div className="row" style={{ gap: 10 }}>
            <Link href="/route" className="btn ghost"><Icon3D name="map" size={20} />Plan the squad&rsquo;s route</Link>
            {isLeader
              ? <form action={endCaravan}><button type="submit" className="btn danger sm">End caravan for everyone</button></form>
              : <form action={leaveCaravan}><button type="submit" className="btn ghost sm">Leave caravan</button></form>}
          </div>
        </section>
      </div>

      <section className="stack" style={{ gap: 14 }} aria-labelledby="stops">
        <h2 id="stops" className="squiggle" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>Tonight&rsquo;s stops</h2>
        {stops.length === 0 ? (
          <div className="empty"><Icon3D name="map" size={56} /><p className="muted">No check-ins yet. Head to a house and check in together.</p></div>
        ) : (
          <ul className={styles.stops}>
            {stops.map((s) => {
              const review = squadReview(votes.filter((v) => v.houseId === s.house.id));
              return (
                <li key={s.house.id} className="panel">
                  <div className="row spread">
                    <Link href={`/house/${s.house.id}#squad-reviews`}><b>{s.house.name}</b></Link>
                    <span className="small muted">{timeFmt.format(s.at)}</span>
                  </div>
                  <span className="small">{[...s.who].map((id) => names.get(id) ?? 'A former squadmate').join(', ')}</span>
                  <span className="small muted">
                    {review.reviewers === 0 ? 'No scorecards yet' : `${review.reviewers} ${review.reviewers === 1 ? 'scorecard' : 'scorecards'}${review.overall !== null ? ` · squad score ${review.overall}/10` : ''} · ${review.likes} ${review.likes === 1 ? 'like' : 'likes'}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
