import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { Icon3D } from '@/components/Icon3D';
import { forHoliday } from '@/lib/arDecor';
import { seasonCalendar } from '@/lib/seasonConfig';
import { ArViewer } from './ArViewer';

export const metadata: Metadata = { title: 'AR decorations · Porchlight' };

/** Anyone can open a house's AR view; it's meant for visitors standing out front with their phone. */
export default async function ArViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { getSeason } = await seasonCalendar();
  const { id } = await params;
  const [house, user] = await Promise.all([
    db.house.findUnique({
      where: { id },
      select: { id: true, name: true, season: true, status: true, ownerId: true, photoUrls: true, arGreeting: true, arDecorations: { orderBy: { position: 'asc' }, select: { kind: true, x: true, y: true, scale: true } } },
    }),
    currentUser(),
  ]);
  const own = !!user && house?.ownerId === user.id;
  if (!house || (house.status !== 'APPROVED' && !own)) notFound();
  // Props from another holiday (say the host moved their entry) never show.
  const placements = forHoliday(house.arDecorations, getSeason(house.season)?.name);
  const empty = placements.length === 0 && !house.arGreeting;

  return (
    <main className="wrap stack" style={{ gap: 20, maxWidth: 620 }}>
      <div className="row spread">
        <Link href={`/house/${id}`} className="small">← {house.name}</Link>
        {own && <Link href={`/house/${id}/ar/edit`} className="btn sm ghost">Edit decorations</Link>}
      </div>
      {empty ? (
        <section className="panel stack" style={{ justifyItems: 'center', textAlign: 'center', padding: '32px 24px', gap: 14 }}>
          <Icon3D name="sparkles" size={96} />
          <h1 style={{ fontSize: 26 }}>No AR decorations yet</h1>
          <p className="muted">{own ? 'Add virtual props to your display and visitors will see them through their camera.' : `${house.name} hasn’t added any virtual props yet. Check back soon.`}</p>
          <Link href={own ? `/house/${id}/ar/edit` : `/house/${id}`} className="btn primary">{own ? 'Decorate in AR' : 'Back to the house'}</Link>
        </section>
      ) : (
        <ArViewer houseId={house.id} houseName={house.name} photo={house.photoUrls[0] ?? null} placements={placements} greeting={house.arGreeting} />
      )}
    </main>
  );
}
