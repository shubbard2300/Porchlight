import Link from 'next/link';
import { LinkForm } from './LinkForm';

export default async function LinkLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="wrap narrow stack">
      <div className="stack" style={{ gap: 6 }}>
        <h1 style={{ fontSize: 34 }}>Sign in with an email link</h1>
        <p className="muted">Forgot your password? We&apos;ll email you a link that signs you in. You can set a new password on your profile.</p>
      </div>
      <div className="panel"><LinkForm next={next} /></div>
      <p className="small muted"><Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in with your password instead</Link></p>
    </main>
  );
}
