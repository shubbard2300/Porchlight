import Link from 'next/link';
import { confirmLink } from '../../actions/auth';
import { SubmitButton } from '@/components/SubmitButton';

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  if (error || !token) {
    return (
      <main className="wrap narrow stack" style={{ textAlign: 'center', justifyItems: 'center' }}>
        <h1 style={{ fontSize: 30 }}>This link has expired</h1>
        <p className="muted">Links work once and expire after a while. Request a fresh one and use the newest email.</p>
        <Link href="/login" className="btn primary">Send me a new link</Link>
      </main>
    );
  }
  return (
    <main className="wrap narrow stack" style={{ textAlign: 'center', justifyItems: 'center' }}>
      <h1 style={{ fontSize: 30 }}>You&apos;re almost in</h1>
      <p className="muted">Confirm it&apos;s you to open your Porchlight profile.</p>
      <form action={confirmLink} style={{ width: '100%', maxWidth: 320 }}>
        <input type="hidden" name="token" value={token} />
        <SubmitButton pendingText="Confirming…">Continue to my profile</SubmitButton>
      </form>
    </main>
  );
}
