'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { appUrl } from '@/lib/email';
import type { FormState } from '@/lib/forms';
import { LEGAL_UPDATED } from '@/lib/legal';
import { canPay, POT_AMOUNTS } from '@/lib/pot';
import { markRefunded } from '@/lib/potServer';
import { contestToday, phase } from '@/lib/seasons';
import { seasonCalendar } from '@/lib/seasonConfig';
import { createCheckoutSession, refundPaymentIntent, stripeConfigured } from '@/lib/stripe';
import { fieldErrors, sponsorSchema } from '@/lib/validation';

/** Sends a host to Stripe Checkout to pay their pledge into their house's season pot. */
export async function payPledge(houseId: string, fd: FormData) {
  const { getSeason } = await seasonCalendar();
  const user = await requireUser('/profile');
  const back = (why: string) => redirect(`/profile?pay=${why}#pot-${houseId}`);
  const amount = Number(fd.get('amount'));
  if (!(POT_AMOUNTS as readonly number[]).includes(amount)) back('amount');
  if (fd.get('agreeRules') !== 'on') back('agree');
  if (!stripeConfigured()) back('off');
  const house = await db.house.findUnique({ where: { id: houseId }, include: { potPayments: { where: { status: 'PAID' }, select: { id: true } } } });
  const season = getSeason(house?.season);
  if (!house || house.ownerId !== user.id || !season) back('missing');
  if (!canPay({ status: house!.status, phase: phase(season!, contestToday()), paid: house!.potPayments.length > 0 })) back('closed');

  // An earlier checkout for this house that was cancelled or left open is abandoned now. If it does get
  // paid after all, Stripe's webhook moves it to PAID anyway.
  await db.potPayment.updateMany({ where: { houseId, status: 'PENDING' }, data: { status: 'EXPIRED' } });
  const payment = await db.potPayment.create({ data: { season: season!.key, source: 'HOST', amountCents: amount * 100, houseId, userId: user.id, rulesAcceptedAt: new Date(), rulesVersion: LEGAL_UPDATED } });
  let url: string | null = null;
  try {
    const session = await createCheckoutSession({
      paymentId: payment.id,
      amountCents: payment.amountCents,
      name: `${season!.name} ${season!.year} prize pot`,
      description: `Contribution for ${house!.name}. Optional: free submissions compete for the same prize.`,
      email: user.email,
      successUrl: appUrl(`/pot/${payment.id}/done?session_id={CHECKOUT_SESSION_ID}`),
      cancelUrl: appUrl(`/profile?pay=cancelled#pot-${houseId}`),
    });
    await db.potPayment.update({ where: { id: payment.id }, data: { stripeSessionId: session.id } });
    url = session.url;
  } catch (err) {
    console.error('[stripe] checkout failed', err);
    await db.potPayment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } });
  }
  if (!url) back('error');
  redirect(url!);
}

/** Refunds a host's card payment in full. The webhook would also mark it, but we don't wait for it. */
export async function refundPayment(id: string) {
  await requireAdmin();
  const p = await db.potPayment.findUnique({ where: { id } });
  if (!p || p.status !== 'PAID' || p.source !== 'HOST' || !p.stripePaymentIntentId) return;
  try {
    await refundPaymentIntent(p.stripePaymentIntentId);
    await markRefunded({ id });
  } catch (err) {
    console.error('[stripe] refund failed', err);
    redirect('/admin/payments?refund=failed');
  }
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
}

/** Records money a sponsor added to a season's pot outside Stripe (a check, an invoice). */
export async function addSponsor(_prev: FormState, fd: FormData): Promise<FormState> {
  const { getSeason } = await seasonCalendar();
  await requireAdmin();
  const parsed = sponsorSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (!getSeason(d.season)) return { errors: { season: 'Pick a contest.' } };
  const merchant = d.merchantId ? await db.merchant.findUnique({ where: { id: d.merchantId }, select: { id: true, name: true } }) : null;
  if (!merchant && !d.sponsorName) return { errors: { sponsorName: 'Name the sponsor or pick a pitstop.' } };
  await db.potPayment.create({
    data: { season: d.season, source: 'SPONSOR', status: 'PAID', paidAt: new Date(), amountCents: Math.round(d.amount * 100), merchantId: merchant?.id ?? null, sponsorName: d.sponsorName || merchant!.name },
  });
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  return { message: 'Sponsor added to the pot.' };
}

export async function removeSponsor(id: string) {
  await requireAdmin();
  await db.potPayment.deleteMany({ where: { id, source: 'SPONSOR' } });
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
}
