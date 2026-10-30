import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL, CONTEST_STATE, OWNER_NAME } from '@/lib/legal';

export const metadata: Metadata = { title: 'Privacy Policy · Porchlight' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" intro={<>{OWNER_NAME} (&quot;we&quot;) runs Porchlight, a seasonal contest for decorated houses. This page explains what we collect, why, and the choices you have.</>}>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your email address, username, and a scrambled (hashed) version of your password. We never store the password itself.</li>
        <li><b>Profile details you choose to add:</b> a profile photo, display name, bio, and hometown.</li>
        <li><b>Host details:</b> your property address or location, neighborhood, season, decoration theme, and photos of your display. Location is used to pin your house on the map. We remove GPS and camera data from photos before they are shown publicly.</li>
        <li><b>Contest activity:</b> your likes, comments, visit check-ins (a photo and/or your location at the time of the visit), XP, badges, and invite codes.</li>
        <li><b>AR porch hunts:</b> which critters you caught and when. The hunt uses your camera and compass only on your device; no video or images are recorded or sent to us.</li>
        <li><b>Porch light triggers:</b> if a host connects their smart lights, we store the webhook link they give us. When you check in, like their house or catch its critter, we send that link the house name, your display name, the event and the time, so their lights can flash hello. Nothing else about you is sent.</li>
        <li><b>Alerts (optional):</b> if you turn on push alerts, the delivery address your browser gives us for this device, which alerts you want, and, for &quot;new houses near me,&quot; a spot you choose rounded to about 100 meters. Turn alerts off or forget the spot anytime in your profile.</li>
        <li><b>Contest records:</b> when you agreed to the official rules (on entering a house or paying into a pot) and which version you saw. If you win, the identity and tax details on your IRS Form W-9, which we use only to pay and report the prize.</li>
        <li><b>Email records:</b> a log of the emails we send you (such as sign-in links), so we can fix delivery problems.</li>
        <li><b>Basic technical data:</b> like any website, our hosting provider receives your IP address and browser details when you load a page.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account, sign you in, and keep it secure.</li>
        <li>To show houses on the map, count verified votes, and decide the winner of each season.</li>
        <li>To send emails you need (confirmation and sign-in links) and, only if you opted in, an email when a new contest opens.</li>
        <li>To review submissions and prevent cheating or abuse.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it for advertising.</p>

      <h2>What is public</h2>
      <p>Your username, profile photo, and comments are visible to other users. If you host, your house name, photos, description, neighborhood and approximate spot on the map are public. Exact addresses are shown only to signed-in members (see below).</p>

      <h2>Your home address</h2>
      <ul>
        <li><b>Why we ask:</b> to confirm the home is eligible{CONTEST_STATE ? ` (contests are open to homes in ${CONTEST_STATE.name})` : ''}, to stop duplicate or spoofed entries, and to put your house on the map so visitors can find it.</li>
        <li><b>Members only:</b> visitors who aren&apos;t signed in, and search engines, never see your street address or exact pin; they see your neighborhood and an approximate spot (within about a kilometer).</li>
        <li><b>You choose what members see:</b> when you post a house you decide whether signed-in members can see your exact address. If you turn it off, members also see only the approximate spot, and the exact spot is shared with a visitor only once they check in nearby.</li>
        <li><b>How it&apos;s protected:</b> it travels over encrypted connections and is stored with our database provider, which encrypts data at rest. Only Porchlight admins can see hidden addresses.</li>
        <li><b>No selling:</b> we never sell, rent or trade your address or identity to marketers, advertisers or data brokers.</li>
        <li><b>How long:</b> while your entry is posted and in the contest archive. If you delete an entry, its address is deleted with it. An address saved on your profile stays until you change it or delete your account.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We use a few service providers to run the site, and they only process data on our behalf: Vercel (hosting and photo storage), Neon (database), OpenStreetMap&apos;s Nominatim service (turning a street address you enter into a map location and state), Resend (sending email), Stripe (taking pot payments; card details go straight to Stripe and we never see them), ImprovMX (forwarding mail sent to us), and Google Fonts (typefaces, which means your browser contacts Google when a page loads). We may also share information if the law requires it.</p>

      <h2>How long we keep it</h2>
      <p>We keep your account until you delete it or ask us to. Past contests stay in the archive so results remain accurate. Sign-in links expire quickly, and email logs are kept only as long as they are useful for troubleshooting.</p>

      <h2>Your choices and rights</h2>
      <p>You can edit your profile at any time. You can ask us to send you a copy of your data, correct it, or delete your account by <Link href="/contact?topic=Privacy+and+my+data" data-modal="contact:Privacy and my data">sending us a message</Link> or emailing {CONTACT_EMAIL}. Depending on where you live (for example California under the CCPA, or the EU and UK under the GDPR), you may have additional rights, and we will honor them. We will not treat you differently for using them.</p>

      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you signed in. See our <Link href="/cookies">Cookie Policy</Link>.</p>

      <h2>Children</h2>
      <p>Porchlight is for people 18 and older. We do not knowingly collect information from children under 13. If you believe a child has signed up, <Link href="/contact?topic=Privacy+and+my+data" data-modal="contact:Privacy and my data">contact us</Link> and we will delete the account.</p>

      <h2>Security</h2>
      <p>We use encrypted connections (HTTPS), hashed passwords, and limited admin access. No system is perfectly secure, so please use a password you don&apos;t use elsewhere.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we will update the date at the top. For significant changes, we will let account holders know by email.</p>
    </LegalPage>
  );
}
