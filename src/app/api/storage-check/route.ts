// TEMPORARY: reports which Blob settings this deployment can see (booleans only). Remove before merge.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return Response.json({
    env: process.env.VERCEL_ENV ?? null,
    BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    BLOB_STORE_ID: Boolean(process.env.BLOB_STORE_ID),
    PORCH_STORE_ID: Boolean(process.env.PORCH_STORE_ID),
    VERCEL_OIDC_TOKEN_env: Boolean(process.env.VERCEL_OIDC_TOKEN),
    oidc_header: req.headers.has('x-vercel-oidc-token'),
  });
}
