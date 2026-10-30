import { requireSuperAdmin } from '@/lib/auth';
import { emailDeliveryConfigured } from '@/lib/email';
import { emailFrom, notificationEmail, replyTo } from '@/lib/settings';
import { sendTestEmail } from '../../actions/admin';
import { SettingsForm } from './SettingsForm';

export default async function Settings() {
  await requireSuperAdmin();
  const [to, from, reply] = await Promise.all([notificationEmail(), emailFrom(), replyTo()]);
  const delivering = emailDeliveryConfigured();
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Settings</h1>
      <div className="panel"><SettingsForm notificationEmail={to ?? ''} emailFrom={from} replyTo={reply ?? ''} /></div>
      <div className="panel stack" style={{ gap: 10 }}>
        <h2 style={{ fontSize: 18 }}>Email delivery</h2>
        <p className="small">
          <span className={`pill ${delivering ? 'sent' : 'skipped'}`}>{delivering ? 'Delivering' : 'Not delivering'}</span>{' '}
          {delivering ? 'Emails go out through Resend.' : 'Add RESEND_API_KEY to the server environment to deliver email. Until then, everything is kept in the Form inbox.'}
        </p>
        <form action={sendTestEmail}><button className="btn ghost sm" disabled={!to}>Send a test email to {to ?? 'the notification address'}</button></form>
      </div>
    </>
  );
}
