import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { contestToday, getSeason, openForSubmissions, phase, phaseLabel, visibleSeasons } from '@/lib/seasons';
import { photoSelect } from '@/lib/housePhotos';
import { HousePhotoPicker } from '@/components/HousePhotoPicker';
import { avatarUrl, displayName, level } from '@/lib/users';
import { becomeHost } from '../actions/profile';
import { AvatarUploader } from './AvatarUploader';
import { DeleteEntryButton } from './DeleteEntryButton';
import { AboutForm, HostForm, PasswordForm } from './ProfileForms';

export const metadata = { title: 'My profile · Porchlight' };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string; submitted?: string; host?: string }> }) {
  const user = await requireUser('/profile');
  const { welcome, submitted, host: becameHost } = await searchParams;
  const isHost = user.accountType === 'HOST';
  const today = contestToday();
  const lvl = level(user.xp);
  const houses = isHost ? await db.house.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' }, include: { photos: { select: photoSelect, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] } } }) : [];
  const withSeason = houses.map((h) => ({ h, s: getSeason(h.season) }));
  const active = withSeason.filter(({ s }) => s && phase(s, today) !== 'expired');
  const archived = withSeason.filter(({ s }) => !s || phase(s, today) === 'expired');
  const seasonOptions = [...new Set([...visibleSeasons(today), ...openForSubmissions(today)])].filter((s) => phase(s, today) !== 'final');
  const hostSeason = getSeason(user.hostSeason);
  const canEnter = hostSeason && openForSubmissions(today).includes(hostSeason) && !houses.some((h) => h.season === hostSeason.key && h.status !== 'REJECTED');

  return (
    <main className="wrap stack" style={{ maxWidth: 780, gap: 22 }}>
      {welcome && (
        <p className="notice">
          Your email is confirmed. Welcome to Porchlight, {user.username}! Your 100 XP signup bonus is in.{' '}
          {isHost ? 'Add your property and this season’s decorations below.' : 'Add a photo and a few details so neighbors know who’s rating.'}
        </p>
      )}
      {becameHost && <p className="notice">You&apos;re a host now. Add your property details below.</p>}
      {submitted && <p className="notice">Thanks! Your house is in review. We&apos;ll email you when it&apos;s live.</p>}

      <section className="panel stack">
        <div className="profile-head">
          <div className="stack" style={{ gap: 6 }}>
            <div className="row"><span className={`pill ${isHost ? 'PENDING' : 'live'}`}>{isHost ? 'Host / decorator' : 'Viewer / rater'}</span><span className="label">Level {lvl.number} · {lvl.name}</span></div>
            <h1 style={{ fontSize: 32 }}>{displayName(user)}</h1>
            <span className="small muted">@{user.username} · {user.email}</span>
            <div className="xpbar" aria-label={`${user.xp} XP`}><i style={{ width: `${lvl.next ? Math.min(100, (user.xp / lvl.next[0]) * 100) : 100}%` }} /></div>
            <span className="small muted num row" style={{ gap: 6 }}><Icon3D name="sparkles" size={20} />{user.xp} XP{lvl.next ? ` · ${lvl.next[0] - user.xp} to ${lvl.next[1]}` : ''}</span>
          </div>
        </div>
        <AvatarUploader src={avatarUrl(user)} initial={user.username[0].toUpperCase()} />
      </section>

      <section className="panel stack">
        <h2 style={{ fontSize: 20 }}>About you</h2>
        <p className="small muted">Only your username is required.</p>
        <AboutForm p={{ username: user.username, displayName: user.displayName ?? '', hometown: user.hometown ?? '', bio: user.bio ?? '', marketingOptIn: user.marketingOptIn }} />
      </section>

      {isHost ? (
        <section className="panel stack" id="property">
          <div className="row spread">
            <h2 style={{ fontSize: 20 }}>Your property and decorations</h2>
            {canEnter && <Link href="/submit" className="btn primary sm">Enter the {hostSeason!.name} contest</Link>}
          </div>
          <p className="small muted">This fills in your contest entry, so you only type it once.</p>
          <HostForm
            seasons={seasonOptions.map((s) => ({ key: s.key, label: `${s.name} ${s.year}` }))}
            h={{ propertyAddress: user.propertyAddress ?? '', neighborhood: user.neighborhood ?? '', hostSeason: user.hostSeason ?? '', decorationTheme: user.decorationTheme ?? '', propertyDetails: user.propertyDetails ?? '' }}
          />
        </section>
      ) : (
        <section className="panel row spread">
          <div className="stack" style={{ gap: 4 }}>
            <h2 style={{ fontSize: 20 }}>Decorate your house too?</h2>
            <p className="small muted">Become a host to put your display on the map and compete for the pot.</p>
          </div>
          <form action={becomeHost}><button className="btn ghost">Become a host</button></form>
        </section>
      )}

      <section className="panel stack" id="password">
        <h2 style={{ fontSize: 20 }}>Password</h2>
        <p className="small muted">{user.passwordHash ? 'Change the password you log in with.' : 'You signed in with an email link. Set a password to log in with it next time.'}</p>
        <PasswordForm hasPassword={Boolean(user.passwordHash)} />
      </section>

      <section className="stats">
        <div className="stat"><span className="label">Invite code</span><b className="num" style={{ fontSize: 20, fontFamily: 'var(--font-mono)' }}>{user.referralCode}</b><span className="small muted">You both get XP after their first verified visit</span></div>
        {isHost && <div className="stat"><span className="label">Houses entered</span><b className="num">{houses.length}</b></div>}
      </section>

      {isHost && (
        <>
          <section className="stack">
            <h2 style={{ fontSize: 20 }}>My contest entries</h2>
            {active.length === 0 ? <p className="muted small">No entries for the current contests yet.</p> : active.map(({ h, s }) => (
              <div key={h.id} className="panel stack">
                <div className="row spread">
                  <div><b>{h.name}</b><div className="small muted">{s!.name} {s!.year} · {phaseLabel(s!, today).tag}</div>{h.reviewNote && <div className="small muted">Note: {h.reviewNote}</div>}</div>
                  <span className={`pill ${h.status}`}>{h.status === 'PENDING' ? 'In review' : h.status === 'APPROVED' ? 'Live' : 'Not approved'}</span>
                </div>
                <HousePhotoPicker houseId={h.id} initial={h.photos} />
                <div className="row spread">
                  <div className="row">
                    <Link href={`/house/${h.id}/sign`} className="btn sm primary">Print porch QR sign</Link>
                    {h.status === 'APPROVED' && <Link href={`/house/${h.id}`} className="btn sm ghost">View house page</Link>}
                  </div>
                  <DeleteEntryButton id={h.id} name={h.name} />
                </div>
              </div>
            ))}
          </section>
          <section className="stack">
            <h2 style={{ fontSize: 20 }}>Archive</h2>
            <p className="small muted">Contests leave the public map one week after the holiday. Your past entries stay here.</p>
            {archived.length === 0 ? <p className="muted small">No past contests yet.</p> : archived.map(({ h, s }) => (
              <div key={h.id} className="panel row spread">
                <div><b>{h.name}</b><div className="small muted">{s ? `${s.name} ${s.year}` : h.season}</div></div>
                <div className="row"><span className="pill">Archived</span><DeleteEntryButton id={h.id} name={h.name} /></div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
