'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNav({ pending }: { pending: number }) {
  const path = usePathname();
  const items: [string, string, number?][] = [
    ['/admin', 'Overview'],
    ['/admin/submissions', 'Submissions', pending],
    ['/admin/users', 'Users'],
    ['/admin/payments', 'Prize pot'],
    ['/admin/merchants', 'Pitstops'],
    ['/admin/blocks', 'Anchor blocks'],
    ['/admin/inbox', 'Form inbox'],
    ['/admin/settings', 'Settings'],
  ];
  return (
    <nav className="side" aria-label="Admin">
      {items.map(([href, label, count]) => (
        <Link key={href} href={href} aria-current={path === href || ((href === '/admin/merchants' || href === '/admin/blocks') && path.startsWith(href)) ? 'page' : undefined}>
          {label}{count ? <span className="pill PENDING num">{count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
