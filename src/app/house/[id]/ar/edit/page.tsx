import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { decorFor, forHoliday, greetingHint } from '@/lib/arDecor';
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
          <p className="muted">Add virtual {holiday ?? 'holiday'} props to your display. Visitors out front point their phone at your house and see them floating right where you put them.</p>
        </div>
      </header>
      <ArEditor houseId={house.id} photo={house.photoUrls[0] ?? null} palette={decorFor(holiday)} initial={forHoliday(house.arDecorations, holiday)} initialGreeting={house.arGreeting ?? ''} greetingHint={greetingHint(holiday)} />
      <section className="panel stack" aria-labelledby="how" style={{ gap: 10 }}>
        <h2 id="how" style={{ fontSize: 20 }}>How it works</h2>
        <ol className="stack small" style={{ gap: 6, margin: 0, paddingLeft: 20 }}>
          <li><b>Place your props.</b> Tap one to drop it on your photo, drag it where it belongs on the real house, and use + and − to size it. Tap “3D preview” to see them as visitors will. The set matches your holiday{holiday ? ` (${holiday})` : ''}.</li>
          <li><b>Save.</b> An “AR decorations” card appears on your house page right away.</li>
          <li><b>Visitors look through their phone.</b> Out front, they open the card, line up a faint copy of your photo with your house and tap “Pin it here.” Your props appear as 3D models right where you put them, and they can snap a photo to share. On phones that support it, they can also anchor the props in real space and walk around them.</li>
        </ol>
        <p className="small muted">Tip: a photo taken from the sidewalk, straight on, makes lining up easiest.</p>
      </section>
    </main>
  );
}
