import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PENDING_PHOTO_MS, photoSelect } from '@/lib/housePhotos';
import { contestToday, defaultSeason, formatDay, openForSubmissions, phase } from '@/lib/seasons';
import { becomeHost } from '../actions/profile';
import { SubmitForm } from './SubmitForm';
import { Tip } from '@/components/Tip';

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser('/submit');
  if (user.accountType !== 'HOST') {
    return (
      <main className="wrap narrow stack">
        <h1 style={{ fontSize: 32 }}>Become a host to enter your house</h1>
        <p className="muted">Your account is set up for finding and rating houses. Switch to a host account to put your own display on the map. You keep your XP and badges.</p>
        <div className="row"><form action={becomeHost}><button className="btn primary">Become a host</button></form><Link href="/profile" className="btn ghost">Back to my profile</Link></div>
      </main>
    );
  }
  const { welcome } = await searchParams;
  const today = contestToday();
  // Photos from sign-up or an earlier visit to this form that never became part of an entry.
  const photos = await db.housePhoto.findMany({ where: { ownerId: user.id, houseId: null, createdAt: { gt: new Date(Date.now() - PENDING_PHOTO_MS + 60 * 60 * 1000) } }, orderBy: { createdAt: 'asc' }, select: photoSelect });
  const open = openForSubmissions(today);
  const preferred = open.find((s) => s.key === user.hostSeason) ?? open.find((s) => s.key === defaultSeason(today).key) ?? open[0];
  return (
    <main className="wrap narrow stack">
      <div className="page-head">
        <Icon3D name="house" size={72} />
        <div>
          <span className="label">Enter the contest</span>
          <h1 style={{ fontSize: 32 }}>Get your display on the map</h1>
        </div>
      </div>
      {welcome && (
        <p className="notice">
          Your email is confirmed. Welcome, {user.username}! {photos.length > 0 ? 'Your house photo is already here.' : 'Add a night photo to start.'}{' '}
          Name your display, pick a bracket and send it in. You can change your username on <Link href="/profile">your profile</Link>.
        </p>
      )}
      <div className="stack" style={{ gap: 6 }}>
        <p className="muted">We filled in what you saved on your profile. We review new houses quickly and email you when yours is live. Approved houses earn 100 XP and the Lamplighter badge.</p>
      </div>
      <Tip id="night-photo">Night shots with the lights on get the most likes. Take one from the sidewalk so visitors know what to look for.</Tip>
      <div className="panel">
        {!preferred ? <p>No contests are taking entries right now.</p> : (
          <SubmitForm
            defaultSeason={preferred.key}
            seasons={open.map((s) => ({ key: s.key, holiday: s.name, label: `${s.name} ${s.year}`, note: phase(s, today) === 'live' ? 'voting now' : `opens ${formatDay(s.opens)}` }))}
            photos={photos}
            prefill={{ name: user.decorationTheme ?? '', address: user.propertyAddress ?? '', neighborhood: user.neighborhood ?? '', description: user.propertyDetails ?? '' }}
          />
        )}
      </div>
    </main>
  );
}
