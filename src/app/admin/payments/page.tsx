import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { db } from '@/lib/db';
import { appUrl } from '@/lib/email';
import { dollars } from '@/lib/pot';
import { potTotal, unpaidPledgeCents } from '@/lib/potServer';
import { seasonStandings } from '@/lib/seasonStandings';
import { contestToday, phase } from '@/lib/seasons';
import { seasonCalendar } from '@/lib/seasonConfig';
import { stripeConfigured } from '@/lib/stripe';
import { PaymentAction } from './PaymentAction';
import { SponsorForm } from './SponsorForm';

const STATUS: Record<string, string> = { PAID: 'Paid', PENDING: 'At checkout', REFUNDED: 'Refunded', EXPIRED: 'Abandoned' };
const WEBHOOK_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'charge.refunded'];

export default async function Payments({ searchParams }: { searchParams: Promise<{ season?: string; refund?: string }> }) {
  const { visibleSeasons, openForSubmissions, all: SEASONS, getSeason, defaultSeason } = await seasonCalendar();
  const today = contestToday();
  const { season: key, refund } = await searchParams;
  const seasons = SEASONS.filter((s) => visibleSeasons(today).includes(s) || openForSubmissions(today).includes(s));
  const season = getSeason(key) ?? defaultSeason(today);
  const [pot, pledged, rows, standings, merchants] = await Promise.all([
    potTotal(season.key),
    unpaidPledgeCents(season.key),
    db.potPayment.findMany({
      where: { season: season.key, status: { not: 'EXPIRED' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { house: { select: { id: true, name: true } }, user: { select: { username: true, email: true } } },
    }),
    seasonStandings(season.key),
    db.merchant.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  const leader = standings[0];
  const p = phase(season, today);

  return (
    <>
      <h1 style={{ fontSize: 30 }}>Prize pot</h1>
      <p className="muted">Hosts pay their optional pledge with Stripe once their house is approved. Sponsors can add to the pot too. Only paid money counts, and paying never changes a house&apos;s standing.</p>
      {refund === 'failed' && <p className="notice warn" role="alert">Stripe didn&apos;t accept that refund. Check the payment in your Stripe dashboard.</p>}
      {!stripeConfigured() && (
        <section className="notice warn stack" style={{ gap: 8 }}>
          <b>Switch on Stripe payments</b>
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>
            <li>In Stripe, copy your secret key (start with a test key, <code>sk_test_…</code>) into the Vercel variable <code>STRIPE_SECRET_KEY</code>.</li>
            <li>In Stripe, add a webhook endpoint at <code>{appUrl('/api/stripe/webhook')}</code> for {WEBHOOK_EVENTS.map((e, i) => <span key={e}>{i ? ', ' : ''}<code>{e}</code></span>)}.</li>
            <li>Copy its signing secret (<code>whsec_…</code>) into <code>STRIPE_WEBHOOK_SECRET</code> and redeploy.</li>
          </ol>
        </section>
      )}
      <nav className="tabs" aria-label="Contest">
        {seasons.map((s) => <Link key={s.key} href={`/admin/payments?season=${s.key}`} aria-current={s.key === season.key ? 'page' : undefined}>{s.name} {s.year}</Link>)}
      </nav>
      <div className="stats">
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="money" size={28} /><span className="label">Pot paid</span></span><b className="num">{dollars(pot.paidCents)}</b><span className="small muted">{dollars(pot.hostCents)} from {pot.hosts} {pot.hosts === 1 ? 'host' : 'hosts'} · {dollars(pot.sponsorCents)} from sponsors</span></div>
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="clipboard" size={28} /><span className="label">Still pledged</span></span><b className="num">{dollars(pledged)}</b><span className="small muted">Live houses that haven&apos;t paid</span></div>
        <div className="stat"><span className="row" style={{ gap: 8 }}><Icon3D name="trophy" size={28} /><span className="label">{p === 'final' || p === 'expired' ? 'Winner' : 'Leading now'}</span></span><b style={{ fontSize: 20 }}>{leader ? leader.name : 'No houses yet'}</b><span className="small muted">{leader ? `${leader.likes} verified ${leader.likes === 1 ? 'like' : 'likes'}` : ''}</span></div>
      </div>
      {(p === 'final' || p === 'expired') && leader && (
        <p className="notice">Voting is closed. Payouts are made by hand: confirm the winner&apos;s identity and eligibility, then send {dollars(pot.paidCents)} (split evenly on a tie). Collect a W-9 if the prize is $600 or more.</p>
      )}

      <h2 style={{ fontSize: 20 }}>Payments</h2>
      {rows.length === 0 ? <div className="empty"><p className="muted">No payments for this contest yet.</p></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>From</th><th>Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="small">{(r.paidAt ?? r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td>
                    {r.source === 'SPONSOR' ? <><b>{r.sponsorName}</b><div className="small muted">Sponsor</div></> : (
                      <>{r.house ? <Link href={`/house/${r.house.id}`}><b>{r.house.name}</b></Link> : <b>Deleted submission</b>}<div className="small muted">{r.user ? `@${r.user.username} · ${r.user.email}` : 'Deleted account'}</div></>
                    )}
                  </td>
                  <td className="num">{dollars(r.amountCents)}</td>
                  <td><span className={`pill ${r.status === 'PAID' ? 'APPROVED' : r.status === 'REFUNDED' ? 'REJECTED' : 'PENDING'}`}>{STATUS[r.status]}</span></td>
                  <td>{r.status === 'PAID' && <PaymentAction id={r.id} kind={r.source === 'SPONSOR' ? 'remove' : 'refund'} label={`${dollars(r.amountCents)} from ${r.sponsorName ?? r.house?.name ?? 'this host'}`} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="panel stack">
        <h2 style={{ fontSize: 20 }}>Add a sponsor contribution</h2>
        <p className="small muted">For money a business or partner adds outside Stripe, like a check. It shows in the pot right away.</p>
        <SponsorForm seasons={seasons.map((s) => ({ key: s.key, label: `${s.name} ${s.year}` }))} season={season.key} merchants={merchants} />
      </section>
    </>
  );
}
