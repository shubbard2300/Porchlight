import 'server-only';
import { createHmac, randomBytes } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { after } from 'next/server';
import { db } from './db';
import { checkHookUrl, isPrivateAddress, LIGHT_COOLDOWN_S, LIGHT_EVENTS, LIGHT_TIMEOUT_MS, lightPayload, type LightEvent } from './porchLights';

/** HMAC of the exact body, hex, so a receiver can verify a call with the secret shown to the host. */
export const signBody = (body: string, secret: string) => createHmac('sha256', secret).update(body).digest('hex');

export const newSecret = () => randomBytes(18).toString('base64url');

/**
 * Calls a host's webhook, refusing anything that resolves to a private network so the hook can't be
 * used to reach inside ours. No redirects, five-second timeout. Returns a short status for the host.
 */
export async function callHook(rawUrl: string, secret: string, payload: ReturnType<typeof lightPayload>): Promise<string> {
  const checked = checkHookUrl(rawUrl);
  if (!checked.ok) return `Not sent: ${checked.error}`;
  try {
    const addrs = await lookup(checked.url.hostname, { all: true });
    // Local testing only: lets a dev server reach a receiver on this machine. Never honored in production.
    const allowPrivate = process.env.NODE_ENV !== 'production' && process.env.LIGHTS_ALLOW_PRIVATE === '1';
    if (addrs.length === 0 || (!allowPrivate && addrs.some((a) => isPrivateAddress(a.address)))) return 'Not sent: that address points to a private network.';
  } catch {
    return 'Not sent: we couldn’t find that web address.';
  }
  const body = JSON.stringify(payload);
  try {
    const res = await fetch(checked.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Porchlight-Lights/1', 'X-Porchlight-Event': payload.event, 'X-Porchlight-Signature': `sha256=${signBody(body, secret)}` },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(LIGHT_TIMEOUT_MS),
      cache: 'no-store',
    });
    return res.ok ? `Delivered (${res.status})` : `Their server answered ${res.status}`;
  } catch (err) {
    return (err as Error).name === 'TimeoutError' ? 'No answer within 5 seconds' : 'Couldn’t connect';
  }
}

/** Flashes a house's lights for an event, if the host set up a hook for it and the cooldown has passed. */
export async function fireLights(houseId: string, event: Exclude<LightEvent, 'test'>, visitorId: string) {
  const t = await db.porchTrigger.findUnique({ where: { houseId }, include: { house: { select: { name: true } } } });
  const flag = LIGHT_EVENTS.find((e) => e.key === event)!.flag;
  if (!t || !t.enabled || !t[flag]) return;
  const since = new Date(Date.now() - LIGHT_COOLDOWN_S * 1000);
  // Claim the slot first so a burst of check-ins makes one call.
  const claimed = await db.porchTrigger.updateMany({ where: { id: t.id, OR: [{ lastFiredAt: null }, { lastFiredAt: { lt: since } }] }, data: { lastFiredAt: new Date() } });
  if (claimed.count === 0) return;
  const visitor = await db.user.findUnique({ where: { id: visitorId }, select: { displayName: true, username: true } });
  const status = await callHook(t.url, t.secret, lightPayload(event, t.house.name, visitor ? visitor.displayName || visitor.username : null));
  await db.porchTrigger.update({ where: { id: t.id }, data: { lastStatus: `${status} · ${event}` } });
}

/** Runs fireLights after the response is sent, so a slow light hub never slows a visitor down. */
export const lightsAfter = (houseId: string, event: Exclude<LightEvent, 'test'>, visitorId: string) =>
  after(() => fireLights(houseId, event, visitorId).catch((e) => console.error('[lights]', e)));
