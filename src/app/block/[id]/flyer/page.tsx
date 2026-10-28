import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { appUrl } from '@/lib/email';
import { Icon3D } from '@/components/Icon3D';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { PrintButton } from '../../../house/[id]/sign/PrintButton';
import styles from '../../../house/[id]/sign/sign.module.css';

export const metadata: Metadata = { title: 'Block flyer · Porchlight' };

/** A printable flyer that invites neighbors on an anchor block to post their houses. */
export default async function BlockFlyer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const b = await db.anchorBlock.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!b) notFound();
  const svg = await QRCode.toString(appUrl(`/block/${b.id}`), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#14123a', light: '#ffffff' } });

  return (
    <main className="wrap stack" style={{ gap: 22 }}>
      <div className={`row spread ${styles.noPrint}`}>
        <Link href={`/admin/blocks/${b.id}`} className="small">← Back to {b.name}</Link>
        <PrintButton />
      </div>
      <p className={`muted small ${styles.noPrint}`}>Hand these out on the block or post them on community boards. The code opens the block&rsquo;s page, where neighbors can post their houses.</p>
      <article className={styles.sign} aria-label="Neighbor flyer">
        <div className={styles.brand}><LogoMark size={46} /><Wordmark /></div>
        <h1 className={styles.headline}>Light up<br /><span>{b.name}</span></h1>
        <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />
        <ol className={styles.steps}>
          <li><Icon3D name="camera" size={30} />Snap your display at night and post it</li>
          <li><Icon3D name="map" size={30} />Visitors tour the block and score every porch</li>
          <li><Icon3D name="trophy" size={30} />The most-loved house wins the pot</li>
        </ol>
        <p className={styles.foot}>Free to join · porchlightcontest.com</p>
      </article>
    </main>
  );
}
