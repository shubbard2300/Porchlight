import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { logout } from './actions/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Porchlight',
  description: 'Find the best holiday houses near you, swipe to rate, and help a neighbor win the pot.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" />
      </head>
      <body>
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="brand">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c3.6 0 6.2 2.7 6.2 6.1 0 2.4-1.3 3.9-2.4 5.1-.8.9-1.3 1.6-1.3 2.6v.7H9.5v-.7c0-1-.5-1.7-1.3-2.6-1.1-1.2-2.4-2.7-2.4-5.1 0-3.4 2.6-6.1 6.2-6.1z" fill="#ffbf52" /><rect x="9.3" y="18" width="5.4" height="3.2" rx="1" fill="#9ca5d4" /></svg>
              Porchlight
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/">Houses</Link>
              {user ? (
                <>
                  {user.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
                  <Link href="/account">{user.name.split(' ')[0]} · <span className="num">{user.xp}</span> XP</Link>
                  <form action={logout}><button type="submit">Log out</button></form>
                </>
              ) : (
                <>
                  <Link href="/login">Log in</Link>
                  <Link href="/signup">Sign up</Link>
                </>
              )}
              <Link href="/submit" className="cta">Post your house</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
