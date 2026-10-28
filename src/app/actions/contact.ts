'use server';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { appUrl, notifyAdmin } from '@/lib/email';
import { contactAdminEmail } from '@/lib/emails';
import type { FormState } from '@/lib/forms';
import { contactSchema, fieldErrors } from '@/lib/validation';

const SENT = 'Thanks! Your message is on its way. We usually reply within two business days.';
/** Messages one address can send in a 10-minute window, so the form can't be used to flood the inbox. */
const BURST = 3;

export async function sendContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  // Bots fill the hidden field. Look successful so they move on, but send nothing.
  if (d.website) return { message: SENT };

  const since = new Date(Date.now() - 10 * 60_000);
  const recent = await db.emailLog.count({ where: { kind: 'contact', createdAt: { gte: since }, body: { contains: `<${d.email}>` } } });
  if (recent >= BURST) return { errors: { form: 'You’ve sent a few messages just now. Give us a little while to catch up, then try again.' } };

  const user = await currentUser();
  const status = await notifyAdmin(
    contactAdminEmail(
      {
        name: d.name,
        email: d.email,
        topic: d.topic,
        signedInAs: user ? `${user.username} (${user.accountType === 'HOST' ? 'host' : 'viewer'})` : null,
        message: d.message,
      },
      appUrl,
    ),
    'contact',
    d.email,
  );
  // The message is saved in the admin inbox either way, so only a failed send is worth telling the person about.
  if (typeof status === 'object' && status.status === 'failed') {
    return { errors: { form: 'We saved your message but couldn’t send the email just now. We’ll still see it, or try again in a minute.' } };
  }
  return { message: SENT };
}
