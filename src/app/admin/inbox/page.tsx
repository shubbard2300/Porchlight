import Link from 'next/link';
import { db } from '@/lib/db';
import { notificationEmail } from '@/lib/settings';

const KINDS: [string, string][] = [['all', 'All'], ['signup', 'Sign-ups'], ['submission', 'Submissions'], ['outgoing', 'To users']];

export default async function Inbox({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind ?? 'all';
  const where = kind === 'signup' || kind === 'submission' ? { kind } : kind === 'outgoing' ? { kind: { notIn: ['signup', 'submission', 'test'] } } : {};
  const [mail, to] = await Promise.all([db.emailLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }), notificationEmail()]);
  return (
    <>
      <h1 style={{ fontSize: 30 }}>Form inbox</h1>
      <p className="muted">Every email Porchlight sends. Sign-up and submission notices go to <b style={{ color: 'var(--ink)' }}>{to ?? 'no address yet'}</b>. <Link href="/admin/settings">Change</Link></p>
      <nav className="tabs">{KINDS.map(([k, l]) => <Link key={k} href={`/admin/inbox?kind=${k}`} aria-current={k === kind ? 'page' : undefined}>{l}</Link>)}</nav>
      {mail.length === 0 && <div className="empty"><p className="muted">No emails yet. They show up here as soon as someone signs up or posts a house.</p></div>}
      <div className="stack" style={{ gap: 8 }}>
        {mail.map((m) => (
          <details key={m.id} className="panel" style={{ padding: '12px 16px' }}>
            <summary className="row spread" style={{ color: 'var(--ink)' }}>
              <span style={{ minWidth: 0 }}><b>{m.subject}</b> <span className="small muted">to {m.to}</span></span>
              <span className="row"><span className={`pill ${m.status}`}>{m.status === 'skipped' ? 'not delivered' : m.status}</span><span className="small muted num">{m.createdAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span></span>
            </summary>
            <pre className="mail">{m.body}</pre>
            {m.error && <p className="err">{m.error}</p>}
          </details>
        ))}
      </div>
    </>
  );
}
