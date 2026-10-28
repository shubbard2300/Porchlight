// Branded "Twilight Porch Party" email layout. Email clients ignore stylesheets, web fonts (mostly),
// SVG and box-shadow, so everything is tables with inline styles, the logo is a PNG, and the sticker
// shadow is a thicker right/bottom border.

export type EmailContent = {
  /** Inbox preview line, hidden in the body. */
  preheader: string;
  /** Small pill above the headline. */
  eyebrow?: string;
  accent?: 'amber' | 'candy' | 'lilac';
  heading: string;
  greeting?: string;
  body: string[];
  details?: [label: string, value: string][];
  quote?: { label: string; text: string };
  links?: { label: string; urls: string[] };
  button?: { label: string; url: string };
  /** Shows the button's URL under it for people whose client won't follow buttons. */
  showUrl?: boolean;
  fine?: string;
  /** Admin notifications get a different footer line. */
  audience?: 'member' | 'admin';
};

const C = {
  ink: '#14123A',
  cream: '#FFF4E4',
  paper: '#FFFCF6',
  amber: '#FFB000',
  candy: '#FF4D8D',
  lilac: '#B9A6FF',
  muted: '#5B5785',
  line: '#EADFCB',
};
const DISPLAY = "'Unbounded', 'Arial Black', 'Helvetica Neue', Arial, sans-serif";
const BODY = "'Plus Jakarta Sans', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Images must load from a public URL; previews sit behind Vercel login, so they use production. */
const assetBase = () => (process.env.APP_URL ?? 'https://www.porchlightcontest.com').replace(/\/$/, '');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lines = (s: string) => esc(s).replace(/\n/g, '<br>');

export function renderEmail(c: EmailContent, siteUrl: string): { html: string; text: string } {
  return { html: renderHtml(c, siteUrl), text: renderText(c, siteUrl) };
}

export function renderText(c: EmailContent, siteUrl: string) {
  const out: string[] = [];
  const block = (...l: string[]) => { if (l.length) out.push(l.join('\n')); };
  if (c.greeting) block(c.greeting);
  block(...c.body);
  if (c.details?.length) block(...c.details.map(([k, v]) => `${k}: ${v}`));
  if (c.quote) block(`${c.quote.label}:`, c.quote.text);
  if (c.links?.urls.length) block(`${c.links.label}:`, ...c.links.urls.map((u) => `  ${u}`));
  if (c.button) block(`${c.button.label}: ${c.button.url}`);
  if (c.fine) block(c.fine);
  block('--', `Porchlight · ${siteUrl}`);
  return out.join('\n\n');
}

function renderHtml(c: EmailContent, siteUrl: string) {
  const accent = C[c.accent ?? 'amber'];
  const p = (s: string, extra = '') => `<p style="margin:0 0 16px;font-family:${BODY};font-size:16px;line-height:1.6;color:${C.ink};${extra}">${lines(s)}</p>`;

  const eyebrow = c.eyebrow
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px"><tr><td style="background:${accent};border:2px solid ${C.ink};border-radius:999px;padding:5px 12px;font-family:${BODY};font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${C.ink}">${esc(c.eyebrow)}</td></tr></table>`
    : '';

  const details = c.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;border:2px solid ${C.ink};border-radius:14px;background:${C.cream};border-collapse:separate">${c.details
        .map(([k, v], i) => `<tr><td valign="top" style="padding:10px 14px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${BODY};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};width:36%">${esc(k)}</td><td valign="top" style="padding:10px 14px;${i ? `border-top:1px solid ${C.line};` : ''}font-family:${BODY};font-size:15px;line-height:1.45;color:${C.ink};font-weight:600">${lines(v)}</td></tr>`)
        .join('')}</table>`
    : '';

  const quote = c.quote
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px"><tr><td style="background:${C.cream};border-left:5px solid ${C.candy};border-radius:4px 14px 14px 4px;padding:14px 16px"><div style="font-family:${BODY};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};margin:0 0 6px">${esc(c.quote.label)}</div><div style="font-family:${BODY};font-size:16px;line-height:1.6;color:${C.ink}">${lines(c.quote.text)}</div></td></tr></table>`
    : '';

  const links = c.links?.urls.length
    ? `<div style="font-family:${BODY};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};margin:0 0 6px">${esc(c.links.label)}</div><p style="margin:0 0 20px;font-family:${BODY};font-size:15px;line-height:1.6;color:${C.ink};font-weight:600">${c.links.urls
        .map((u, i) => `<a href="${esc(u)}" style="color:${C.ink};text-decoration:underline;text-decoration-color:${C.amber}">Photo ${i + 1}</a>`)
        .join(' &nbsp;·&nbsp; ')}</p>`
    : '';

  const button = c.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 ${c.showUrl ? '12px' : '22px'}"><tr><td align="center" bgcolor="${C.amber}" style="background:${C.amber};border:2px solid ${C.ink};border-right-width:5px;border-bottom-width:5px;border-radius:14px"><a href="${esc(c.button.url)}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:${DISPLAY};font-size:15px;font-weight:800;letter-spacing:-0.01em;color:${C.ink};text-decoration:none;border-radius:12px">${esc(c.button.label)}&nbsp;&rarr;</a></td></tr></table>${
        c.showUrl
          ? `<p style="margin:0 0 22px;font-family:${BODY};font-size:13px;line-height:1.5;color:${C.muted}">Button not working? Paste this into your browser:<br><a href="${esc(c.button.url)}" style="color:${C.ink};word-break:break-all">${esc(c.button.url)}</a></p>`
          : ''
      }`
    : '';

  const fine = c.fine ? `<p style="margin:0;padding-top:16px;border-top:1px dashed ${C.line};font-family:${BODY};font-size:13px;line-height:1.55;color:${C.muted}">${lines(c.fine)}</p>` : '';
  const footer = c.audience === 'admin' ? 'Admin notification from your Porchlight site.' : 'The neighborhood holiday decoration contest.';
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(c.heading)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@800&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap">
<style>
  @media (max-width: 600px) { .pl-card { padding: 26px 20px !important; } .pl-h1 { font-size: 23px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.cream}">${esc(c.preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream}">
<tr><td align="center" style="padding:28px 12px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td bgcolor="${C.ink}" style="background:${C.ink};border:2px solid ${C.ink};border-bottom:4px solid ${C.amber};border-radius:20px 20px 0 0;padding:20px 24px">
<a href="${esc(siteUrl)}" style="text-decoration:none"><img src="${assetBase()}/email-logo.png" width="259" height="56" alt="porchlight" style="display:block;border:0;width:259px;max-width:100%;height:auto;font-family:${DISPLAY};font-size:26px;font-weight:800;color:${C.cream}"></a>
</td></tr>
<tr><td class="pl-card" bgcolor="${C.paper}" style="background:${C.paper};border:2px solid ${C.ink};border-top:0;border-right-width:6px;border-bottom-width:6px;border-radius:0 0 20px 20px;padding:32px 32px 28px">
${eyebrow}
<h1 class="pl-h1" style="margin:0 0 18px;font-family:${DISPLAY};font-size:27px;line-height:1.15;font-weight:800;letter-spacing:-0.025em;color:${C.ink}">${esc(c.heading)}</h1>
${c.greeting ? p(c.greeting, 'font-weight:700;') : ''}
${c.body.map((s) => p(s)).join('\n')}
${details}${quote}${links}${button}${fine}
</td></tr>
<tr><td align="center" style="padding:22px 12px 0;font-family:${BODY};font-size:12.5px;line-height:1.6;color:${C.muted}">
<span style="font-family:${DISPLAY};font-weight:800;color:${C.ink}">porchlight</span> &nbsp;·&nbsp; ${footer}<br>
<a href="${esc(siteUrl)}" style="color:${C.ink};text-decoration:underline;text-decoration-color:${C.amber}">${esc(host)}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
