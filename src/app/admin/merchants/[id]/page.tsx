import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { TIERS } from '@/lib/pitstops';
import { deleteMerchant } from '../../../actions/merchants';
import { MerchantForm } from '../MerchantForm';

export default async function EditMerchant({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const m = await db.merchant.findUnique({ where: { id } });
  if (!m) notFound();
  const since = new Date(Date.now() - 7 * 24 * 3600_000);
  const [all, week, people] = await Promise.all([
    db.pitstopScan.count({ where: { merchantId: id } }),
    db.pitstopScan.count({ where: { merchantId: id, createdAt: { gte: since } } }),
    db.pitstopScan.groupBy({ by: ['userId'], where: { merchantId: id } }).then((g) => g.length),
  ]);
  return (
    <>
      <Link href="/admin/merchants" className="small">← All pitstops</Link>
      <div className="row spread">
        <h1 style={{ fontSize: 30 }}>{m.name}</h1>
        <span className="pill" style={{ background: TIERS[m.tier].color }}>{TIERS[m.tier].label}</span>
      </div>
      {saved === '1' && <p className="notice" role="status">Saved. The pin is on the map.</p>}
      {saved === 'nopin' && <p className="notice warn" role="status">Saved, but the address couldn&rsquo;t be found on the map. Check it, or enter latitude and longitude.</p>}
      <div className="stats">
        <div className="stat"><span className="label">Scans, last 7 days</span><b className="num">{week}</b></div>
        <div className="stat"><span className="label">Scans, all time</span><b className="num">{all}</b></div>
        <div className="stat"><span className="label">Different visitors</span><b className="num">{people}</b></div>
      </div>
      <div className="row">
        <Link href={`/pitstop/${m.id}/sign`} className="btn primary">Print counter QR sign</Link>
        <Link href={`/pitstop/${m.id}`} className="btn ghost">View public page</Link>
      </div>
      <section className="panel stack">
        <h2 style={{ fontSize: 20 }}>Details</h2>
        <MerchantForm initial={{ id: m.id, name: m.name, category: m.category, tier: m.tier, address: m.address, offer: m.offer, hours: m.hours ?? '', website: m.website ?? '', lat: m.lat?.toString() ?? '', lng: m.lng?.toString() ?? '', active: m.active }} />
      </section>
      <form action={deleteMerchant.bind(null, m.id)}>
        <button type="submit" className="btn danger sm">Delete pitstop</button>
      </form>
    </>
  );
}
