import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { decorFor } from '@/lib/arDecor';
import { seasonCalendar } from '@/lib/seasonConfig';
import { Icon3D } from '@/components/Icon3D';
import { ArEditor } from './ArEditor';

export const metadata: Metadata = { title: 'AR decorations · Porchlight' };

/** The host's AR studio: virtual props on top of their house photo, which visitors see through the camera. */
export default async function ArEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { getSeason } = await seasonCalendar();
  const { id } = await params;
  const user = await requireUser(`/house/${id}/ar/edit`);
  const house = await db.house.findUnique({
    where: { id },
    select: { id: true, name: true, season: true, ownerId: true, photoUrls: true, arGreeting: true, arDecorations: { orderBy: { position: 'asc' }, select: { kind: true, x: true, y: true, scale: true } } },
  });
  if (!house || house.ownerId !== user.id) notFound();
  const holiday = getSeason(house.season)?.name;

  return (
    <main className="wrap stack" style={{ gap: 20, maxWidth: 1000 }}>
      <Link href={`/house/${id}`} className="small">← {house.name}</Link>
      <header className="row" style={{ gap: 16, alignItems: 'center' }}>
        <Icon3D name="sparkles" size={64} />
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ fontSize: 30 }}>AR decorations</h1>
          <p className="muted">Add virtual props to your display. Visitors out front point their phone at your house and see them floating right where you put them.</p>
        </div>
      </header>
      <ArEditor houseId={house.id} photo={house.photoUrls[0] ?? null} palette={decorFor(holiday)} initial={house.arDecorations} initialGreeting={house.arGreeting ?? ''} />
    </main>
  );
}
