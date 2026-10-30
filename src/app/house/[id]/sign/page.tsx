import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { porchUrl } from '@/lib/porchCode';
import { getSeason } from '@/lib/seasons';
import { seasonTheme } from '@/lib/theme';
import { Icon3D } from '@/components/Icon3D';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { PrintButton } from './PrintButton';
import styles from './sign.module.css';
import { isStaff } from '@/lib/roles';

export const metadata: Metadata = { title: 'Porch sign · Porchlight' };

/** A printable sign for the host's porch. Its QR code checks visitors in, so only the host and admins can see it. */
export default async function PorchSign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/house/${id}/sign`);
  const house = await db.house.findUnique({ where: { id }, select: { id: true, name: true, ownerId: true, season: true, status: true } });
  if (!house || (house.ownerId !== user.id && !isStaff(user.role))) notFound();

  const url = porchUrl(house.id);
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#14123a', light: '#ffffff' } });
  const season = getSeason(house.season);
  const theme = season ? seasonTheme(season) : null;

  return (
    <main className="wrap stack" style={{ gap: 22 }}>
      <div className={`row spread ${styles.noPrint}`}>
        <Link href="/profile" className="small">← Back to my profile</Link>
        <PrintButton />
      </div>
      {house.status !== 'APPROVED' && <p className={`notice warn ${styles.noPrint}`}>Your house is still in review. The sign works as soon as it&rsquo;s approved.</p>}
      <p className={`muted small ${styles.noPrint}`}>Print this and tape it somewhere visitors can reach safely, like a porch post or window. Anyone who scans it is checked in and can score your display. Keep it to yourself until you put it out, since the code is the same all season.</p>

      <article className={styles.sign} aria-label="Porch sign">
        <div className={styles.brand}><LogoMark size={46} /><Wordmark /></div>
        <h1 className={styles.headline}>Scan to vote for<br /><span>{house.name}</span></h1>
        <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />
        <ol className={styles.steps}>
          <li><Icon3D name="camera" size={30} />Point your phone camera at the code</li>
          <li><Icon3D name="check" size={30} />You&rsquo;re checked in</li>
          <li><Icon3D name="heart" size={30} />Score the lights and leave a cheer</li>
        </ol>
        <p className={styles.foot}>
          {theme && <Icon3D name={theme.icon} size={26} />}
          {season ? `${season.name} ${season.year} contest` : 'Porchlight contest'} · porchlightcontest.com
        </p>
      </article>
    </main>
  );
}
