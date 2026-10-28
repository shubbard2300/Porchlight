import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { pitstopUrl } from '@/lib/porchCode';
import { BOOST_HOURS } from '@/lib/pitstops';
import { Icon3D } from '@/components/Icon3D';
import { LogoMark, Wordmark } from '@/components/LogoMark';
import { PrintButton } from '../../../house/[id]/sign/PrintButton';
import styles from '../../../house/[id]/sign/sign.module.css';

export const metadata: Metadata = { title: 'Pitstop sign · Porchlight' };

/** A printable counter sign for a sponsor. Admins print it and hand it over when the sponsorship starts. */
export default async function PitstopSign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const m = await db.merchant.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!m) notFound();
  const svg = await QRCode.toString(pitstopUrl(m.id), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#14123a', light: '#ffffff' } });

  return (
    <main className="wrap stack" style={{ gap: 22 }}>
      <div className={`row spread ${styles.noPrint}`}>
        <Link href={`/admin/merchants/${m.id}`} className="small">← Back to {m.name}</Link>
        <PrintButton />
      </div>
      <p className={`muted small ${styles.noPrint}`}>Print this for the counter or front window. Scanning is free and needs no purchase.</p>
      <article className={styles.sign} aria-label="Pitstop sign">
        <div className={styles.brand}><LogoMark size={46} /><Wordmark /></div>
        <h1 className={styles.headline}>Official Porchlight pitstop<br /><span>{m.name}</span></h1>
        <div className={styles.qr} dangerouslySetInnerHTML={{ __html: svg }} />
        <ol className={styles.steps}>
          <li><Icon3D name="camera" size={30} />Scan with your phone camera</li>
          <li><Icon3D name="sparkles" size={30} />Double XP for {BOOST_HOURS} hours</li>
          <li><Icon3D name="house" size={30} />Head back out and check in at houses</li>
        </ol>
        <p className={styles.foot}>No purchase necessary · Contest votes are not affected · porchlightcontest.com</p>
      </article>
    </main>
  );
}
