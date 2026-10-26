import { db } from './db';
import { emailFrom, notificationEmail, replyTo } from './settings';

export type EmailKind = 'signup' | 'verify' | 'login' | 'welcome' | 'submission' | 'submission-received' | 'approved' | 'rejected' | 'test';

export const emailDeliveryConfigured = () => Boolean(process.env.RESEND_API_KEY);
/** Preview deployments link to their own branch URL so emailed links work before the PR is merged. */
const baseUrl = () =>
  process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : (process.env.APP_URL ?? 'http://localhost:3000');
export const appUrl = (path = '') => `${baseUrl().replace(/\/$/, '')}${path}`;

/**
 * Sends through Resend when RESEND_API_KEY is set. Every attempt is written to EmailLog,
 * so the admin Form inbox shows all form traffic even before delivery is configured.
 */
export async function sendEmail(opts: { to: string; subject: string; text: string; kind: EmailKind; replyTo?: string }) {
  let status: 'sent' | 'skipped' | 'failed' = 'skipped';
  let error: string | null = null;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const reply = opts.replyTo ?? (await replyTo());
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: await emailFrom(), to: [opts.to], subject: opts.subject, text: opts.text, ...(reply && { reply_to: reply }) }),
      });
      if (res.ok) status = 'sent';
      else { status = 'failed'; error = `${res.status} ${await res.text()}`.slice(0, 500); }
    } catch (e) {
      status = 'failed';
      error = String(e).slice(0, 500);
    }
  }
  if (status !== 'sent') console.error(`[email] ${opts.kind} to ${opts.to} ${status}${error ? `: ${error}` : ' (RESEND_API_KEY not set)'}`);
  await db.emailLog.create({ data: { to: opts.to, subject: opts.subject, body: opts.text, kind: opts.kind, status, error } });
  return status;
}

/** Sends a form notification to the admin inbox chosen in Admin > Settings. */
/** replyTo lets the admin answer the member directly from their inbox. */
export async function notifyAdmin(subject: string, text: string, kind: EmailKind, replyTo?: string) {
  const to = await notificationEmail();
  if (!to) {
    await db.emailLog.create({ data: { to: '(no notification address set)', subject, body: text, kind, status: 'skipped' } });
    return 'skipped';
  }
  return sendEmail({ to, subject, text, kind, replyTo });
}
