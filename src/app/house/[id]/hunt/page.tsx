import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { votingOpen } from '@/lib/checkIns';
import { bearingFor, critterFor } from '@/lib/hunt';
import { getSeason } from '@/lib/seasons';
import { Icon3D } from '@/components/Icon3D';
import { ArHunt } from './ArHunt';

export const metadata: Metadata = { title: 'AR porch hunt · Porchlight' };

export default async function HuntPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [house, user] = await Promise.all([db.house.findUnique({ where: { id }, select: { id: true, name: true, season: true, status: true, ownerId: true } }), currentUser()]);
  if (!house || house.status !== 'APPROVED') notFound();
  const critter = critterFor(house.id, getSeason(house.season)?.name);
  const [checkIn, caught] = user ? await Promise.all([
    db.checkIn.findFirst({ where: { userId: user.id, houseId: id }, select: { id: true } }),
    db.arCatch.findUnique({ where: { userId_houseId: { userId: user.id, houseId: id } }, select: { id: true } }),
  ]) : [null, null];

  const blocked = !user ? { text: `Log in, then check in at ${house.name} to hunt for ${critter.name}.`, href: `/login?next=/house/${id}/hunt`, cta: 'Log in' }
    : house.ownerId === user.id ? { text: `${critter.name} is hiding at your porch for visitors to find.`, href: `/house/${id}`, cta: 'Back to my house' }
    : !votingOpen(house.season) ? { text: 'The hunt is closed while this contest isn’t open.', href: `/house/${id}`, cta: 'Back to the house' }
    : caught ? { text: `${critter.name} is already in your collection.`, href: '/hunt', cta: 'See my collection' }
    : !checkIn ? { text: `Check in at ${house.name} first, by location or the porch QR sign. Then ${critter.name} will appear.`, href: `/house/${id}#vote`, cta: 'Check in' }
    : null;

  return (
    <main className="wrap stack" style={{ gap: 20, maxWidth: 620 }}>
      <Link href={`/house/${id}`} className="small">← {house.name}</Link>
      {blocked ? (
        <section className="panel stack" style={{ justifyItems: 'center', textAlign: 'center', padding: '32px 24px', gap: 14 }}>
          <Icon3D name={critter.icon} size={96} />
          <h1 style={{ fontSize: 26 }}>{critter.name} the {critter.kind}</h1>
          <p className="muted">{blocked.text}</p>
          <Link href={blocked.href} className="btn primary">{blocked.cta}</Link>
        </section>
      ) : (
        <ArHunt houseId={house.id} houseName={house.name} critter={critter} bearing={bearingFor(house.id, user!.id)} />
      )}
    </main>
  );
}
