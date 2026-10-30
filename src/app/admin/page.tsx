import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { db } from '@/lib/db';
import { emailDeliveryConfigured } from '@/lib/email';
import { dollars } from '@/lib/pot';
import { potTotals, unpaidPledgeCents } from '@/lib/potServer';
import { stripeConfigured } from '@/lib/stripe';
import { pushConfigured } from '@/lib/push';
import { notificationEmail } from '@/lib/settings';
import { contestToday, phaseLabel } from '@/lib/seasons';
import { seasonCalendar } from '@/lib/seasonConfig';

export default async function AdminHome() {
  const { visibleSeasons } = await seasonCalendar();
  const today = contestToday();
  const [users, newUsers, pending, recentMail, to] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
    db.house.count({ where: { status: 'PENDING' } }),
    db.emailLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
    notificationEmail(),
  ]);
  const visible = visibleSeasons(today);
  const pots = await potTotals(visible.map((s) => s.key));
  const seasons = await Promise.all(visible.map(async (s) => {
    const [houses, pledged] = await Promise.all([db.house.count({ where: { season: s.key, status: 'APPROVED' } }), unpaidPledgeCents(s.key)]);
    return { s, houses, paid: pots.get(s.key)?.paidCents ?? 0, pledged };
  }));

  return (
    <>
      <h1 style={{ fontSize: 30 }}>Overview</h1>
      {!to && <p className="notice warn">No notification address is set, so form emails have nowhere to go. <Link href="/admin/settings">Set one in Settings</Link>.</p>}
      {to && !emailDeliveryConfigured() && <p className="notice warn">Emails are recorded in the Form inbox but not delivered yet. Add a <code>RESEND_API_KEY</code> to start sending to {to}.</p>}
      {!stripeConfigured() && <p className="notice warn">Hosts can&apos;t pay their pledges online yet. Add <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code> to switch on Stripe payments. <Link href="/admin/payments">How</Link></p>}
      {!pushConfigured() && <p className="notice warn">Push alerts are off. Run <code>npx web-push generate-vapid-keys</code> once and add the keys as <code>VAPID_PUBLIC_KEY</code> and <code>VAPID_PRIVATE_KEY</code>, plus a random <code>CRON_SECRET</code> for the last-call alert.</p>}
      <div className="stats">
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="people" size={28} /><span className="label">Users</span></span><b className="num">{users}</b><span className="small muted">+{newUsers} this week</span></div>
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="clipboard" size={28} /><span className="label">Waiting for review</span></span><b className="num">{pending}</b><Link className="small" href="/admin/submissions">Review</Link></div>
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="inbox" size={28} /><span className="label">Emails this week</span></span><b className="num">{recentMail}</b><Link className="small" href="/admin/inbox">Open inbox</Link></div>
      </div>
      <h2 style={{ fontSize: 20 }}>Contests</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Contest</th><th>Status</th><th>Live houses</th><th>Pot paid</th><th>Still pledged</th></tr></thead>
          <tbody>
            {seasons.map(({ s, houses, paid, pledged }) => (
              <tr key={s.key}><td><span className="dot" style={{ background: s.color }} /> {s.name} {s.year}</td><td>{phaseLabel(s, today).tag} · <span className="muted">{phaseLabel(s, today).line}</span></td><td className="num">{houses}</td><td className="num"><Link href={`/admin/payments?season=${s.key}`}>{dollars(paid)}</Link></td><td className="num">{dollars(pledged)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
