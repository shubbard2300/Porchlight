import Script from 'next/script';
import { gaInitScript } from '@/lib/analytics';

/** Google Analytics 4. Rendered once in the root layout, and only when gaMeasurementId() returns an ID. */
export function Analytics({ id }: { id: string }) {
  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">{gaInitScript(id)}</Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
    </>
  );
}
