import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { MAX_MEMBERS, normalizeCode } from '@/lib/caravans';
import { displayName } from '@/lib/users';
import { Icon3D } from '@/components/Icon3D';
import { SubmitButton } from '@/components/SubmitButton';
import { joinCaravan } from '../../actions/caravans';

export const metadata: Metadata = { title: 'Join a caravan · Porchlight' };

const ERRORS: Record<string, string> = {
  ended: 'That caravan has wrapped up for the night. Ask your squad for a fresh code.',
  full: `That caravan is full (${MAX_MEMBERS} people). Start your own and tour alongside them.`,
};

/** Where an invite link or QR lands: shows the caravan and a button to hop in. */
export default async function JoinCaravan({ searchParams }: { searchParams: Promise<{ code?: string; error?: string }> }) {
  const { code: raw = '', error } = await searchParams;
  const code = normalizeCode(raw);
  const [user, caravan] = await Promise.all([
    currentUser(),
    code ? db.caravan.findUnique({
      where: { code },
      include: { leader: { select: { username: true, displayName: true } }, _count: { select: { members: { where: { leftAt: null } } } } },
    }) : null,
  ]);
  const live = caravan && caravan.endsAt > new Date();
  const next = `/caravan/join?code=${code}`;

  return (
    <main className="wrap stack" style={{ gap: 24, maxWidth: 560 }}>
      <Link href="/caravan" className="small">← Caravan mode</Link>
      <section className="panel stack" style={{ gap: 16, justifyItems: 'center', textAlign: 'center', padding: '32px 24px' }}>
        <Icon3D name="people" size={72} />
        {error && ERRORS[error] ? <p className="notice warn" role="alert">{ERRORS[error]}</p>
          : !live ? (
            <>
              <h1 style={{ fontSize: 28 }}>{code ? 'That code didn’t match a caravan' : 'Join a caravan'}</h1>
              <p className="muted">{code ? 'Check the letters with your squad leader, or start your own caravan.' : 'Enter the code from your squad leader.'}</p>
              <form action="/caravan/join" method="get" className="row" style={{ gap: 10, justifyContent: 'center' }}>
                <input name="code" maxLength={12} defaultValue={code} autoCapitalize="characters" autoComplete="off" placeholder="ABC234" aria-label="Caravan code" style={{ maxWidth: 180, textTransform: 'uppercase', letterSpacing: '0.12em' }} />
                <button type="submit" className="btn primary">Find</button>
              </form>
            </>
          ) : (
            <>
              <span className="label">{displayName(caravan.leader)} invited you</span>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)' }}>{caravan.name}</h1>
              <p className="muted">{caravan._count.members} of {MAX_MEMBERS} aboard. Check in at houses together for squad bonus XP, and your scorecards add up to a Squad Review.</p>
              {user ? (
                <form action={joinCaravan.bind(null, code)}>
                  <SubmitButton pendingText="Joining…" className="btn primary">Join the caravan</SubmitButton>
                </form>
              ) : (
                <div className="stack" style={{ gap: 8, justifyItems: 'center' }}>
                  <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn primary">Log in to join</Link>
                  <span className="small muted">New to Porchlight? <Link href="/join/viewer" data-modal="join:viewer">Sign up free</Link>, then open the invite again.</span>
                </div>
              )}
            </>
          )}
      </section>
    </main>
  );
}
