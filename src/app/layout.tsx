import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { currentUser } from '@/lib/auth';
import { avatarUrl } from '@/lib/users';
import { boostActive } from '@/lib/pitstops';
import { Icon3D } from '@/components/Icon3D';
import { BottomTabs } from '@/components/BottomTabs';
import { LearningPath, XpToaster } from '@/components/LearningPath';
import { Modals } from '@/components/Modals';
import { ServiceWorker } from '@/components/ServiceWorker';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteNav } from '@/components/SiteNav';
import { contestToday } from '@/lib/seasons';
import { seasonCalendar } from '@/lib/seasonConfig';
import { seasonTheme } from '@/lib/theme';
import { pendingTour } from '@/lib/tours';
import { logout } from './actions/auth';
import './globals.css';
import { isStaff } from '@/lib/roles';

export const metadata: Metadata = {
  title: 'Porchlight',
  description: 'The holiday light map your neighborhood builds together. Add your porch, visit in person, and help pick the community’s favorites.',
  appleWebApp: { capable: true, title: 'Porchlight', statusBarStyle: 'black' },
  icons: { apple: '/app-icons/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#14123a' };

export const dynamic = 'force-dynamic';

const FONTS = 'https://fonts.googleapis.com/css2?' + [
  'Unbounded:wght@700;800', // wordmark
  'Plus+Jakarta+Sans:wght@400;500;600;700;800', // body, all seasons
  'Bricolage+Grotesque:opsz,wght@12..96,600..800', // default headings
  'Grenze:wght@600;700;800', 'Grenze+Gotisch:wght@800', // Halloween headings + hero accent
  'Fraunces:opsz,wght,SOFT,WONK@9..144,600..900,0..100,0..1', 'Berkshire+Swash', // Christmas headings + hero accent
].map((f) => `family=${f}`).join('&') + '&display=swap';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { defaultSeason } = await seasonCalendar();
  const user = await currentUser();
  const boosted = boostActive(user?.xpBoostUntil);
  const tour = user && pendingTour(user);
  // Fonts and background follow the upcoming holiday. Pages about one contest can override it with data-season on <main>.
  const look = seasonTheme(defaultSeason(contestToday())).look;
  return (
    <html lang="en" data-season={look}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* One stylesheet for every season: browsers only download the font files a page actually uses. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <ServiceWorker />
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="brand">
              <LogoMark size={42} className="brand-mark" />
              <Wordmark />
            </Link>
            <SiteNav>
              <Link href="/#map">Map</Link>
              <Link href="/route">Plan a route</Link>
              {user && <Link href="/caravan">Caravan</Link>}
              <Link href="/leaderboard">Leaderboard</Link>
              <Link href="/faq" className="nav-faq">FAQ</Link>
              {user ? (
                <>
                  {isStaff(user.role) && <Link href="/admin">Admin</Link>}
                  <span className="me-group">
                    <Link href="/profile" className="me">
                      {avatarUrl(user) ? <img src={avatarUrl(user)!} alt="" className="avatar sm" /> : <span className="avatar sm" aria-hidden="true">{user.username[0].toUpperCase()}</span>}
                      {user.username}
                    </Link>
                    <a href="/profile#about-xp" data-modal="xp" className="xp-chip num" aria-label={`${user.xp} XP${boosted ? ', double XP boost on' : ''}. How XP works`}>
                      <Icon3D name="sparkles" size={18} />{user.xp} XP{boosted && <b className="xp-boost">2×</b>}
                      <span className="xp-tip" aria-hidden="true">
                        <b>XP: your explorer points</b>
                        Earn them by checking in at porches, filling in scorecards and scanning pitstops. They level you up but never change votes.
                        {boosted && <em>2× pitstop boost is on: everything you earn counts double.</em>}
                        <span className="xp-tip-more">Learn more</span>
                      </span>
                    </a>
                  </span>
                  <form action={logout}><button type="submit">Log out</button></form>
                </>
              ) : (
                <>
                  <Link href="/login" data-modal="login">Log in</Link>
                  <Link href="/join" data-modal="join">Sign up</Link>
                </>
              )}
              <Link href={user ? '/submit' : '/join/host'} data-modal={user ? undefined : 'join:host'} className="cta">Add your porch</Link>
            </SiteNav>
          </div>
        </header>
        {children}
        <SiteFooter />
        <BottomTabs signedIn={Boolean(user)} />
        {tour && <LearningPath key={tour} tour={tour} name={user.displayName} />}
        {user && <XpToaster />}
        <Modals signedIn={Boolean(user)} contact={{ name: user ? (user.displayName ?? user.username) : undefined, email: user?.email }} xp={user ? { xp: user.xp, boostUntil: user.xpBoostUntil?.toISOString() ?? null } : null} />
      </body>
    </html>
  );
}
