import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { Icon3D } from '@/components/Icon3D';
import { dollars } from '@/lib/pot';
import { potTotal, syncCheckoutSession } from '@/lib/potServer';
import { seasonCalendar } from '@/lib/seasonConfig';
import { getCheckoutSession, stripeConfigured } from '@/lib/stripe';

export const metadata: Metadata = { title: 'Thanks for adding to the pot · Porchlight' };

/** Where Stripe Checkout sends a host back. Confirms with Stripe right away so the host doesn't wait on the webhook. */
export default async function PotDone({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { getSeason } = await seasonCalendar();
  const { id } = await params;
  const { session_id } = await searchParams;
  const user = await requireUser(`/pot/${id}/done`);
  let payment = await db.potPayment.findUnique({ where: { id }, include: { house: { select: { id: true, name: true } } } });
  if (!payment || payment.userId !== user.id) notFound();

  if (payment.status === 'PENDING' && stripeConfigured() && session_id && session_id === payment.stripeSessionId) {
    try {
      await syncCheckoutSession(await getCheckoutSession(session_id));
      payment = (await db.potPayment.findUnique({ where: { id }, include: { house: { select: { id: true, name: true } } } }))!;
    } catch (err) {
      console.error('[stripe] could not confirm session', err);
    }
  }
  const season = getSeason(payment.season);
  const label = season ? `${season.name} ${season.year}` : payment.season;
  const paid = payment.status === 'PAID';
  const pot = paid ? await potTotal(payment.season) : null;

  return (
    <main className="wrap stack" style={{ gap: 24, maxWidth: 560 }}>
      <section className="panel stack" style={{ gap: 16, justifyItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
        <Icon3D name={paid ? 'money' : 'clipboard'} size={72} />
        {paid ? (
          <>
            <span className="label">Payment received</span>
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)' }}>{dollars(payment.amountCents)} is in the {label} pot</h1>
            <p className="muted">Thanks for growing the prize{payment.house ? ` with ${payment.house.name}` : ''}. The pot is now <b className="num">{dollars(pot!.paidCents)}</b>. Your receipt is on its way from Stripe.</p>
          </>
        ) : payment.status === 'PENDING' ? (
          <>
            <h1 style={{ fontSize: 28 }}>Your payment is processing</h1>
            <p className="muted">Stripe hasn&apos;t confirmed it yet. It usually takes a moment; your profile will show it as paid once it does.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28 }}>{payment.status === 'REFUNDED' ? 'This payment was refunded' : 'This payment didn’t go through'}</h1>
            <p className="muted">{payment.status === 'REFUNDED' ? 'The money went back to your card.' : 'Nothing was charged. You can try again from your profile.'}</p>
          </>
        )}
        <div className="row" style={{ justifyContent: 'center' }}>
          {payment.house && <Link href={`/house/${payment.house.id}`} className="btn primary">View my house</Link>}
          <Link href="/profile" className="btn ghost">Back to my profile</Link>
        </div>
      </section>
    </main>
  );
}
