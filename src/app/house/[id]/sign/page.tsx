import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { porchUrl } from '@/lib/porchCode';
import { seasonCalendar } from '@/lib/seasonConfig';
import { seasonTheme } from '@/lib/theme';
import { Icon3D } from '@/components/Icon3D';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { PrintButton } from './PrintButton';
import styles from './porchSign.module.css';
import { isStaff } from '@/lib/roles';

export const metadata: Metadata = { title: 'Porch sign · Porchlight' };

/**
 * A printable US Letter sign for the host's porch, dressed in the holiday their house is entered for.
 * Its QR code checks visitors in, so only the host and staff can see it.
 */
export default async function PorchSign({ params }: { params: Promise<{ id: string }> }) {
  const { getSeason } = await seasonCalendar();
  const { id } = await params;
  const user = await requireUser(`/house/${id}/sign`);
  const house = await db.house.findUnique({ where: { id }, select: { id: true, name: true, ownerId: true, season: true, status: true } });
  if (!house || (house.ownerId !== user.id && !isStaff(user.role))) notFound();

  // No margin in the code itself: the white tile around it is the quiet zone.
  const svg = await QRCode.toString(porchUrl(house.id), { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#14123a', light: '#ffffff' } });
  const season = getSeason(house.season);
  const theme = season ? seasonTheme(season) : null;
  const colors = { '--sign-a': theme?.roof ?? '#ffb000', '--sign-b': theme?.wall ?? '#6b3fd6', '--sign-b-dark': theme?.wallDark ?? '#34247a' } as CSSProperties;

  return (
    <main className={`wrap stack ${styles.page}`} style={{ gap: 18 }} data-season={theme?.look ?? 'default'}>
      <div className={`stack ${styles.noPrint}`} style={{ gap: 12 }}>
        <div className="row spread">
          <Link href={`/profile#submission-${house.id}`} className="small">← Back to my house</Link>
          <PrintButton />
        </div>
        {house.status !== 'APPROVED' && <p className="notice warn" style={{ margin: 0 }}>Your house is still in review. The sign works as soon as it&rsquo;s approved, so you can print it now.</p>}
        <p className="muted small" style={{ margin: 0 }}>
          Sized for a standard 8.5&Prime; × 11&Prime; sheet. Tape it at eye level somewhere visitors can reach safely, like a porch post or a front window.
          Anyone who scans it is checked in and can score your display, so keep it to yourself until it goes up. If the colors are missing, turn on <b>Background graphics</b> in the print dialog.
        </p>
      </div>

      <div className={styles.stage}>
        <article className={styles.sheet} style={colors} aria-label="Porch sign preview">
          <div className={styles.frame}>
            <header className={styles.band}>
              <span className={styles.brand}><LogoMark size={64} /><Wordmark /></span>
              <span className={styles.season}>
                {theme && <Icon3D name={theme.icon} size={44} />}
                {season ? <>{season.name}<small>{season.year} contest</small></> : <>Holiday<small>lights contest</small></>}
              </span>
            </header>

            <div className={styles.head}>
              {theme && <Icon3D name={theme.icon} size={96} className={styles.flank} />}
              <div>
                <h1 className={styles.scan}>Scan to vote!</h1>
                <p className={styles.name}>{house.name}</p>
              </div>
              {theme && <Icon3D name={theme.sidekick} size={96} className={styles.flank} />}
            </div>

            <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />

            <ol className={styles.steps}>
              <li><Icon3D name="camera" size={44} /><span><b>1</b>Open your phone camera</span></li>
              <li><Icon3D name="check" size={44} /><span><b>2</b>Tap the link to check in</span></li>
              <li><Icon3D name="heart" size={44} /><span><b>3</b>Score the lights &amp; cheer</span></li>
            </ol>

            <p className={styles.foot}>Find more lit-up houses near you at <b>porchlightcontest.com</b></p>
          </div>
        </article>
      </div>
    </main>
  );
}
