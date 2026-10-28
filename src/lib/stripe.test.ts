import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { formEncode, verifyStripeSignature, WEBHOOK_TOLERANCE_S } from './stripe';

const secret = 'whsec_test';
const sign = (payload: string, t: number, key = secret) => `t=${t},v1=${createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')}`;

describe('stripe', () => {
  it('encodes nested params the way Stripe expects', () => {
    const body = formEncode({ mode: 'payment', skip: undefined, line_items: [{ quantity: 1, price_data: { unit_amount: 2500, product_data: { name: 'Pot & prize' } } }], metadata: { paymentId: 'p1' } });
    expect(decodeURIComponent(body)).toBe('mode=payment&line_items[0][quantity]=1&line_items[0][price_data][unit_amount]=2500&line_items[0][price_data][product_data][name]=Pot & prize&metadata[paymentId]=p1');
    expect(body).toContain('Pot%20%26%20prize');
  });

  it('accepts a valid webhook signature', () => {
    const payload = '{"type":"checkout.session.completed"}';
    expect(verifyStripeSignature(payload, sign(payload, 1000), secret, 1000)).toBe(true);
    expect(verifyStripeSignature(payload, `${sign(payload, 1000, 'old')},${sign(payload, 1000).split(',')[1]}`, secret, 1000)).toBe(true);
  });

  it('rejects tampered, stale, or missing signatures', () => {
    const payload = '{"type":"checkout.session.completed"}';
    expect(verifyStripeSignature(`${payload} `, sign(payload, 1000), secret, 1000)).toBe(false);
    expect(verifyStripeSignature(payload, sign(payload, 1000, 'wrong'), secret, 1000)).toBe(false);
    expect(verifyStripeSignature(payload, sign(payload, 1000), secret, 1000 + WEBHOOK_TOLERANCE_S + 1)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret, 1000)).toBe(false);
    expect(verifyStripeSignature(payload, sign(payload, 1000), '', 1000)).toBe(false);
    expect(verifyStripeSignature(payload, 't=1000,v1=zz', secret, 1000)).toBe(false);
  });
});
