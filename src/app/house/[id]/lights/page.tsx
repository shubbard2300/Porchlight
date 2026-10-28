import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { LIGHT_COOLDOWN_S, lightPayload } from '@/lib/porchLights';
import { Icon3D } from '@/components/Icon3D';
import { LightsForm } from './LightsForm';

export const metadata: Metadata = { title: 'Porch light triggers · Porchlight' };

const when = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });

/** The host's smart-light setup: a webhook Porchlight calls so their lights greet visitors. */
export default async function LightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/house/${id}/lights`);
  const house = await db.house.findUnique({ where: { id }, select: { id: true, name: true, ownerId: true, porchTrigger: true } });
  if (!house || house.ownerId !== user.id) notFound();
  const t = house.porchTrigger;
  const sample = JSON.stringify(lightPayload('checkin', house.name, 'Maya', new Date('2026-10-31T19:30:00Z')), null, 2);

  return (
    <main className="wrap stack" style={{ gap: 20, maxWidth: 760 }}>
      <Link href={`/house/${id}/stats`} className="small">← {house.name}</Link>
      <header className="row" style={{ gap: 16, alignItems: 'center' }}>
        <Icon3D name="bulb" size={64} />
        <div className="stack" style={{ gap: 4 }}>
          <h1 style={{ fontSize: 30 }}>Porch light triggers</h1>
          <p className="muted">Make your Hue, Twinkly, WLED or LIFX lights flash when a visitor checks in, likes your house or catches your critter.</p>
        </div>
      </header>

      <section className="panel stack" aria-labelledby="hook">
        <div className="row spread">
          <h2 id="hook" style={{ fontSize: 20 }}>Your lights</h2>
          {t && <span className={`pill ${t.enabled ? 'live' : 'final'}`}>{t.enabled ? 'Connected' : 'Paused'}</span>}
        </div>
        <LightsForm houseId={id} saved={t && { url: t.url, enabled: t.enabled, onCheckIn: t.onCheckIn, onLike: t.onLike, onCatch: t.onCatch }} />
        {t && (
          <div className="stack small" style={{ gap: 6 }}>
            <span>Last visitor flash: {t.lastFiredAt ? when(t.lastFiredAt) : 'not yet'}{t.lastStatus && <> · Last result: <b>{t.lastStatus}</b></>}</span>
            <span className="muted">Signing secret: <code>{t.secret}</code> (only needed if your receiver checks the <code>X-Porchlight-Signature</code> header)</span>
          </div>
        )}
        <p className="small muted">To keep a busy night from turning into a strobe, your lights flash at most once every {LIGHT_COOLDOWN_S} seconds. Only your house name, the visitor’s display name and the event are sent.</p>
      </section>

      <section className="panel stack" aria-labelledby="setup">
        <h2 id="setup" style={{ fontSize: 20 }}>Set it up in five minutes</h2>
        <details open>
          <summary><b>IFTTT</b> · easiest, works with Philips Hue, LIFX, Govee, Nanoleaf</summary>
          <ol className="stack small" style={{ gap: 6, marginTop: 8 }}>
            <li>In IFTTT, create an applet. For <b>If This</b>, choose <b>Webhooks → Receive a web request</b> and name the event <code>porch_flash</code>.</li>
            <li>For <b>Then That</b>, choose your lights, for example <b>Philips Hue → Blink lights</b> or <b>Change color</b>.</li>
            <li>Open <a href="https://ifttt.com/maker_webhooks/settings" target="_blank" rel="noreferrer">Webhooks settings</a> and copy your key.</li>
            <li>Paste <code>https://maker.ifttt.com/trigger/porch_flash/with/key/YOUR_KEY</code> above. IFTTT gets the event, house and visitor as Value1, Value2 and Value3.</li>
          </ol>
        </details>
        <details>
          <summary><b>Home Assistant</b> · Hue, Twinkly, WLED and anything else it runs</summary>
          <ol className="stack small" style={{ gap: 6, marginTop: 8 }}>
            <li>Create an automation with a <b>Webhook</b> trigger. Untick <b>Only accessible from the local network</b> and allow <b>POST</b>.</li>
            <li>Add actions, for example <b>Light: turn on</b> with a flash, or a Twinkly or WLED effect. Use <code>{'{{ trigger.json.event }}'}</code> to pick a different effect per event.</li>
            <li>Paste your public webhook link above, such as <code>https://YOUR-ID.ui.nabu.casa/api/webhook/porch_flash</code> from Home Assistant Cloud. Porchlight can’t reach addresses on your home network.</li>
          </ol>
        </details>
        <details>
          <summary><b>Zapier, Make or your own code</b></summary>
          <p className="small" style={{ marginTop: 8 }}>Use a <b>Catch Hook</b> trigger and paste its link above. Each call is a JSON POST like this, with the event also in <code>X-Porchlight-Event</code> and an HMAC-SHA256 of the body (keyed with your secret) in <code>X-Porchlight-Signature</code>:</p>
          <pre className="code small">{sample}</pre>
        </details>
      </section>
    </main>
  );
}
