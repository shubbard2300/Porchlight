import Link from 'next/link';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="wrap narrow stack">
      <h1 style={{ fontSize: 34 }}>Welcome back</h1>
      <div className="panel"><LoginForm next={next} /></div>
      <p className="small muted">New here? <Link href="/join">Join Porchlight</Link></p>
    </main>
  );
}
