'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNav({ pending, superAdmin }: { pending: number; superAdmin: boolean }) {
  const path = usePathname();
  // [href, label, count, Super Admins only]
  const all: [string, string, number?, boolean?][] = [
    ['/admin', 'Overview'],
    ['/admin/submissions', 'Submissions', pending],
    ['/admin/users', 'Users', undefined, true],
    ['/admin/payments', 'Prize pot', undefined, true],
    ['/admin/merchants', 'Pitstops'],
    ['/admin/blocks', 'Anchor blocks'],
    ['/admin/inbox', 'Form inbox', undefined, true],
    ['/admin/settings', 'Settings', undefined, true],
  ];
  const items = all.filter(([, , , only]) => superAdmin || !only);
  return (
    <nav className="side" aria-label="Admin">
      {items.map(([href, label, count]) => (
        <Link key={href} href={href} aria-current={path === href || (href === '/admin/submissions' && path.startsWith(href)) || ((href === '/admin/merchants' || href === '/admin/blocks') && path.startsWith(href)) ? 'page' : undefined}>
          {label}{count ? <span className="pill PENDING num">{count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
