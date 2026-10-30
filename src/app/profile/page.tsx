import Link from 'next/link';
import { Icon3D } from '@/components/Icon3D';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { contestToday, getSeason, openForSubmissions, phase, phaseLabel, visibleSeasons } from '@/lib/seasons';
import { photoSelect } from '@/lib/housePhotos';
import { HousePhotoPicker } from '@/components/HousePhotoPicker';
import { BracketPicker } from './BracketPicker';
import { avatarUrl, displayName, level } from '@/lib/users';
import { becomeHost } from '../actions/profile';
import { XpGuide, XpProgress, XpSummary } from '@/components/XpGuide';
import { AvatarUploader } from './AvatarUploader';
import { RemoveSubmissionButton } from './RemoveSubmissionButton';
import { AboutForm, HostForm, HouseDetailsForm, PasswordForm } from './ProfileForms';
import { OpenOnHash } from './OpenOnHash';
import { ALERT_KINDS } from '@/lib/alerts';
import { PotPanel } from './PotPanel';
import { AlertSettings } from './AlertSettings';
import { vapidPublicKey } from '@/lib/push';
import { stripeConfigured } from '@/lib/stripe';

export const metadata = { title: 'My profile · Porchlight' };

const PAY_NOTES: Record<string, string> = {
  cancelled: 'Payment cancelled. Nothing was charged, and your submission is still in.',
  error: 'We couldn’t reach our payment processor. Nothing was charged. Please try again in a minute.',
  closed: 'That pot is closed: payments open once a house is approved and close when voting ends.',
  off: 'Online payments aren’t switched on yet.',
  amount: 'Pick an amount to add to the pot.',
  missing: 'We couldn’t find that submission.',
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string; submitted?: string; host?: string; pay?: string }> }) {
  const user = await requireUser('/profile');
  const { welcome, submitted, host: becameHost, pay } = await searchParams;
  const isHost = user.accountType === 'HOST';
  const today = contestToday();
  const lvl = level(user.xp);
  const houses = isHost ? await db.house.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' }, include: { photos: { select: photoSelect, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] }, potPayments: { where: { status: 'PAID', source: 'HOST' }, select: { amountCents: true, paidAt: true } } } }) : [];
  const withSeason = houses.map((h) => ({ h, s: getSeason(h.season) }));
  const active = withSeason.filter(({ s }) => s && phase(s, today) !== 'expired');
  const archived = withSeason.filter(({ s }) => !s || phase(s, today) === 'expired');
  const seasonOptions = [...new Set([...visibleSeasons(today), ...openForSubmissions(today)])].filter((s) => phase(s, today) !== 'final');
  const hostSeason = getSeason(user.hostSeason);
  const alertsOn = ALERT_KINDS.filter((k) => user[k.key]).length;
  const canEnter = hostSeason && openForSubmissions(today).includes(hostSeason) && !houses.some((h) => h.season === hostSeason.key && h.status !== 'REJECTED');

  return (
    <main className="wrap stack" style={{ maxWidth: 780, gap: 22 }}>
      <OpenOnHash />
      {welcome && (
        <p className="notice">
          Your email is confirmed. Welcome to Porchlight, {user.username}! Your 100 XP signup bonus is in.{' '}
          {isHost ? 'Add a photo of your house below to put it on the map.' : 'Add a photo and a few details so neighbors know who’s rating.'}
        </p>
      )}
      {becameHost && <p className="notice">You&apos;re a host now. Add your property below.</p>}
      {submitted && <p className="notice">Thanks! Your house is in review. We&apos;ll email you when it&apos;s live.</p>}
      {pay && PAY_NOTES[pay] && <p className="notice warn" role="alert">{PAY_NOTES[pay]}</p>}

      <section className="panel stack" style={{ gap: 18 }}>
        <div className="profile-top">
          <div className="profile-head">
            <div className="stack" style={{ gap: 6 }}>
              <div className="row"><span className={`pill ${isHost ? 'PENDING' : 'live'}`}>{isHost ? 'Host / decorator' : 'Viewer / rater'}</span><span className="label">Level {lvl.number} · {lvl.name}</span></div>
              <h1 style={{ fontSize: 32 }}>{displayName(user)}</h1>
              <span className="small muted">@{user.username} · {user.email}</span>
              <XpProgress xp={user.xp} />
            </div>
          </div>
          <AvatarUploader src={avatarUrl(user)} initial={user.username[0].toUpperCase()} />
        </div>

        <div className="acc-group">
          <details className="acc" id="about-xp">
            <summary>
              <Icon3D name="sparkles" size={30} />
              <span className="acc-title"><b>About XP</b><XpSummary xp={user.xp} /></span>
            </summary>
            <div className="acc-body"><XpGuide me={{ xp: user.xp, boostUntil: user.xpBoostUntil }} showProgress={false} /></div>
          </details>
          <details className="acc" id="about-you">
            <summary>
              <Icon3D name="person" size={30} />
              <span className="acc-title"><b>About you</b><span className="small muted">Username, display name, hometown and bio</span></span>
            </summary>
            <div className="acc-body">
              <AboutForm p={{ username: user.username, displayName: user.displayName ?? '', hometown: user.hometown ?? '', bio: user.bio ?? '', marketingOptIn: user.marketingOptIn }} />
            </div>
          </details>
          <details className="acc" id="password">
            <summary>
              <Icon3D name="key" size={30} />
              <span className="acc-title"><b>Password</b><span className="small muted">{user.passwordHash ? 'Change the password you log in with' : 'Set one so you can log in without an email link'}</span></span>
            </summary>
            <div className="acc-body"><PasswordForm hasPassword={Boolean(user.passwordHash)} /></div>
          </details>
          <details className="acc" id="alerts">
            <summary>
              <Icon3D name="bulb" size={30} />
              <span className="acc-title"><b>Alerts</b><span className="small muted">{alertsOn === 0 ? 'All alerts are off' : `${alertsOn} of ${ALERT_KINDS.length} alerts on`}</span></span>
            </summary>
            <div className="acc-body">
              <AlertSettings
                vapidKey={vapidPublicKey()}
                initial={{ alertNearby: user.alertNearby, alertHost: user.alertHost, alertSquad: user.alertSquad, alertLastCall: user.alertLastCall }}
                hasSpot={user.alertLat !== null}
                radiusKm={user.alertRadiusKm}
                devices={await db.pushSubscription.count({ where: { userId: user.id } })}
              />
            </div>
          </details>
        </div>
      </section>

      {isHost ? (
        <section className="panel stack" id="property" style={{ gap: 18, scrollMarginTop: 16 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><Icon3D name="house" size={34} /><h2 style={{ fontSize: 22 }}>Your property and decorations</h2></div>

          {active.length === 0 && (
            <div className="property-empty">
              <Icon3D name="camera" size={44} />
              <div className="stack" style={{ gap: 4 }}>
                <b>Put your house on the map</b>
                <span className="small muted">{canEnter ? `Snap a photo of your display and post it for ${hostSeason!.name}. It takes about a minute.` : 'Snap a photo of your display and post it for the next holiday. It takes about a minute.'}</span>
              </div>
              <Link href="/submit" className="btn primary">{canEnter ? `Post my house for ${hostSeason!.name}` : 'Post my house'}</Link>
            </div>
          )}

          {active.map(({ h, s }) => (
            <div key={h.id} id={`submission-${h.id}`} className="submission stack" style={{ scrollMarginTop: 16 }}>
              <div className="row spread">
                <div><b style={{ fontSize: 18 }}>{h.name}</b><div className="small muted">{s!.name} {s!.year} · {phaseLabel(s!, today).tag}</div>{h.reviewNote && <div className="small muted">Note: {h.reviewNote}</div>}</div>
                <span className={`pill ${h.status}`}>{h.status === 'PENDING' ? 'In review' : h.status === 'APPROVED' ? 'Live' : 'Not approved'}</span>
              </div>

              <div className="stack" style={{ gap: 6 }}>
                <h3 className="xp-sub">Photos of your house</h3>
                <p className="small muted" style={{ margin: 0 }}>Add detail shots too: the porch, the yard, a close-up of your favorite piece. The first photo is your cover.</p>
                <HousePhotoPicker houseId={h.id} initial={h.photos} />
              </div>

              <div className="row">
                {h.status === 'APPROVED' && <Link href={`/house/${h.id}`} className="btn sm ghost">View house page</Link>}
                <Link href={`/house/${h.id}/sign`} className="btn sm ghost">Print porch QR sign</Link>
                {h.status === 'APPROVED' && <Link href={`/house/${h.id}/stats`} className="btn sm ghost">My flex stats</Link>}
                {h.status === 'APPROVED' && <Link href={`/house/${h.id}/lights`} className="btn sm ghost">Porch lights</Link>}
              </div>

              <div className="acc-group">
                <details className="acc" id={`details-${h.id}`}>
                  <summary>
                    <Icon3D name="pin" size={28} />
                    <span className="acc-title"><b>Address and details</b><span className="small muted">{h.address}</span></span>
                  </summary>
                  <div className="acc-body">
                    <HouseDetailsForm id={h.id} live={h.status === 'APPROVED'} h={{ name: h.name, address: h.address, neighborhood: h.neighborhood ?? '', showExactAddress: h.showExactAddress, litFrom: h.litFrom, litUntil: h.litUntil, description: h.description }} />
                  </div>
                </details>
                {phase(s!, today) !== 'final' && (
                  <details className="acc">
                    <summary>
                      <Icon3D name="trophy" size={28} />
                      <span className="acc-title"><b>Bracket</b><span className="small muted">{h.bracket ? 'Which category your house competes in' : 'Pick a category for the leaderboard'}</span></span>
                    </summary>
                    <div className="acc-body"><BracketPicker houseId={h.id} holiday={s!.name} initial={h.bracket} /></div>
                  </details>
                )}
                <details className="acc" id={`pot-${h.id}`}>
                  <summary>
                    <Icon3D name="money" size={28} />
                    <span className="acc-title"><b>Community pot</b><span className="small muted">{h.potPayments[0] ? 'Your pledge is paid. Thank you!' : h.contributionCents > 0 ? `$${h.contributionCents / 100} pledged` : 'Optional. Free submissions compete too'}</span></span>
                  </summary>
                  <div className="acc-body"><PotPanel houseId={h.id} status={h.status} phase={phase(s!, today)} pledgeCents={h.contributionCents} paid={h.potPayments[0] ?? null} online={stripeConfigured()} /></div>
                </details>
              </div>

              <div className="remove-row">
                <span className="small muted">Changed your mind? You can take your house off Porchlight any time.</span>
                <RemoveSubmissionButton id={h.id} name={h.name} />
              </div>
            </div>
          ))}

          <details className="acc" id="property-defaults" open={!user.propertyAddress}>
            <summary>
              <Icon3D name="clipboard" size={28} />
              <span className="acc-title"><b>{active.length ? 'Moving, or decorating a different house?' : 'Your property info'}</b><span className="small muted">Saved here to fill in your next submission, so you only type it once</span></span>
            </summary>
            <div className="acc-body">
              <HostForm
                seasons={seasonOptions.map((s) => ({ key: s.key, label: `${s.name} ${s.year}` }))}
                h={{ propertyAddress: user.propertyAddress ?? '', neighborhood: user.neighborhood ?? '', hostSeason: user.hostSeason ?? '', decorationTheme: user.decorationTheme ?? '', propertyDetails: user.propertyDetails ?? '' }}
              />
            </div>
          </details>
        </section>
      ) : (
        <section className="panel row spread">
          <div className="stack" style={{ gap: 4 }}>
            <h2 style={{ fontSize: 20 }}>Decorate your house too?</h2>
            <p className="small muted">Become a host to put your display on the map and share it with the neighborhood.</p>
          </div>
          <form action={becomeHost}><button className="btn ghost">Become a host</button></form>
        </section>
      )}

      <section className="stats">
        <div className="stat"><span className="label">Invite code</span><b className="num" style={{ fontSize: 20, fontFamily: 'var(--font-mono)' }}>{user.referralCode}</b><span className="small muted">You both get XP after their first verified visit</span></div>
        <div className="stat"><span className="label">Critters caught</span><b className="num">{await db.arCatch.count({ where: { userId: user.id } })}</b><Link className="small" href="/hunt">My collection</Link></div>
        {isHost && <div className="stat"><span className="label">Houses shared</span><b className="num">{houses.length}</b></div>}
      </section>

      {isHost && archived.length > 0 && (
        <section className="stack">
          <h2 style={{ fontSize: 20 }}>Past submissions</h2>
          <p className="small muted">Houses leave the public map one week after the holiday. Your past submissions stay here.</p>
          {archived.map(({ h, s }) => (
            <div key={h.id} className="panel row spread">
              <div><b>{h.name}</b><div className="small muted">{s ? `${s.name} ${s.year}` : h.season}</div></div>
              <div className="row"><span className="pill">Archived</span><RemoveSubmissionButton id={h.id} name={h.name} /></div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
