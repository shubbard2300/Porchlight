import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { contestToday, defaultSeason, formatDay, openForSubmissions, phase } from '@/lib/seasons';
import { becomeHost } from '../actions/profile';
import { SubmitForm } from './SubmitForm';

export default async function SubmitPage() {
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
  const today = contestToday();
  const open = openForSubmissions(today);
  const preferred = open.find((s) => s.key === user.hostSeason) ?? open.find((s) => s.key === defaultSeason(today).key) ?? open[0];
  return (
    <main className="wrap narrow stack">
      <div className="stack" style={{ gap: 6 }}>
        <span className="label">Enter the contest</span>
        <h1 style={{ fontSize: 34 }}>Get your display on the map</h1>
        <p className="muted">We filled in what you saved on your profile. We review new houses quickly and email you when yours is live. Approved houses earn 100 XP and the Lamplighter badge.</p>
      </div>
      <div className="panel">
        {!preferred ? <p>No contests are taking entries right now.</p> : (
          <SubmitForm
            defaultSeason={preferred.key}
            seasons={open.map((s) => ({ key: s.key, label: `${s.name} ${s.year}`, note: phase(s, today) === 'live' ? 'voting now' : `opens ${formatDay(s.opens)}` }))}
            prefill={{ name: user.decorationTheme ?? '', address: user.propertyAddress ?? '', neighborhood: user.neighborhood ?? '', description: user.propertyDetails ?? '' }}
          />
        )}
      </div>
    </main>
  );
}
