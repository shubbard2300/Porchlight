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
- **Brackets, theme filters and the leaderboard**: every entry competes in a category bracket (Classic & Cozy, Light Show, Inflatable Kingdom, Extreme DIY, Small Porch, plus Spooky Halloween, Winter Wonderland or Red, White & Boom for their holiday; see `src/lib/brackets.ts`). Hosts pick one when they enter and can switch it on My Profile while the contest runs. The brackets double as theme filter chips above the home map. `/leaderboard` shows the overall pot race and the top three in each bracket. Order everywhere: verified likes, then the scorecard average, then entry date (`src/lib/standings.ts`).
- **Crowd meter and host flex stats**: map pins get a colored ring (Lively, Busy, Packed) from the number of different people who checked in during the last 30 minutes. Open maps refresh it every minute from `/api/crowd`, and house pages show it too. Only counts are shared, never who. Hosts (and admins) get a stats page per entry (`/house/<id>/stats`, linked from My Profile): total visitors, likes, miles guests traveled from their previous stop, peak hour, bracket rank, cheers, a rush-hour chart, QR vs location check-ins, and their best-scored category.
- **Merchant Pitstop Pins**: admins add local sponsors under **Admin → Pitstops** (`/admin/merchants`) with a Bronze, Silver or Gold tier, category, offer, hours and address (geocoded to a pin). Active pitstops show on the map as tier-colored gift pins, and each house page suggests the closest one within 3 km. Admins print a counter QR sign per merchant (`/pitstop/<id>/sign`). Scanning it doubles all XP the visitor earns for 2 hours (a "2×" badge appears next to their XP), plus 15 XP the first time at that merchant. No purchase is necessary and contest votes are never boosted. Repeat scans at the same place within 12 hours don't restart the boost. The admin page shows scans per merchant for sponsor reporting.
- **Route Weaver** (`/route`, linked from the nav, under the home map and on each house page): a visitor picks a start (their location, which stays in the browser, or any house), 30 min to 2 h, walking or driving, and optionally a theme. It picks a loop of up to 9 stops that gets them back on time, favoring verified likes and scorecards per added minute and then untangling the order, and can slot in the nearest pitstop that still fits (`src/lib/routeWeaver.ts`). "Open in Google Maps" hands the whole loop off for turn-by-turn directions; Apple Maps links open one leg at a time, since Apple's links don't take waypoints. Hidden-address houses route to their approximate public pin.
- **Anchor blocks**: admins mark well-known decorated streets or neighborhoods under **Admin → Anchor blocks** (`/admin/blocks`): a name, a one-line pitch, a center (geocoded from a street or intersection) and a radius. Each block shows on the map as a glowing dashed zone, featured blocks get a "start here" card on the home page, and every block has a page (`/block/<id>`) with its houses ranked, live check-ins, a "Plan a tour from here" link into the Route Weaver, and a "Live on this block? Post your house" invite. Admins can print a neighbor flyer (`/block/<id>/flyer`) whose QR opens the block page. Houses belong to a block by their public map pin, so hidden addresses stay hidden (`src/lib/blocks.ts`).
- **Caravan mode** (`/caravan`, in the nav when logged in): someone starts a caravan for the night (12 hours, up to 12 people) and shares a link or QR with a 6-letter code (`/caravan/join?code=…`). Check-ins and scorecards made while in a caravan are tagged with it. Checking in at a porch where a squadmate checked in within the last 30 minutes earns +5 bonus XP (doubled during a pitstop boost). The caravan page shows the squad, tonight's stops and the squad's score at each. Once two or more squadmates score a house, the house page shows their **Squad review**: average scores, likes, best category and cheers. Votes still count one per person. Leaders can end the caravan; anyone can leave (`src/lib/caravans.ts`).
- **Season rules**: the site defaults to the upcoming holiday. A finished contest stays viewable for one week after the holiday, then leaves the public site and appears in each poster's archive. See `src/lib/seasons.ts`.

- **Prize pot payments** (Stripe Checkout over plain `fetch`, `src/lib/stripe.ts`): entering stays free. Once a house is approved, its host can pay their optional pledge ($10, $25 or $50) from their profile. Stripe sends them back to `/pot/<id>/done`, which confirms the payment straight away; the webhook at `/api/stripe/webhook` also records completed, expired and refunded payments. The home page pot counts only paid money (plus a "more pledged" note). Admins see payments, refund them and record sponsor money in **Admin > Prize pot**. Official rules (no purchase necessary) live at `/rules`. Without `STRIPE_SECRET_KEY` the pay buttons stay hidden; see `.env.example` for the webhook setup. Winner payouts are made by hand.

- **Installable app and push alerts**: Porchlight has a web app manifest and a service worker (`public/sw.js`), so it can be added to a phone's home screen. In **Profile > Alerts**, people turn on push alerts for each device and pick which ones they want: new houses within 1 to 10 km of a saved spot (sent when an admin approves a house), likes on their house (at most one every 30 minutes), squadmates checking in, and a last call on the evening of each holiday (Vercel Cron hits `/api/cron/last-call` daily at 02:00 UTC). On iPhone, alerts work once Porchlight is added to the home screen (iOS 16.4+). Alerts are sent with `web-push` (`src/lib/push.ts`, triggers in `src/lib/alertTriggers.ts`) and need a VAPID key pair; see `.env.example`.

- **AR porch hunts** (`/house/<id>/hunt`, collection at `/hunt`): every live house hides a holiday critter (Halloween: Wisp, Jack, Hoot; Christmas: Flurry, Twinkle, Bow, Spruce; Fourth of July: Sparky, Glory), picked from the house id (`src/lib/hunt.ts`). After checking in, a visitor opens the camera. On phones with a compass, the critter waits at its own bearing for that visitor and floats into view as they turn, with "turn left or right" hints. Without a compass, it drifts around the screen. Tapping it catches it for +15 XP, once per house. The collection page shows the holiday set (uncaught ones greyed out) and progress across the season's porches. Nothing from the camera leaves the device.
- **Porch light triggers** (`/house/<id>/lights`, host only): a host pastes a webhook link (IFTTT, Home Assistant, Zapier) and picks events: check-in, like, AR catch. Porchlight POSTs JSON `{event, house, visitor, at, value1..3}` with `X-Porchlight-Event` and `X-Porchlight-Signature: sha256=<HMAC of body with the host's secret>`, after the response is sent (`after()`), at most once per 20 s per house (`src/lib/porchLights.ts`, `porchLightServer.ts`). Links must be public https; anything resolving to a private address is refused, no redirects, 5 s timeout. For local testing only, `LIGHTS_ALLOW_PRIVATE=1` (ignored in production) lets a dev server call a receiver on the same machine.

Next up: porch light triggers.

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
