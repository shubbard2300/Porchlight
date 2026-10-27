import { CONTACT_EMAIL, LEGAL_UPDATED } from '@/lib/legal';

export function LegalPage({ title, intro, children }: { title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="wrap legal">
      <p className="label">Last updated {LEGAL_UPDATED}</p>
      <h1>{title}</h1>
      <p className="lede">{intro}</p>
      {children}
      <p className="muted small legal-contact">Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </main>
  );
}
