import { describe, expect, it } from 'vitest';
import { renderEmail } from './emailLayout';
import { contactAdminEmail, linkEmail } from './emails';

const site = 'https://www.porchlightcontest.com';
const url = (path: string) => `${site}${path}`;

describe('email layout', () => {
  it('renders the link as a button and keeps it in the plain text', () => {
    const { html, text } = renderEmail(linkEmail({ name: 'Dana', verify: true, link: url('/login/link?token=abc'), expires: '24 hours' }).content, site);
    expect(html).toContain('href="https://www.porchlightcontest.com/login/link?token=abc"');
    expect(html).toContain('email-logo.png');
    expect(text).toContain('Confirm my email: https://www.porchlightcontest.com/login/link?token=abc');
    expect(text).toMatch(/^Hi Dana,/);
  });

  it('escapes what members type and keeps their address searchable in the text', () => {
    const e = contactAdminEmail({ name: 'Sam', email: 'sam@example.com', topic: 'Other', signedInAs: null, message: '<script>alert(1)</script>' }, url);
    const { html, text } = renderEmail(e.content, site);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(text).toContain('<sam@example.com>');
  });
});
