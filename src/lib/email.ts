import { db } from './db';
import { emailFrom, notificationEmail } from './settings';

export type EmailKind = 'signup' | 'welcome' | 'submission' | 'submission-received' | 'approved' | 'rejected' | 'test';

export const emailDeliveryConfigured = () => Boolean(process.env.RESEND_API_KEY);
export const appUrl = (path = '') => `${(process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')}${path}`;

/**
 * Sends through Resend when RESEND_API_KEY is set. Every attempt is written to EmailLog,
 * so the admin Form inbox shows all form traffic even before delivery is configured.
 */
export async function sendEmail(opts: { to: string; subject: string; text: string; kind: EmailKind }) {
  let status: 'sent' | 'skipped' | 'failed' = 'skipped';
  let error: string | null = null;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: await emailFrom(), to: [opts.to], subject: opts.subject, text: opts.text }),
      });
      if (res.ok) status = 'sent';
      else { status = 'failed'; error = `${res.status} ${await res.text()}`.slice(0, 500); }
    } catch (e) {
      status = 'failed';
      error = String(e).slice(0, 500);
    }
  }
  await db.emailLog.create({ data: { to: opts.to, subject: opts.subject, body: opts.text, kind: opts.kind, status, error } });
  return status;
}

/** Sends a form notification to the admin inbox chosen in Admin > Settings. */
export async function notifyAdmin(subject: string, text: string, kind: EmailKind) {
  const to = await notificationEmail();
  if (!to) {
    await db.emailLog.create({ data: { to: '(no notification address set)', subject, body: text, kind, status: 'skipped' } });
    return 'skipped';
  }
  return sendEmail({ to, subject, text, kind });
}
