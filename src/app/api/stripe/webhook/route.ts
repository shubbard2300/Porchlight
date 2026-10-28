import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { markRefunded, syncCheckoutSession } from '@/lib/potServer';
import { verifyStripeSignature, type CheckoutSession } from '@/lib/stripe';

/**
 * Stripe calls this when a Checkout Session finishes or expires and when a payment is refunded.
 * Point a webhook at /api/stripe/webhook in the Stripe dashboard and put its signing secret in
 * STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET ?? '')) {
    return NextResponse.json({ error: 'bad signature' }, { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.expired':
      await syncCheckoutSession(obj as unknown as CheckoutSession);
      break;
    case 'charge.refunded':
      if (typeof obj.payment_intent === 'string' && obj.refunded === true) await markRefunded({ stripePaymentIntentId: obj.payment_intent });
      break;
  }
  revalidatePath('/');
  return NextResponse.json({ received: true });
}
