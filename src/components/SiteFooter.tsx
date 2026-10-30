import Link from 'next/link';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { OWNER_NAME } from '@/lib/legal';

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-brand">
          <LogoMark size={36} />
          <div>
            <b><Wordmark /></b>
            <p>© {new Date().getFullYear()} {OWNER_NAME}. Built by neighbors. Leave the light on.</p>
          </div>
        </div>
        <nav aria-label="Help and legal">
          <Link href="/faq">FAQ</Link>
          <Link href="/rules">Contest rules</Link>
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
