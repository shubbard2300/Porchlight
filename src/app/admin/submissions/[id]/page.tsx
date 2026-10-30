import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSeason } from '@/lib/seasons';
import { HouseDetailsForm } from '../../../profile/ProfileForms';

/** Editors and Super Admins fix anyone's submission: name, address, viewing hours and description. */
export default async function EditSubmission({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const h = await db.house.findUnique({ where: { id: (await params).id }, include: { owner: { select: { username: true, email: true } } } });
  if (!h) notFound();
  const s = getSeason(h.season);
  return (
    <>
      <p className="small"><Link href={`/admin/submissions?status=${h.status}#h-${h.id}`}>Back to submissions</Link></p>
      <div className="row spread">
        <div>
          <h1 style={{ fontSize: 30 }}>Edit {h.name}</h1>
          <span className="small muted">{s ? `${s.name} ${s.year}` : h.season} · by @{h.owner.username} &lt;{h.owner.email}&gt;</span>
        </div>
        <span className={`pill ${h.status}`}>{h.status.toLowerCase()}</span>
      </div>
      <section className="panel">
        <HouseDetailsForm id={h.id} live={h.status === 'APPROVED'} staff h={{ name: h.name, address: h.address, neighborhood: h.neighborhood ?? '', showExactAddress: h.showExactAddress, litFrom: h.litFrom, litUntil: h.litUntil, description: h.description }} />
      </section>
      <p className="small muted">The host isn&rsquo;t emailed about edits. Approve, take down or delete it from the submissions list.</p>
    </>
  );
}
