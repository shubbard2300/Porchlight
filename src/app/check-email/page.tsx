import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { emailDeliveryConfigured } from '@/lib/email';

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ email?: string; dev?: string; wait?: string; failed?: string }> }) {
  const { email, dev, wait, failed } = await searchParams;
  return (
    <main className="wrap narrow stack" style={{ textAlign: 'center', justifyItems: 'center' }}>
      <Icon3D name="envelope" size={88} />
      <h1 style={{ fontSize: 32 }}>Check your email</h1>
      <p className="muted">
        {wait ? 'We just sent you a link a moment ago. Give it a minute, and check your spam folder.' : <>If {email ? <b style={{ color: 'var(--ink)' }}>{email}</b> : 'that address'} has a Porchlight account, a link is on its way. Open it on this device to continue.</>}
      </p>
      {failed && (
        <div className="notice warn" style={{ textAlign: 'left', width: '100%' }}>
          <b>We couldn&apos;t send that email.</b> <span className="small">Please try again in a minute. If it keeps happening, tell us the code: {failed.slice(0, 40)}</span>
        </div>
      )}
      {!dev && !emailDeliveryConfigured() && (
        <div className="notice warn" style={{ textAlign: 'left', width: '100%' }}>
          <b>Email delivery isn&apos;t set up on this server yet.</b> <span className="small">An admin needs to add RESEND_API_KEY and redeploy.</span>
        </div>
      )}
      {dev && (
        <div className="notice warn stack" style={{ gap: 6, textAlign: 'left', width: '100%' }}>
          <b>Development mode</b>
          <span className="small">Email delivery isn&apos;t set up, so here is the link that was just emailed.</span>
          <a href={dev} style={{ wordBreak: 'break-all' }}>{dev}</a>
        </div>
      )}
      <p className="small muted">Wrong address? <Link href="/join">Start over</Link> · <Link href="/login/link">Send another link</Link></p>
    </main>
  );
}
