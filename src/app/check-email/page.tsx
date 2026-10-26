import Link from 'next/link';

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ email?: string; dev?: string; wait?: string }> }) {
  const { email, dev, wait } = await searchParams;
  return (
    <main className="wrap narrow stack" style={{ textAlign: 'center', justifyItems: 'center' }}>
      <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--ember)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
      <h1 style={{ fontSize: 32 }}>Check your email</h1>
      <p className="muted">
        {wait ? 'We just sent you a link a moment ago. Give it a minute, and check your spam folder.' : <>If {email ? <b style={{ color: 'var(--frost)' }}>{email}</b> : 'that address'} has a Porchlight account, a link is on its way. Open it on this device to continue.</>}
      </p>
      {dev && (
        <div className="notice warn stack" style={{ gap: 6, textAlign: 'left', width: '100%' }}>
          <b>Development mode</b>
          <span className="small">Email delivery isn&apos;t set up, so here is the link that was just emailed.</span>
          <a href={dev} style={{ wordBreak: 'break-all' }}>{dev}</a>
        </div>
      )}
      <p className="small muted">Wrong address? <Link href="/join">Start over</Link> · <Link href="/login">Send another link</Link></p>
    </main>
  );
}
