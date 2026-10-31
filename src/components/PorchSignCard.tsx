import Link from 'next/link';
import QRCode from 'qrcode';
import { porchUrl } from '@/lib/porchCode';

/** The host's way in to their printable porch sign: a live preview of their QR code and one big button. */
export async function PorchSignCard({ houseId, approved }: { houseId: string; approved: boolean }) {
  const svg = await QRCode.toString(porchUrl(houseId), { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#14123a', light: '#ffffff' } });
  return (
    <div className="sign-card" id={`sign-${houseId}`}>
      <Link href={`/house/${houseId}/sign`} className="sign-card-qr" aria-label="Open your porch sign" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="stack" style={{ gap: 6 }}>
        <b className="sign-card-title">Your porch QR sign</b>
        <span className="small muted">
          Visitors scan it to check in and vote for your house. It prints on a regular 8.5&Prime; × 11&Prime; sheet, dressed up for your holiday.
          {!approved && ' It starts working as soon as your house is approved.'}
        </span>
        <div className="row" style={{ marginTop: 4 }}>
          <Link href={`/house/${houseId}/sign`} className="btn sm primary">View &amp; print my sign</Link>
        </div>
      </div>
    </div>
  );
}
