import Link from 'next/link';
import { SignupForm } from './SignupForm';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; invite?: string }> }) {
  const { next, invite } = await searchParams;
  return (
    <main className="wrap narrow stack">
      <div className="stack" style={{ gap: 6 }}>
        <span className="label">Join Porchlight</span>
        <h1 style={{ fontSize: 34 }}>Sign up and get your welcome gift</h1>
        <p className="muted">100 XP and the Porch Pass badge, the moment you join.</p>
      </div>
      <div className="panel"><SignupForm next={next} invite={invite} /></div>
      <p className="small muted">Already have an account? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link></p>
    </main>
  );
}
