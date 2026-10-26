# Porchlight

Neighbors post their holiday displays. Everyone else finds them, rates them, and proves they visited. The house with the most verified likes when the holiday arrives wins the pot.

This repo is the real app. It currently covers:

- **Accounts**: sign up, log in, log out. New users get a 100 XP signup bonus and an invite code.
- **Post your house**: a submission form for the live or next holiday. Posts start in review.
- **Form emails**: every sign-up and submission is emailed to the notification address you choose in the admin portal. Posters get a confirmation, then an approval or rejection email.
- **Admin portal** (`/admin`): overview, submission review (approve, reject, take down, with a note to the poster), user management (search, make or remove admin, delete, CSV export), a Form inbox showing every email the app has sent, and settings.
- **Season rules**: the site defaults to the upcoming holiday. A finished contest stays viewable for one week after the holiday, then leaves the public site and appears in each poster's archive. See `src/lib/seasons.ts`.

Next up: the swipe deck, map, visit verification (location and photo), comments, the pot leaderboard and badges from the prototype.

## Stack

Next.js 15 (App Router, server actions) · PostgreSQL with Prisma · email through [Resend](https://resend.com) · password hashing with bcrypt and a signed, HTTP-only session cookie.

## Run it locally

1. Install Node 22 and Postgres 16, then create a database named `porchlight`.
2. `cp .env.example .env` and fill it in. `SESSION_SECRET` must be at least 32 characters (`openssl rand -base64 48`).
3. `npm install`
4. `npm run db:migrate` to create the tables.
5. `npm run db:seed` to create the first admin (from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) and three sample houses.
6. `npm run dev` and open http://localhost:3000. Log in as the admin and go to `/admin`.

`npm test` runs the unit tests and `npm run typecheck` checks types.

## Who is an admin

- Anyone seeded with `npm run db:seed`.
- Anyone who signs up with an email listed in `ADMIN_EMAILS`.
- Anyone an existing admin promotes on the Users page.

Admins can't demote or delete their own account, so there is always at least one admin.

## Email

Set the notification address in **Admin > Settings** (it falls back to `ADMIN_NOTIFY_EMAIL`). To actually deliver mail, create a Resend account, verify your sending domain, and set `RESEND_API_KEY` and a "from" address on that domain. Until a key is set, every email is still recorded in **Admin > Form inbox**, marked "not delivered", so nothing is lost while you set up.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Add a Postgres database (Vercel Postgres or Neon) and set `DATABASE_URL`.
3. Set `SESSION_SECRET`, `ADMIN_EMAILS`, `ADMIN_NOTIFY_EMAIL`, `APP_URL` (your site URL), and optionally `RESEND_API_KEY` and `EMAIL_FROM`.
4. Set the build command to `npx prisma migrate deploy && npm run build`.
5. After the first deploy, sign up with an email from `ADMIN_EMAILS` to get admin access.

## A note on the pot

A cash prize funded by entry fees can be regulated as a contest or lottery in some US states. Keep a free way to enter, consider sponsor-funded prizes, publish official rules, and have a lawyer review before taking money. The submission form records pledges only; no payments are collected yet.
