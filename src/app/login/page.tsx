import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="wrap narrow stack">
      <div className="page-head"><Icon3D name="key" size={64} /><h1 style={{ fontSize: 32 }}>Welcome back</h1></div>
      <div className="panel"><LoginForm next={next} /></div>
      <p className="small muted">New here? <Link href="/join">Join Porchlight</Link></p>
    </main>
  );
}
