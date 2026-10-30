import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL, CONTEST_STATE, OWNER_NAME, PRIZE_PLACES, rulesAgreementText, SITE_URL, SPONSOR_ADDRESS } from '@/lib/legal';
import { POT_AMOUNTS } from '@/lib/pot';
import { contestToday, formatDay, openForSubmissions, visibleSeasons } from '@/lib/seasons';

export const metadata: Metadata = { title: 'Official contest rules · Porchlight', description: 'No purchase necessary. How Porchlight contests, voting and the prize pot work.' };

/** A detail that still has to be filled in before launch, shown so nobody mistakes it for the real thing. */
const Blank = ({ children }: { children: React.ReactNode }) => <mark className="legal-blank">[{children}]</mark>;

export default function Rules() {
  const today = contestToday();
  const seasons = [...new Set([...visibleSeasons(today), ...openForSubmissions(today)])];
  const site = SITE_URL.replace('https://', '');
  const where = CONTEST_STATE?.name;
  return (
    <LegalPage title="Official contest rules" intro={<><b>No purchase or payment is necessary to enter or win.</b> Paying into the pot does not improve your chances of winning. These rules apply to every Porchlight holiday decorating contest run by {OWNER_NAME} at {site}.</>}>
      <h2>1. Sponsor</h2>
      <p>{OWNER_NAME} (&quot;Porchlight&quot;), {SPONSOR_ADDRESS || <Blank>mailing address</Blank>}, {CONTACT_EMAIL}. Local businesses shown as Pitstops may add money to a pot, but they don&apos;t run the contest or pick the winners.</p>

      <h2>2. Who can enter</h2>
      <ul>
        {where
          ? <li>Open only to legal residents of {where} who are 18 or older when they enter. The decorated home must be in {where}. Void where prohibited.</li>
          : <li>Open to legal residents of the United States who are 18 or older. Void where prohibited or restricted by law.</li>}
        <li>Porchlight&apos;s owners, anyone who helps run or judge the contest, and their households can&apos;t win a prize.</li>
        <li>One entry per home per contest. The display must be at a home you live at or have the owner&apos;s permission to enter, and visible from the street or sidewalk.</li>
      </ul>

      <h2>3. Contest dates</h2>
      <p>Each holiday is its own contest. Voting opens on the first day shown and closes at 11:59 pm Pacific time on the holiday.</p>
      <ul>
        {seasons.map((s) => <li key={s.key}>{s.name} {s.year}: voting {formatDay(s.opens)} to {formatDay(s.day)}</li>)}
      </ul>

      <h2>4. How to enter (free)</h2>
      <p>Create a free host account and <Link href="/submit">post your house</Link> with at least one photo, then tick the box agreeing to these rules. Entering is free. Every approved entry, paid or free, competes for the same prize on the same terms. We review every entry and may decline ones that break these rules or our <Link href="/terms">Terms of Service</Link>.</p>

      <h2>5. What your display can&apos;t include</h2>
      <p>Displays and photos must be your own and family friendly. We may decline or remove an entry, without a refund of any contribution, if it shows:</p>
      <ul>
        <li><b>Commercial branding:</b> business logos, ads or promotional signs. (Licensed characters and store-bought decorations are fine.)</li>
        <li><b>Political messages:</b> campaign signs, candidate or party endorsements, or political statements.</li>
        <li><b>Safety hazards:</b> anything that breaks fire codes, blocks a sidewalk or road, or has exposed wiring or dangerous materials.</li>
        <li><b>Inappropriate content:</b> profanity, nudity, graphic violence, hate, or anything defamatory.</li>
        <li>Photos you didn&apos;t take or don&apos;t have the right to share, or people who haven&apos;t agreed to be shown.</li>
      </ul>

      <h2>6. Optional pot contributions</h2>
      <ul>
        <li>After your house is approved, you may choose to add ${POT_AMOUNTS.join(', $')} to that contest&apos;s pot through our payment processor, Stripe. It is entirely optional and is not an entry fee.</li>
        <li>Contributions never affect voting, ranking, visibility on the map, or eligibility. A free entry can win any prize.</li>
        <li>Contributions are not refundable, including if you withdraw your entry, except where the law requires, if we remove your entry without a rules violation, or if the contest is cancelled.</li>
      </ul>

      <h2>7. How the winners are decided</h2>
      <ul>
        <li>Winners are decided by verified public vote, not by chance. A visitor earns a vote by proving they visited in person (phone location within about 150 meters, or the porch QR sign), then likes a house and scores it on creativity, lighting, storytelling and sound.</li>
        <li>Each account gets one like and one scorecard per house per contest.</li>
        <li>When voting closes, the approved houses with the most verified likes win first, second and third place, in that order.</li>
        <li><b>Ties:</b> if houses tie on likes for a prize place, the higher average scorecard places higher. If they are still tied, an independent guest judge picked by Porchlight scores the tied displays on creative complexity (50%) and visual impact (50%), and the higher score places higher.</li>
      </ul>

      <h2>8. Fair voting</h2>
      <ul>
        <li>Hosts may not offer money, gifts, discounts or anything else of value in exchange for votes, and may not trade votes.</li>
        <li>No bots, scripts, fake or duplicate accounts, paid voting services, or check-ins from anywhere but the house.</li>
        <li>Porchlight gives every voter the same XP and badges for checking in and voting at any house, whichever house they like. XP, levels and badges have no cash value and can&apos;t be traded.</li>
        <li>We check votes using the in-person check-in, one account per person, and by reviewing unusual patterns. We may remove votes, and disqualify an entry that benefits from cheating, whether or not the host took part. Our decisions on results are final.</li>
      </ul>

      <h2>9. The prize</h2>
      <ul>
        <li>Each contest awards three cash prizes:
          <ul>{PRIZE_PLACES.map((p) => <li key={p.place}>{p.place}: {p.amount || <Blank>amount</Blank>}</li>)}</ul>
        </li>
        <li>Prizes are paid from the money in that contest&apos;s pot from hosts and sponsors, as shown on the home page when voting closes, together with any amount Porchlight adds. Pledges that were never paid are not part of the pot.</li>
        <li>We contact the winners by email within 7 days after the holiday and announce them on Porchlight. Each winner must confirm identity and eligibility, and return a signed IRS Form W-9, within 14 days, or that prize goes to the next eligible house.</li>
        <li>We pay prizes within 30 days of confirmation. Winners are responsible for all taxes. We report prizes as the law requires, including on IRS Form 1099-MISC when a winner&apos;s prizes from us reach $2,000 or more in a year.</li>
        <li>A house can win only one prize per contest.</li>
        <li>Prizes can&apos;t be transferred or swapped.</li>
      </ul>

      <h2>10. Photos, publicity and privacy</h2>
      <p>You keep ownership of your photos. By entering, you let us show, resize and crop your house name, photos and results on Porchlight and in promotion of the contest, including in the archive of past contests. We use your address to confirm the home is eligible and to put it on the map, as described in our <Link href="/privacy">Privacy Policy</Link>. Card details go straight to Stripe; we never see or store them.</p>

      <h2>11. Withdrawing</h2>
      <p>You can delete your entry from your profile at any time. Contributions already paid stay in the pot (see section 6).</p>

      <h2>12. General</h2>
      <p>We may change, suspend or cancel a contest if fraud, technical problems or events beyond our control affect it, and will refund contributions if a contest is cancelled. {where ? `These rules are governed by the laws of ${where}.` : `To the extent the law allows, these rules are governed by the laws of the state where ${OWNER_NAME} is organized.`} If these rules and the <Link href="/terms">Terms of Service</Link> differ, these rules control for the contest. For the winners&apos; names after the contest, email {CONTACT_EMAIL}.</p>

      <h2>13. Your agreement</h2>
      <p>When you enter a house or pay into a pot, you tick this box, and we record when you did and which version of these rules you saw:</p>
      <p className="legal-quote">{rulesAgreementText()}</p>
    </LegalPage>
  );
}
