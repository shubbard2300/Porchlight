import 'server-only';
import { db } from './db';
import { EMPTY_POT, sumPot, type PotTotal } from './pot';
import type { CheckoutSession } from './stripe';

/** Paid pot totals for the given seasons. */
export async function potTotals(seasons: string[]): Promise<Map<string, PotTotal>> {
  const rows = await db.potPayment.findMany({ where: { season: { in: seasons }, status: 'PAID' }, select: { season: true, source: true, amountCents: true } });
  return sumPot(rows);
}

export async function potTotal(season: string): Promise<PotTotal> {
  return (await potTotals([season])).get(season) ?? EMPTY_POT;
}

/** Pledges made at submit by live houses that haven't paid yet. */
export async function unpaidPledgeCents(season: string): Promise<number> {
  const agg = await db.house.aggregate({
    where: { season, status: 'APPROVED', contributionCents: { gt: 0 }, potPayments: { none: { status: 'PAID' } } },
    _sum: { contributionCents: true },
  });
  return agg._sum.contributionCents ?? 0;
}

/**
 * Records what Stripe says about a Checkout Session. Safe to call more than once (the webhook and
 * the return page both do): a payment is only ever moved forward, never back.
 */
export async function syncCheckoutSession(s: CheckoutSession) {
  const id = s.metadata?.paymentId;
  if (!id) return null;
  if (s.payment_status === 'paid') {
    await db.potPayment.updateMany({
      where: { id, status: { in: ['PENDING', 'EXPIRED'] } },
      data: { status: 'PAID', paidAt: new Date(), stripePaymentIntentId: s.payment_intent, ...(s.amount_total !== null && { amountCents: s.amount_total }) },
    });
  } else if (s.status === 'expired') {
    await db.potPayment.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'EXPIRED' } });
  }
  return db.potPayment.findUnique({ where: { id } });
}

export async function markRefunded(where: { id: string } | { stripePaymentIntentId: string }) {
  await db.potPayment.updateMany({ where: { ...where, status: 'PAID' }, data: { status: 'REFUNDED', refundedAt: new Date() } });
}
