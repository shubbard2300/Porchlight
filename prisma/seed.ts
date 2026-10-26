import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase();
  if (!email) throw new Error('Set SEED_ADMIN_EMAIL to seed the first admin.');

  const admin = await db.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, username: 'porchlight_team', accountType: 'HOST', role: 'ADMIN', emailVerifiedAt: new Date(), referralCode: 'PORCH-ADMIN', xp: 100 },
  });
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    await db.setting.upsert({ where: { key: 'notificationEmail' }, update: {}, create: { key: 'notificationEmail', value: process.env.ADMIN_NOTIFY_EMAIL } });
  }

  if ((await db.house.count()) === 0) {
    const samples = [
      ['halloween-2026', 'The Hollow at Alder', '1820 SE Alder Ct', 'Sunnyside', 'A 14-foot skeleton conducts a graveyard choir every 20 minutes.', ['Synced to music', 'Animatronics'], 2500],
      ['halloween-2026', 'Pumpkin Patch Porch', '3415 NE Couch St', 'Laurelhurst', 'Over 300 hand-carved pumpkins stacked up the porch steps.', ['Handmade', 'Treats'], 1000],
      ['christmas-2026', 'Candy Cane Cottage', '3825 NE Davis St', 'Laurelhurst', 'Peppermint stripes on every column and cocoa on Fridays.', ['Over 10k lights', 'Treats'], 5000],
    ] as const;
    for (const [season, name, address, neighborhood, description, tags, cents] of samples) {
      await db.house.create({ data: { ownerId: admin.id, season, name, address, neighborhood, description, tags: [...tags], litFrom: '6 pm', litUntil: '10 pm', contributionCents: cents, status: 'APPROVED', reviewedAt: new Date() } });
    }
  }
  console.log(`Seeded admin ${email}. Run \`npm run sign-in-link -- ${email}\` to sign in before email is set up.`);
}

main().finally(() => db.$disconnect());
