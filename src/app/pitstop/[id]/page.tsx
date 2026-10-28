import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BOOST_HOURS, boostActive, getCategory, TIERS } from '@/lib/pitstops';
import { PITSTOP_XP } from '@/lib/rewards';
import { Icon3D } from '@/components/Icon3D';
import styles from './pitstop.module.css';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ scan?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const m = await db.merchant.findUnique({ where: { id }, select: { name: true } });
  return { title: m ? `${m.name} · Porchlight pitstop` : 'Pitstop · Porchlight' };
}

const SCAN_NOTES: Record<string, { text: string; warn?: boolean }> = {
  first: { text: `Scanned! You earned ${PITSTOP_XP} XP, and every XP you earn is doubled for the next ${BOOST_HOURS} hours.` },
  ok: { text: `Scanned! Your XP is doubled for the next ${BOOST_HOURS} hours.` },
  again: { text: 'You already scanned here today, so your boost is still running from last time.' },
  'bad-code': { text: 'That code didn’t work. Ask the staff for the Porchlight sign at the counter.', warn: true },
  closed: { text: 'This pitstop isn’t taking part right now.', warn: true },
};

const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });

/** A sponsor's public page: the deal, where it is, and how the counter QR boosts XP. */
export default async function PitstopPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { scan } = await searchParams;
  const [m, user] = await Promise.all([db.merchant.findUnique({ where: { id } }), currentUser()]);
  if (!m || (!m.active && user?.role !== 'ADMIN')) notFound();
  const tier = TIERS[m.tier];
  const cat = getCategory(m.category);
  const note = scan ? SCAN_NOTES[scan] : undefined;
  const boosted = boostActive(user?.xpBoostUntil);
  const directions = m.lat !== null && m.lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.address)}`;

  return (
    <main className="wrap stack" style={{ gap: 22, maxWidth: 720 }}>
      <Link href="/#map" className="small">← Back to the map</Link>
      {note && <p className={`notice${note.warn ? ' warn' : ''}`} role="status">{note.text}</p>}

      <article className={styles.card}>
        <div className={styles.head}>
          <span className={styles.badge} style={{ background: tier.color }}><Icon3D name={cat.icon} size={44} /></span>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill" style={{ background: tier.color }}>{tier.label}</span>
              <span className="pill">{cat.label}</span>
              {!m.active && <span className="pill">Paused</span>}
            </div>
            <h1 className={styles.name}>{m.name}</h1>
          </div>
        </div>
        <p className={styles.offer}><Icon3D name="gift" size={30} />{m.offer}</p>
        <dl className={styles.facts}>
          <div><dt>Address</dt><dd>{m.address}</dd></div>
          {m.hours && <div><dt>Hours</dt><dd>{m.hours}</dd></div>}
          {m.website && <div><dt>Website</dt><dd><a href={m.website} target="_blank" rel="noopener">{m.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a></dd></div>}
        </dl>
        <a className="btn primary" style={{ justifySelf: 'start' }} href={directions} target="_blank" rel="noopener">Directions</a>
      </article>

      <section className={`panel stack ${styles.boost}`}>
        <h2 style={{ fontSize: 20 }}><Icon3D name="sparkles" size={28} /> Double XP pitstop</h2>
        <p>Scan the Porchlight QR at the counter to double every XP you earn for {BOOST_HOURS} hours: check-ins, scorecards, all of it. <b>No purchase necessary.</b> Contest votes never change, so every house still gets one vote per visitor. <a href="/profile#about-xp" data-modal="xp">How XP works</a></p>
        {boosted && user?.xpBoostUntil && <p className="notice" role="status">Your 2× boost is on until {timeFmt.format(user.xpBoostUntil)}.</p>}
        {!user && <p className="small muted"><Link href={`/login?next=/pitstop/${m.id}`} data-modal="login">Log in</Link> before you scan so the boost lands on your account.</p>}
      </section>
    </main>
  );
}
