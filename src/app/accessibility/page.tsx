import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Accessibility · Porchlight' };

export default function Accessibility() {
  return (
    <LegalPage title="Accessibility Statement" intro="We want everyone to be able to find, enjoy, and vote for great holiday houses, including people who use assistive technology.">
      <h2>Our goal</h2>
      <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. That standard is our target, not a claim that every page already meets it.</p>

      <h2>What we do</h2>
      <ul>
        <li>Use semantic page structure, labeled form fields, and visible keyboard focus.</li>
        <li>Choose high-contrast colors and text that can be resized.</li>
        <li>Provide text alternatives for meaningful images, and offer a button for anything you can do with a swipe.</li>
        <li>Check new features with a keyboard and a screen reader as we build them.</li>
      </ul>

      <h2>Known limits</h2>
      <p>Photos uploaded by hosts may not have detailed descriptions, and the map may be harder to use with a screen reader. Every house on the map is also listed on the home page.</p>

      <h2>Tell us about a barrier</h2>
      <p>If something on Porchlight is hard to use, <Link href="/contact?topic=Accessibility" data-modal="contact:Accessibility">send us a message</Link> (or email {CONTACT_EMAIL}) with the page and what happened. We will reply within 5 business days and work with you to get you what you need, including entering or voting another way.</p>
    </LegalPage>
  );
}
