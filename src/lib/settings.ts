import { db } from './db';

export const SETTING_KEYS = ['notificationEmail', 'emailFrom', 'replyTo', 'contestSeasons'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export async function getSetting(key: SettingKey): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } });
  return row?.value || null;
}

export async function setSetting(key: SettingKey, value: string) {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

/** The inbox that receives sign-up and submission notifications. Admin setting wins over the env default. */
export async function notificationEmail() {
  return (await getSetting('notificationEmail')) ?? process.env.ADMIN_NOTIFY_EMAIL ?? null;
}

export async function emailFrom() {
  return (await getSetting('emailFrom')) ?? process.env.EMAIL_FROM ?? 'Porchlight <onboarding@resend.dev>';
}

/** Where replies to Porchlight emails go, usually a forwarding alias such as hello@yourdomain.com. */
export async function replyTo() {
  return (await getSetting('replyTo')) ?? process.env.EMAIL_REPLY_TO ?? null;
}
