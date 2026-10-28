import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Stripe over plain fetch, like Resend in email.ts: Checkout Sessions to take a host's pot pledge,
 * refunds from the admin, and webhook signature checks. Without STRIPE_SECRET_KEY the pay buttons
 * stay hidden and the pot simply shows no paid money.
 */
export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
/** Lets local tests point at a fake Stripe. */
const apiBase = () => process.env.STRIPE_API_BASE ?? 'https://api.stripe.com';
/** Stripe's default; a signed event older than this is refused so a captured one can't be replayed. */
export const WEBHOOK_TOLERANCE_S = 300;

type Params = { [key: string]: string | number | boolean | null | undefined | Params | Params[] };

/** Encodes nested params the way Stripe's API expects: line_items[0][price_data][currency]=usd. */
export function formEncode(params: Params, prefix = ''): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => parts.push(formEncode(item, `${key}[${i}]`)));
    else if (typeof v === 'object') parts.push(formEncode(v, key));
    else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return parts.filter(Boolean).join('&');
}

async function stripe<T>(method: 'GET' | 'POST', path: string, params?: Params, idempotencyKey?: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not set up');
  const res = await fetch(`${apiBase()}/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params && { 'Content-Type': 'application/x-www-form-urlencoded' }),
      ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
    },
    body: params ? formEncode(params) : undefined,
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${body?.error?.message ?? 'request failed'}`);
  return body as T;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  payment_intent: string | null;
  amount_total: number | null;
  metadata: Record<string, string>;
};

export function createCheckoutSession(o: {
  paymentId: string;
  amountCents: number;
  name: string;
  description: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe<CheckoutSession>('POST', 'checkout/sessions', {
    mode: 'payment',
    client_reference_id: o.paymentId,
    customer_email: o.email,
    success_url: o.successUrl,
    cancel_url: o.cancelUrl,
    line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: o.amountCents, product_data: { name: o.name, description: o.description } } }],
    metadata: { paymentId: o.paymentId },
    payment_intent_data: { metadata: { paymentId: o.paymentId }, description: o.name },
  }, `pot-${o.paymentId}`);
}

export const getCheckoutSession = (id: string) => stripe<CheckoutSession>('GET', `checkout/sessions/${encodeURIComponent(id)}`);

export const refundPaymentIntent = (paymentIntentId: string) =>
  stripe<{ id: string; status: string }>('POST', 'refunds', { payment_intent: paymentIntentId }, `refund-${paymentIntentId}`);

/**
 * Checks a Stripe-Signature header (t=<unix>,v1=<hex hmac>) against the raw body.
 * Returns false for a bad signature or one outside the tolerance window.
 */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, nowS = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  const pairs = header.split(',').map((p) => p.split('=') as [string, string]);
  const t = Number(pairs.find(([k]) => k === 't')?.[1]);
  const sigs = pairs.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!Number.isFinite(t) || sigs.length === 0 || Math.abs(nowS - t) > WEBHOOK_TOLERANCE_S) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest();
  return sigs.some((s) => {
    const got = Buffer.from(s, 'hex');
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}
