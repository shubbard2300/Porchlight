import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { TIERS, getCategory } from '@/lib/pitstops';
import { EMPTY_MERCHANT, MerchantForm } from './MerchantForm';

export default async function Merchants() {
  await requireAdmin();
  const since = new Date(Date.now() - 7 * 24 * 3600_000);
  const merchants = await db.merchant.findMany({ include: { _count: { select: { scans: true } } } });
  const weekly = await db.pitstopScan.groupBy({ by: ['merchantId'], where: { createdAt: { gte: since } }, _count: { _all: true } });
  const week = new Map(weekly.map((w) => [w.merchantId, w._count._all]));
  merchants.sort((a, b) => TIERS[a.tier].order - TIERS[b.tier].order || a.name.localeCompare(b.name));
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Pitstops</h1>
      <p className="muted">Local businesses sponsoring the contest. They show on every map as Pitstop Pins. Print each one a counter QR sign: visitors who scan it get double XP for 2 hours (contest votes never change).</p>
      {merchants.length === 0 ? <div className="empty"><p className="muted">No pitstops yet. Add your first sponsor below.</p></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Business</th><th>Tier</th><th>Offer</th><th>Scans (7 days / all)</th><th>Map</th></tr></thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id}>
                  <td><Link href={`/admin/merchants/${m.id}`}><b>{m.name}</b></Link><div className="small muted">{getCategory(m.category).label} · {m.address}</div></td>
                  <td><span className="pill" style={{ background: TIERS[m.tier].color }}>{TIERS[m.tier].label}</span></td>
                  <td className="small">{m.offer}</td>
                  <td className="num">{week.get(m.id) ?? 0} / {m._count.scans}</td>
                  <td className="small">{!m.active ? 'Hidden' : m.lat === null ? 'No pin' : 'Live'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="panel stack">
        <h2 style={{ fontSize: 20 }}>Add a pitstop</h2>
        <MerchantForm initial={EMPTY_MERCHANT} />
      </section>
    </>
  );
}
