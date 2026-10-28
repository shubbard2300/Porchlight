'use client';

import { useState } from 'react';

/** Shares the invite with the phone's share sheet, or copies it where that isn't available. */
export function ShareInvite({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) return await navigator.share({ title: `Join ${name} on Porchlight`, url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The person closed the share sheet.
    }
  };
  return <button type="button" className="btn primary" onClick={share}>{copied ? 'Link copied!' : 'Share invite link'}</button>;
}
