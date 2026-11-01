import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';

export const metadata = { title: 'Account deleted · Porchlight' };

export default function AccountDeleted() {
  return (
    <main className="wrap narrow stack" style={{ textAlign: 'center', justifyItems: 'center' }}>
      <Icon3D name="moon" size={88} />
      <h1 style={{ fontSize: 32 }}>Your account is deleted</h1>
      <p className="muted">Your profile, submissions, photos and votes have been removed from Porchlight. Thanks for lighting up the neighborhood with us.</p>
      <p className="small muted">Changed your mind? You&apos;re always welcome back. <Link href="/join" data-modal="join">Make a new account</Link></p>
      <Link href="/" className="btn primary">Back to the map</Link>
    </main>
  );
}
