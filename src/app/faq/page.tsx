import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQ } from '@/lib/faq';
import { FaqBrowser } from './FaqBrowser';

export const metadata: Metadata = {
  title: 'Questions and answers · Porchlight',
  description: 'How Porchlight works: posting your house, photo tips, visiting safely, voting, privacy, prizes and XP.',
};

export default function FaqPage() {
  return (
    <main className="wrap faq">
      <header className="faq-head">
        <span className="label">Help</span>
        <h1>Questions and answers</h1>
        <p className="muted">Everything about hosting, visiting and voting, in one place. Can’t find it? <Link href="/contact" data-modal="contact">Ask us</Link>.</p>
      </header>
      <FaqBrowser topics={FAQ} />
    </main>
  );
}
