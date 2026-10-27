import { ContactForm } from '@/components/ContactForm';
import { Icon3D } from '@/components/Icon3D';
import { currentUser } from '@/lib/auth';
import { CONTACT_EMAIL } from '@/lib/legal';

export const metadata = { title: 'Contact Porchlight' };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [user, { topic }] = await Promise.all([currentUser(), searchParams]);
  return (
    <main className="wrap narrow stack">
      <div className="page-head">
        <Icon3D name="envelope" size={64} />
        <div><h1 style={{ fontSize: 32 }}>Say hello</h1><p className="muted">Questions, ideas or trouble with the site. A real person reads every message.</p></div>
      </div>
      <div className="panel"><ContactForm defaults={{ name: user?.displayName ?? user?.username, email: user?.email, topic }} /></div>
      <p className="small muted">Prefer email? Write to {CONTACT_EMAIL}.</p>
    </main>
  );
}
