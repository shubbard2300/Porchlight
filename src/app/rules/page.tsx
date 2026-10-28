import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL, OWNER_NAME, SITE_URL } from '@/lib/legal';
import { POT_AMOUNTS } from '@/lib/pot';
import { contestToday, formatDay, openForSubmissions, visibleSeasons } from '@/lib/seasons';

export const metadata: Metadata = { title: 'Official contest rules · Porchlight', description: 'No purchase necessary. How Porchlight contests, voting and the prize pot work.' };

export default function Rules() {
  const today = contestToday();
  const seasons = [...new Set([...visibleSeasons(today), ...openForSubmissions(today)])];
  const site = SITE_URL.replace('https://', '');
  return (
    <LegalPage title="Official contest rules" intro={<><b>No purchase or payment is necessary to enter or win.</b> Paying into the pot does not improve your chances of winning. These rules apply to every Porchlight holiday decorating contest run by {OWNER_NAME} at {site}.</>}>
      <h2>Sponsor</h2>
      <p>{OWNER_NAME} (&quot;Porchlight&quot;), reachable at {CONTACT_EMAIL}. Local businesses shown as Pitstops may add money to a pot, but they don&apos;t run the contest.</p>

      <h2>Who can enter</h2>
      <ul>
        <li>Legal residents of the United States who are 18 or older. Void where prohibited or restricted by law.</li>
        <li>Porchlight&apos;s owners and their households can&apos;t win a pot.</li>
        <li>One entry per home per contest. The display must be at a property you live at or have permission to enter, and visible from the street or sidewalk.</li>
      </ul>

      <h2>Contest dates</h2>
      <p>Each holiday is its own contest. Voting opens on the first day shown and closes at 11:59 pm Pacific time on the holiday.</p>
      <ul>
        {seasons.map((s) => <li key={s.key}>{s.name} {s.year}: voting {formatDay(s.opens)} to {formatDay(s.day)}</li>)}
      </ul>

      <h2>How to enter (free)</h2>
      <p>Create a free host account and <Link href="/submit">post your house</Link> with at least one photo. Entering is free. Every approved entry, paid or free, competes for the same prize on the same terms. We review entries and may decline ones that break these rules or our <Link href="/terms">Terms of Service</Link>.</p>

      <h2>Optional pot contributions</h2>
      <ul>
        <li>After your house is approved, you may choose to add ${POT_AMOUNTS.join(', $')} to that contest&apos;s pot through our payment processor, Stripe. It is entirely optional.</li>
        <li>Contributions never affect voting, ranking, visibility on the map, or eligibility. A free entry can win the whole pot.</li>
        <li>Contributions are not refundable once made, except where the law requires, if your entry is removed by us without a rules violation, or if the contest is cancelled.</li>
      </ul>

      <h2>How the winner is decided</h2>
      <ul>
        <li>The winner is decided by public vote, not by chance. Visitors earn a vote by proving they visited in person (phone location within about 150 meters, or the porch QR sign), then like a house and score it.</li>
        <li>The approved house with the most verified likes when voting closes wins. If houses tie on likes, the higher average scorecard wins. If they are still tied, the prize is split evenly.</li>
        <li>We may remove votes or entries that come from fake accounts, bots, vote trading, or other attempts to game the results. Our decisions on results are final.</li>
      </ul>

      <h2>The prize</h2>
      <ul>
        <li>The prize is the money paid into that contest&apos;s pot by hosts and sponsors, as shown on the home page when voting closes. Pledges that were never paid are not part of the prize.</li>
        <li>We contact the winner by email within 7 days after the holiday. The winner must confirm identity and eligibility within 14 days, or the prize goes to the next eligible house.</li>
        <li>We pay the prize within 30 days of confirmation. The winner is responsible for taxes; prizes of $600 or more need a W-9 and are reported on a 1099.</li>
        <li>XP, levels, badges and other voter rewards have no cash value.</li>
      </ul>

      <h2>Publicity and privacy</h2>
      <p>By entering, you agree that we may show your house name, photos and results on Porchlight and in promotion of the contest. We handle personal information as described in our <Link href="/privacy">Privacy Policy</Link>. Card details go straight to Stripe; we never see or store them.</p>

      <h2>General</h2>
      <p>We may change, suspend or cancel a contest if fraud, technical problems or events beyond our control affect it, and will refund contributions if a contest is cancelled. To the extent the law allows, these rules are governed by the laws of the state where {OWNER_NAME} is organized. If these rules and the <Link href="/terms">Terms of Service</Link> differ, these rules control for the contest.</p>
    </LegalPage>
  );
}
