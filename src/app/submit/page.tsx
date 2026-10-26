import { requireUser } from '@/lib/auth';
import { contestToday, defaultSeason, formatDay, openForSubmissions, phase } from '@/lib/seasons';
import { SubmitForm } from './SubmitForm';

export default async function SubmitPage() {
  await requireUser('/submit');
  const today = contestToday();
  const open = openForSubmissions(today);
  const def = open.find((s) => s.key === defaultSeason(today).key) ?? open[0];
  return (
    <main className="wrap narrow stack">
      <div className="stack" style={{ gap: 6 }}>
        <span className="label">Post your house</span>
        <h1 style={{ fontSize: 34 }}>Get your display on the map</h1>
        <p className="muted">Takes about two minutes. We review new houses quickly and email you when yours is live. Approved houses earn 100 XP and the Lamplighter badge.</p>
      </div>
      <div className="panel">
        {open.length === 0 ? <p>No contests are taking entries right now.</p> : (
          <SubmitForm
            defaultSeason={def.key}
            seasons={open.map((s) => ({ key: s.key, label: `${s.name} ${s.year}`, note: phase(s, today) === 'live' ? 'voting now' : `opens ${formatDay(s.opens)}` }))}
          />
        )}
      </div>
    </main>
  );
}
