'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = { href: string; label: string; icon: React.ReactNode; match: (path: string) => boolean; modal?: string };

const I = ({ d }: { d: React.ReactNode }) => <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

/**
 * Thumb-reach navigation for phones: the five places people go most, always one tap away.
 * Hidden on wider screens, where the header nav does the same job.
 */
export function BottomTabs({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const tabs: Tab[] = [
    { href: '/', label: 'Map', match: (p) => p === '/' || p.startsWith('/house') || p.startsWith('/block'), icon: <I d={<><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></>} /> },
    { href: '/route', label: 'Tour', match: (p) => p.startsWith('/route') || p.startsWith('/caravan'), icon: <I d={<><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>} /> },
    { href: signedIn ? '/submit' : '/join/host', label: 'Add porch', modal: signedIn ? undefined : 'join:host', match: (p) => p.startsWith('/submit'), icon: <I d={<path d="M12 5v14M5 12h14" />} /> },
    { href: '/leaderboard', label: 'Favorites', match: (p) => p.startsWith('/leaderboard'), icon: <I d={<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />} /> },
    signedIn
      ? { href: '/profile', label: 'Me', match: (p) => p.startsWith('/profile'), icon: <I d={<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>} /> }
      : { href: '/faq', label: 'Help', match: (p) => p.startsWith('/faq'), icon: <I d={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.3M12 17.5v.01" /></>} /> },
  ];
  if (path.startsWith('/admin')) return null;
  return (
    <nav className="bottom-tabs" aria-label="Quick">
      {tabs.map((t, i) => {
        const active = t.match(path);
        return (
          <Link key={t.label} href={t.href} data-modal={t.modal} aria-current={active ? 'page' : undefined} className={i === 2 ? 'tab-add' : undefined}>
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
