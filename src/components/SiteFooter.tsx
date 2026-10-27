import Link from 'next/link';
import { OWNER_NAME } from '@/lib/legal';

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <p>© {new Date().getFullYear()} {OWNER_NAME}. All rights reserved.</p>
        <nav aria-label="Legal">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/accessibility">Accessibility</Link>
          <Link href="/contact" data-modal="contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
