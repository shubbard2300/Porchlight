import 'server-only';
import webpush from 'web-push';
import { db } from './db';
import type { Alert } from './alerts';

/**
 * Web push through the browser's push service (works for the installed app on iPhone 16.4+,
 * Android and desktop). Needs a VAPID key pair: run `npx web-push generate-vapid-keys` once.
 */
export const pushConfigured = () => Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? null;

let ready = false;
function setup() {
  if (ready || !pushConfigured()) return ready;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@porchlightcontest.com', process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  return (ready = true);
}

/**
 * Sends one alert to every device of the given users. Devices the push service says are gone
 * (404/410) are forgotten. Never throws: an alert is a nice-to-have next to the action that caused it.
 */
export async function sendPush(userIds: string[], alert: Alert): Promise<number> {
  if (userIds.length === 0 || !setup()) return 0;
  const subs = await db.pushSubscription.findMany({ where: { userId: { in: [...new Set(userIds)] } } });
  const payload = JSON.stringify(alert);
  let sent = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600, urgency: 'normal' });
      sent++;
      await db.pushSubscription.update({ where: { id: s.id }, data: { lastUsedAt: new Date() } });
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => null);
      else console.error('[push] send failed', code ?? err);
    }
  }));
  return sent;
}
