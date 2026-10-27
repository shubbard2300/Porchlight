// TEMPORARY: reports which Blob settings this deployment can see and tries a tiny write. Remove before merge.
import { del, put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const storeId = process.env.BLOB_STORE_ID || process.env.PORCH_STORE_ID || undefined;
  let write: string;
  try {
    const b = await put('healthcheck/ok.txt', 'ok', { access: 'public', addRandomSuffix: true, storeId });
    await del(b.url, { storeId });
    write = 'ok';
  } catch (err) {
    write = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }
  return Response.json({
    env: process.env.VERCEL_ENV ?? null,
    storeId: Boolean(storeId),
    oidc_header: req.headers.has('x-vercel-oidc-token'),
    write,
  });
}
