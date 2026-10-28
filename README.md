# Porchlight

Neighbors post their holiday displays. Everyone else finds them, rates them, and proves they visited. The house with the most verified likes when the holiday arrives wins the pot.

This repo is the real app. It currently covers:

- **Join screen** (`/join`): people choose **Viewer / rater** or **Host / decorator**. Viewers give an email and username; hosts can also give their property location.
- **Passwords plus email verification**: both sign-up forms ask for a password (8+ characters, bcrypt-hashed). Joining sends a one-time link; opening it confirms the email and lands on **My Profile**. After that, people log in with email and password. Forgot your password? `/login/link` emails a 30-minute sign-in link, and a new password can be set on the profile. Links are stored only as hashes, work once, and need a button press so email scanners can't use them up.
- **My Profile** (`/profile`): profile photo (cropped to a square in the browser, stored in Postgres), display name, hometown, bio. Hosts also get property address, neighborhood, the holiday they're decorating for, a decoration theme and property details. Viewers can switch to host at any time. 100 XP signup bonus and an invite code for everyone.
- **House photos with location**: hosts take a photo with their phone camera or choose from their library, on the submit form and on each entry in their profile (up to 6 per house; the first is the cover on the house card). The photo's GPS tags pin the house on the map; photos taken right there use the phone's location instead, and any photo without one gets an "Add my location" button. Photos are resized and stripped of metadata in the browser before upload, so the published image never carries GPS. Admins see the photos and map pin when reviewing.
- **Enter the contest**: hosts submit their house for the live or next holiday, prefilled from their profile. Entries start in review.
- **Form emails**: every sign-up and submission is emailed to the notification address you choose in the admin portal. Posters get a confirmation, then an approval or rejection email.
- **Admin portal** (`/admin`): overview, submission review (approve, reject, take down, with a note to the poster), user management (filter viewers, hosts or unverified; search; make or remove admin; delete; CSV export with profile and property fields), a Form inbox showing every email the app has sent, and settings.
- **Visit check-ins and scorecard voting**: every approved house has its own page (`/house/<id>`) linked from the map and the house cards. To vote, a visitor checks in either by sharing their phone's location once (it must be within 150 m of the house; their own position is never stored) or by scanning the house's porch QR sign. Then they score Creativity, Lighting, Storytelling and Sound design from 1 to 10, choose Love it or Not my favorite, and can leave a short cheer (obvious put-downs are turned away). Hosts print their sign from My Profile (`/house/<id>/sign`). The QR code is derived from the house id and `SESSION_SECRET`, so changing that secret retires every printed sign. First check-in at a house earns 20 XP and the first scorecard 10 XP.
- **Season rules**: the site defaults to the upcoming holiday. A finished contest stays viewable for one week after the holiday, then leaves the public site and appears in each poster's archive. See `src/lib/seasons.ts`.

Next up, per the roadmap: category brackets with theme filters and a leaderboard, the crowd meter and host stats, merchant Pitstop Pins, the route planner and Caravan mode.

## Stack

Next.js 15 (App Router, server actions) · PostgreSQL with Prisma · email through [Resend](https://resend.com) · bcrypt passwords, emailed one-time links and a signed, HTTP-only session cookie.

## Run it locally

1. Install Node 22 and Postgres 16, then create a database named `porchlight`.
2. `cp .env.example .env` and fill it in. `SESSION_SECRET` must be at least 32 characters (`openssl rand -base64 48`).
3. `npm install`
4. `npm run db:migrate` to create the tables.
5. `npm run db:seed` to create the first admin (from `SEED_ADMIN_EMAIL`, with `SEED_ADMIN_PASSWORD` if set) and three sample houses.
6. `npm run dev` and open http://localhost:3000.
7. Log in at `/login` with the seeded admin's email and password. Without a seed password, `npm run sign-in-link -- admin@example.com` prints a one-time link instead.

In development without `RESEND_API_KEY`, the "Check your email" page also shows the link it just sent, so you can test sign-up end to end.

`npm test` runs the unit tests and `npm run typecheck` checks types.

## Who is an admin

- Anyone seeded with `npm run db:seed` (sign in with `npm run sign-in-link -- <email>`).
- Anyone who signs up with an email listed in `ADMIN_EMAILS`.
- Anyone an existing admin promotes on the Users page.

Admins can't demote or delete their own account, so there is always at least one admin.

## Email

Set the notification address in **Admin > Settings** (it falls back to `ADMIN_NOTIFY_EMAIL`). To actually deliver mail, create a Resend account, verify your sending domain, and set `RESEND_API_KEY` and a "from" address on that domain. Until a key is set, every email is still recorded in **Admin > Form inbox**, marked "not delivered", so nothing is lost while you set up.

Receiving and replying uses a forwarding alias (ImprovMX): point the domain's MX records at `mx1.improvmx.com` / `mx2.improvmx.com`, add `include:spf.improvmx.com` next to Resend's `include:amazonses.com` in the SPF record, and forward `hello@yourdomain` to your own inbox. Set that alias as **Replies go to** in Admin > Settings (or `EMAIL_REPLY_TO`). Member replies to any Porchlight email land there, and sign-up and submission notifications reply straight to the member who triggered them.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Add a Postgres database (Vercel Postgres or Neon) and set `DATABASE_URL`.
3. Set `SESSION_SECRET`, `ADMIN_EMAILS`, `ADMIN_NOTIFY_EMAIL`, `APP_URL` (your site URL), and optionally `RESEND_API_KEY`, `EMAIL_FROM` and `EMAIL_REPLY_TO`.
4. Vercel runs the `vercel-build` script, which applies database migrations before building.
5. After the first deploy, join with an email from `ADMIN_EMAILS` to get admin access. Email delivery must be set up for the link to arrive; otherwise run `npm run sign-in-link -- <email>` against the production database.

## Photo storage

House photos go to a **public** [Vercel Blob](https://vercel.com/docs/vercel-blob) store when one is connected. In Vercel, open **Storage > Create > Blob**, choose Public, then connect the store to this project. Vercel sets `BLOB_STORE_ID` (and signs requests with the deployment's OIDC token), or `BLOB_READ_WRITE_TOKEN` if you tick that option; either works. Without one, photos are stored in Postgres and served from `/house-photo/<id>`, which is fine to start with but uses database space. Location data is stripped from photos before upload, so public URLs carry no GPS.

## A note on the pot

A cash prize funded by entry fees can be regulated as a contest or lottery in some US states. Keep a free way to enter, consider sponsor-funded prizes, publish official rules, and have a lawyer review before taking money. The submission form records pledges only; no payments are collected yet.
