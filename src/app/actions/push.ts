'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { ALERT_KINDS, clampRadius } from '@/lib/alerts';
import { pushConfigured, sendPush } from '@/lib/push';

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Saves this device's push subscription for the signed-in user, replacing any older owner of it. */
export async function savePushSubscription(sub: Sub, userAgent: string): Promise<{ ok: boolean }> {
  const user = await requireUser('/profile');
  if (!sub?.endpoint?.startsWith('https://') || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const data = { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: userAgent.slice(0, 200) };
  await db.pushSubscription.upsert({ where: { endpoint: sub.endpoint }, create: { endpoint: sub.endpoint, ...data }, update: data });
  revalidatePath('/profile');
  return { ok: true };
}

export async function removePushSubscription(endpoint: string) {
  const user = await requireUser('/profile');
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  revalidatePath('/profile');
}

/** Saves which alerts the user wants and, for nearby alerts, the spot and radius. */
export async function saveAlertPrefs(prefs: Record<string, boolean>, spot: { lat: number; lng: number } | null | 'clear', radiusKm: number) {
  const user = await requireUser('/profile');
  const flags = Object.fromEntries(ALERT_KINDS.map((k) => [k.key, Boolean(prefs[k.key])]));
  const place = spot === 'clear' ? { alertLat: null, alertLng: null }
    : spot && Math.abs(spot.lat) <= 90 && Math.abs(spot.lng) <= 180 ? { alertLat: Math.round(spot.lat * 1000) / 1000, alertLng: Math.round(spot.lng * 1000) / 1000 } : {};
  await db.user.update({ where: { id: user.id }, data: { ...flags, ...place, alertRadiusKm: clampRadius(radiusKm) } });
  revalidatePath('/profile');
}

export async function sendTestAlert(): Promise<number> {
  const user = await requireUser('/profile');
  if (!pushConfigured()) return 0;
  return sendPush([user.id], { title: 'Porchlight alerts are on', body: 'You’ll hear about new porches, likes and last calls here.', url: '/profile#alerts', tag: 'test' });
}
