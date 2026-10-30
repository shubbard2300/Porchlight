import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteBlock } from '../../../actions/blocks';
import { BlockForm } from '../BlockForm';

export default async function EditBlock({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  const b = await db.anchorBlock.findUnique({ where: { id } });
  if (!b) notFound();
  return (
    <>
      <Link href="/admin/blocks" className="small">← All blocks</Link>
      <h1 style={{ fontSize: 30 }}>{b.name}</h1>
      {saved === '1' && <p className="notice" role="status">Saved. The zone is on the map.</p>}
      {saved === 'nopin' && <p className="notice warn" role="status">Saved, but the address couldn&rsquo;t be found on the map. Check it, or enter latitude and longitude.</p>}
      <div className="row">
        <Link href={`/block/${b.id}`} className="btn primary">View block page</Link>
        <Link href={`/block/${b.id}/flyer`} className="btn ghost">Print neighbor flyer</Link>
      </div>
      <section className="panel stack">
        <h2 style={{ fontSize: 20 }}>Details</h2>
        <BlockForm initial={{ id: b.id, name: b.name, blurb: b.blurb, address: b.address, radiusM: String(b.radiusM), lat: b.lat?.toString() ?? '', lng: b.lng?.toString() ?? '', featured: b.featured, active: b.active }} />
      </section>
      <form action={deleteBlock.bind(null, b.id)}>
        <button type="submit" className="btn danger sm">Delete block</button>
      </form>
    </>
  );
}
