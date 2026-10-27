import Link from 'next/link';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { CONTACT_EMAIL, OWNER_NAME } from '@/lib/legal';

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-brand">
          <LogoMark size={36} />
          <div>
            <b><Wordmark /></b>
            <p>© {new Date().getFullYear()} {OWNER_NAME}. Leave the light on.</p>
          </div>
        </div>
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
