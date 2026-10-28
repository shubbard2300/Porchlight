/**
 * Porch light triggers: when something happens at a house, Porchlight POSTs a small JSON message to
 * the host's webhook. IFTTT reads value1..value3, Home Assistant and Zapier read the named fields,
 * so one body works for all of them, and any of them can drive Hue, Twinkly, WLED, LIFX and friends.
 */
export const LIGHT_EVENTS = [
  { key: 'checkin', flag: 'onCheckIn', label: 'A visitor checks in', hint: 'By location or your porch QR sign.' },
  { key: 'like', flag: 'onLike', label: 'Someone likes your house', hint: 'The first time each visitor loves it.' },
  { key: 'catch', flag: 'onCatch', label: 'A visitor catches your AR critter', hint: 'Their camera found your critter.' },
] as const;
export type LightEvent = (typeof LIGHT_EVENTS)[number]['key'] | 'test';

/** Lights flash at most this often per house, however busy the porch gets. */
export const LIGHT_COOLDOWN_S = 20;
export const LIGHT_TIMEOUT_MS = 5000;

export type LightPayload = {
  event: LightEvent; house: string; visitor: string | null; at: string;
  value1: string; value2: string; value3: string;
};

export function lightPayload(event: LightEvent, house: string, visitor: string | null, at = new Date()): LightPayload {
  return { event, house, visitor, at: at.toISOString(), value1: event, value2: house, value3: visitor ?? '' };
}

// No Node imports here: the host's settings form uses LIGHT_EVENTS in the browser.
const isV4 = (s: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s);

/** Checks the URL's shape. Where it points (no private networks) is checked again when we call it. */
export function checkHookUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return { ok: false, error: 'Paste the full webhook link, starting with https://' }; }
  if (url.protocol !== 'https:') return { ok: false, error: 'The webhook link must start with https://' };
  if (url.username || url.password) return { ok: false, error: 'Leave the username and password out of the link.' };
  if (url.port && url.port !== '443') return { ok: false, error: 'Use a standard https link without a port number.' };
  if (isV4(url.hostname) || url.hostname.startsWith('[') || /(^|\.)(localhost|local|internal|lan|home\.arpa)$/i.test(url.hostname)) {
    return { ok: false, error: 'Use a public web address, like an IFTTT or Home Assistant Cloud link.' };
  }
  return { ok: true, url };
}

/** True for addresses we must never call: loopback, private, link-local, carrier NAT, multicast and the like. */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (isV4(v4)) {
    const [a, b] = v4.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  const x = ip.toLowerCase();
  return x === '::' || x === '::1' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith('ff') || x.startsWith('64:ff9b');
}
