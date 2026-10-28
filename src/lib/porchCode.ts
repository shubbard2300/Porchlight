import { createHmac, timingSafeEqual } from 'node:crypto';
import { appUrl } from './email';

/**
 * The code printed in a house's porch QR sign. It is derived from the house id with the app secret,
 * so it can't be guessed from the id and needs no database column. It changes only if SESSION_SECRET does.
 */
export function porchCode(houseId: string, secret = process.env.SESSION_SECRET): string {
  if (!secret) throw new Error('SESSION_SECRET must be set');
  return createHmac('sha256', secret).update(`porch:${houseId}`).digest('base64url').slice(0, 16);
}

export function validPorchCode(houseId: string, code: string | null | undefined, secret = process.env.SESSION_SECRET): boolean {
  if (!code) return false;
  const want = Buffer.from(porchCode(houseId, secret));
  const got = Buffer.from(code);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** Where a porch sign's QR code points. */
export const porchUrl = (houseId: string) => appUrl(`/visit/${houseId}?k=${porchCode(houseId)}`);
