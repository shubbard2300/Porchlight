import Link from 'next/link';
import { CONTACT_EMAIL, OWNER_NAME } from '@/lib/legal';

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
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
        </nav>
      </div>
    </footer>
  );
}
