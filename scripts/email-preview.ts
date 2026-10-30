/**
 * Writes every Porchlight email, filled with sample data, to email-preview/ as .html and .txt
 * so the designs can be checked in a browser:  npm run email-preview
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderEmail } from '../src/lib/emailLayout';
import * as emails from '../src/lib/emails';

const site = 'https://www.porchlightcontest.com';
const url = (path: string) => `${site}${path}`;
const photos = [url('/photos/sample-1.jpg'), url('/photos/sample-2.jpg')];

const samples: Record<string, emails.Email> = {
  verify: emails.linkEmail({ name: 'Dana', verify: true, link: url('/login/link?token=sample'), expires: '24 hours' }),
  login: emails.linkEmail({ name: 'Dana', verify: false, link: url('/login/link?token=sample'), expires: '20 minutes' }),
  invite: emails.inviteEmail({ invitedBy: 'gamecat', level: 'Editor', staff: true, link: url('/login/link?token=sample'), expires: '24 hours' }),
  welcome: emails.welcomeEmail({ username: 'dana', host: true, bonusXp: 50, referralCode: 'PORCH-3F9A1C' }, url),
  'submission-received': emails.submissionReceivedEmail({ name: 'Dana', house: 'The Glow Bungalow', season: 'Christmas 2026' }, url),
  approved: emails.approvedEmail({ name: 'Dana', house: 'The Glow Bungalow', season: 'Christmas', xp: 100, note: 'Love the candy cane walkway!' }, url),
  rejected: emails.rejectedEmail({ name: 'Dana', house: 'The Glow Bungalow', note: 'The photos were too dark to see the lights. Try one at dusk.' }, url),
  removed: emails.removedEmail({ name: 'Dana', house: 'The Glow Bungalow', note: null }, url),
  signup: emails.newMemberAdminEmail({ username: 'dana', email: 'dana@example.com', host: true, propertyAddress: '12 Elm St, Portland', invitedBy: 'sam <sam@example.com>', marketingOptIn: true }, url),
  submission: emails.submissionAdminEmail({
    username: 'dana', email: 'dana@example.com', season: 'Christmas', year: 2026, house: 'The Glow Bungalow', address: '12 Elm St (Sellwood)',
    showExactAddress: true, lit: '5pm to 11pm', tags: ['Music show', 'Inflatables'], pledge: 20, photoUrls: photos,
    mapPin: 'https://www.google.com/maps?q=45.46,-122.65', description: '40,000 lights synced to music every half hour.', reviewUrl: url('/admin/houses/sample'),
  }),
  'new-photo': emails.newPhotoAdminEmail({ username: 'dana', email: 'dana@example.com', house: 'The Glow Bungalow', live: true, photoUrls: photos, reviewUrl: url('/admin/houses/sample') }),
  contact: emails.contactAdminEmail({ name: 'Sam Lee', email: 'sam@example.com', topic: 'Prizes', signedInAs: null, message: 'How is the pot split if two houses tie?\nThanks!' }, url),
  test: emails.testAdminEmail(url),
};

const dir = join(process.cwd(), 'email-preview');
mkdirSync(dir, { recursive: true });
for (const [name, e] of Object.entries(samples)) {
  const { html, text } = renderEmail(e.content, site);
  writeFileSync(join(dir, `${name}.html`), html);
  writeFileSync(join(dir, `${name}.txt`), `Subject: ${e.subject}\n\n${text}\n`);
}
console.log(`Wrote ${Object.keys(samples).length} emails to ${dir}`);
