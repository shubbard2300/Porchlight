import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { avatarUrl } from '@/lib/users';
import { Icon3D } from '@/components/Icon3D';
import { SiteFooter } from '@/components/SiteFooter';
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
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
      </head>
      <body>
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M4 11 12 4l8 7v9H4z" fill="#fff4e4" stroke="#14123a" strokeWidth="2" strokeLinejoin="round" /><path d="M10 20v-5h4v5" fill="#ff6a1f" stroke="#14123a" strokeWidth="2" strokeLinejoin="round" /><circle cx="12" cy="10.4" r="1.6" fill="#ffb000" stroke="#14123a" strokeWidth="1.5" /></svg>
              </span>
              porchlight
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/#map">Map</Link>
              <Link href="/">Houses</Link>
              {user ? (
                <>
                  {user.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
                  <Link href="/profile" className="me">
                    {avatarUrl(user) ? <img src={avatarUrl(user)!} alt="" className="avatar sm" /> : <span className="avatar sm" aria-hidden="true">{user.username[0].toUpperCase()}</span>}
                    {user.username} <span className="xp-chip num"><Icon3D name="sparkles" size={18} />{user.xp} XP</span>
                  </Link>
                  <form action={logout}><button type="submit">Log out</button></form>
                </>
              ) : (
                <>
                  <Link href="/login">Log in</Link>
                  <Link href="/join">Sign up</Link>
                </>
              )}
              <Link href={user ? '/submit' : '/join/host'} className="cta">Post your house</Link>
            </nav>
          </div>
        </header>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
