import type { Metadata } from 'next';
import Link from 'next/link';
import { AnalyticsOptOut } from '@/components/AnalyticsOptOut';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Cookie Policy · Porchlight' };

export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy" intro="Short version: Porchlight uses one essential cookie to keep you signed in, and Google Analytics cookies to count visits. No advertising cookies, and you can turn analytics off below.">
      <h2>Cookies we use</h2>
      <table>
        <thead><tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">How long</th></tr></thead>
        <tbody>
          <tr><td><code>pl_session</code></td><td>Keeps you signed in after you log in. Strictly necessary, so it does not need consent.</td><td>30 days, or until you log out</td></tr>
          <tr><td><code>_ga</code>, <code>_ga_*</code></td><td>Google Analytics: tells apart visitors and visits so we can count them. Not used for advertising.</td><td>Up to 2 years</td></tr>
        </tbody>
      </table>

      <h2>Third parties</h2>
      <p>Our pages load typefaces from Google Fonts, so your browser sends a request to Google (which includes your IP address). Google Fonts does not set cookies.</p>
      <p>We use Google Analytics to see, in aggregate, which pages people visit, how they found us and how many finish signing up. We have turned off Google signals and ad personalization. Google processes this data under its own <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">privacy policy</a>. We do not use any other third-party scripts.</p>

      <h2>Your choices</h2>
      <p>You can block or delete cookies in your browser settings. If you block the session cookie, you can still browse houses, but you won&apos;t be able to sign in.</p>
      <p>Analytics stays off if your browser sends a Global Privacy Control signal. You can also turn it off in this browser here, or everywhere with Google&apos;s <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">opt-out add-on</a>:</p>
      <AnalyticsOptOut />

      <h2>If this changes</h2>
      <p>If we add other non-essential cookies, we will update this page and ask for your consent first where the law requires it. See also our <Link href="/privacy">Privacy Policy</Link>.</p>
    </LegalPage>
  );
}
