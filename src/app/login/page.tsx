import Link from 'next/link';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="wrap narrow stack">
      <div className="stack" style={{ gap: 6 }}>
        <h1 style={{ fontSize: 34 }}>Welcome back</h1>
        <p className="muted">We&apos;ll email you a link that signs you in. No password to remember.</p>
      </div>
      <div className="panel"><LoginForm next={next} /></div>
      <p className="small muted">New here? <Link href="/join">Join Porchlight</Link></p>
    </main>
  );
}
