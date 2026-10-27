import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Cookie Policy · Porchlight' };

export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy" intro="Short version: Porchlight uses a single essential cookie to keep you signed in. No tracking, no advertising, no analytics cookies.">
      <h2>Cookies we use</h2>
      <table>
        <thead><tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">How long</th></tr></thead>
        <tbody>
          <tr><td><code>pl_session</code></td><td>Keeps you signed in after you log in. Strictly necessary, so it does not need consent.</td><td>30 days, or until you log out</td></tr>
        </tbody>
      </table>

      <h2>Third parties</h2>
      <p>Our pages load typefaces from Google Fonts, so your browser sends a request to Google (which includes your IP address). Google Fonts does not set cookies. We do not use any other third-party scripts.</p>

      <h2>Your choices</h2>
      <p>You can block or delete cookies in your browser settings. If you block the session cookie, you can still browse houses, but you won&apos;t be able to sign in.</p>

      <h2>If this changes</h2>
      <p>If we ever add analytics or other non-essential cookies, we will update this page and ask for your consent first where the law requires it. See also our <Link href="/privacy">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
