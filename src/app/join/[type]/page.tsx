import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JoinForm } from './JoinForm';

const COPY = {
  viewer: { type: 'VIEWER' as const, label: 'Viewer / rater', title: 'Find the best lights in town', blurb: 'Sign up and get 100 XP and the Porch Pass badge.' },
  host: { type: 'HOST' as const, label: 'Host / decorator', title: 'Put your house on the map', blurb: 'Sign up, confirm your email, then add your property and this season’s decorations.' },
};

export default async function JoinTypePage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ invite?: string }> }) {
  const c = COPY[(await params).type as keyof typeof COPY];
  if (!c) notFound();
  const { invite } = await searchParams;
  return (
    <main className="wrap narrow stack">
      <Link href="/join" className="small">← Choose a different way to join</Link>
      <div className="stack" style={{ gap: 6 }}>
        <span className="label">{c.label}</span>
        <h1 style={{ fontSize: 34 }}>{c.title}</h1>
        <p className="muted">{c.blurb}</p>
      </div>
      <div className="panel"><JoinForm accountType={c.type} invite={invite} /></div>
    </main>
  );
}
