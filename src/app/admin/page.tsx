import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { db } from '@/lib/db';
import { emailDeliveryConfigured } from '@/lib/email';
import { notificationEmail } from '@/lib/settings';
import { contestToday, phaseLabel, visibleSeasons } from '@/lib/seasons';

export default async function AdminHome() {
  const today = contestToday();
  const [users, newUsers, pending, recentMail, to] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
    db.house.count({ where: { status: 'PENDING' } }),
    db.emailLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
    notificationEmail(),
  ]);
  const seasons = await Promise.all(visibleSeasons(today).map(async (s) => {
    const agg = await db.house.aggregate({ where: { season: s.key, status: 'APPROVED' }, _count: true, _sum: { contributionCents: true } });
    return { s, houses: agg._count, pot: (agg._sum.contributionCents ?? 0) / 100 };
  }));

  return (
    <>
      <h1 style={{ fontSize: 30 }}>Overview</h1>
      {!to && <p className="notice warn">No notification address is set, so form emails have nowhere to go. <Link href="/admin/settings">Set one in Settings</Link>.</p>}
      {to && !emailDeliveryConfigured() && <p className="notice warn">Emails are recorded in the Form inbox but not delivered yet. Add a <code>RESEND_API_KEY</code> to start sending to {to}.</p>}
      <div className="stats">
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="people" size={28} /><span className="label">Users</span></span><b className="num">{users}</b><span className="small muted">+{newUsers} this week</span></div>
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="clipboard" size={28} /><span className="label">Waiting for review</span></span><b className="num">{pending}</b><Link className="small" href="/admin/submissions">Review</Link></div>
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="inbox" size={28} /><span className="label">Emails this week</span></span><b className="num">{recentMail}</b><Link className="small" href="/admin/inbox">Open inbox</Link></div>
      </div>
      <h2 style={{ fontSize: 20 }}>Contests</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Contest</th><th>Status</th><th>Live houses</th><th>Pot pledged</th></tr></thead>
          <tbody>
            {seasons.map(({ s, houses, pot }) => (
              <tr key={s.key}><td><span className="dot" style={{ background: s.color }} /> {s.name} {s.year}</td><td>{phaseLabel(s, today).tag} · <span className="muted">{phaseLabel(s, today).line}</span></td><td className="num">{houses}</td><td className="num">${pot.toLocaleString('en-US')}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
