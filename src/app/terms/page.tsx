import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL, OWNER_NAME, SITE_URL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Terms of Service · Porchlight' };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" intro={<>These terms are an agreement between you and {OWNER_NAME} for using Porchlight at {SITE_URL.replace('https://', '')}. By creating an account or using the site, you agree to them.</>}>
      <h2>Who can use Porchlight</h2>
      <p>You must be at least 18 years old and able to agree to these terms. One account per person. Keep your password private; you are responsible for activity on your account.</p>

      <h2>Posting a house</h2>
      <ul>
        <li>Only post a property you live at or have permission to post, and only photos you took or have the right to share.</li>
        <li>You keep ownership of your photos and text. You give us a non-exclusive, royalty-free license to display, resize, and share them on Porchlight and in promotion of the contest, for as long as they are posted and in the archive of past contests.</li>
        <li>We review submissions and may decline or remove any listing.</li>
      </ul>

      <h2>Visiting and voting</h2>
      <ul>
        <li>Be a good neighbor: view displays from the street or sidewalk, don&apos;t trespass, and respect posted hours and residents&apos; privacy.</li>
        <li>Only real visits count. Check-in photos and locations must be your own and taken at the house.</li>
        <li>Keep comments kind. No harassment, hate, spam, or personal information about others.</li>
        <li>No fake accounts, bots, vote trading, or other ways of gaming the results.</li>
      </ul>

      <h2>Contest rules and the prize pot</h2>
      <ul>
        <li>Each season (such as Halloween or Christmas) runs on the dates shown on the site. Hosts may contribute to that season&apos;s pot when they enter. Contributions are not refundable once a house is approved, except where the law requires or the season is cancelled.</li>
        <li>The house with the most verified likes when voting closes wins the pot. Ties are split evenly. We may disqualify entries or votes that break these terms, and our decision on results is final.</li>
        <li>We will contact the winner by email. The winner may need to confirm their identity and eligibility, and is responsible for any taxes on the prize.</li>
        <li>Official rules for each season may add details, and they control if they differ from this summary.</li>
        <li>The contest is open to legal residents of the United States and is void where prohibited or restricted by law.</li>
        <li>Rewards for voters (such as XP and badges) have no cash value.</li>
      </ul>

      <h2>Our content</h2>
      <p>The Porchlight name, logo, design, and code belong to {OWNER_NAME}. Don&apos;t copy or scrape the site without permission.</p>

      <h2>Ending your account</h2>
      <p>You can stop using Porchlight and ask us to delete your account at any time. We may suspend or close accounts that break these terms.</p>

      <h2>Disclaimers</h2>
      <p>Porchlight is provided &quot;as is.&quot; We don&apos;t guarantee the site will always be available or error free, and we are not responsible for the condition of any property, for what happens on visits, or for content posted by users. Visit houses at your own risk and follow local laws.</p>

      <h2>Limit of liability</h2>
      <p>To the extent the law allows, {OWNER_NAME} is not liable for indirect or consequential damages, and our total liability to you is limited to the amount you paid us in the past 12 months, or $50 if you paid nothing.</p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will change the date at the top when we do. Continuing to use Porchlight means you accept the update. Our <Link href="/privacy">Privacy Policy</Link> explains how we handle your data. Reach us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
