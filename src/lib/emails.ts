// Every email Porchlight sends, as subject + content for the branded layout in emailLayout.ts.
// Kept free of database calls so scripts/email-preview.ts can render them with sample data.
import type { EmailContent } from './emailLayout';

export type Email = { subject: string; content: EmailContent };
type Link = (path: string) => string;

export function linkEmail(o: { name: string; verify: boolean; link: string; expires: string }): Email {
  return o.verify
    ? {
        subject: 'Confirm your email for Porchlight',
        content: {
          preheader: 'One tap and your porch light is on.',
          eyebrow: 'Confirm your email',
          heading: 'Flip on your porch light',
          greeting: `Hi ${o.name},`,
          body: ['Tap the button to confirm it’s you and open your profile.'],
          button: { label: 'Confirm my email', url: o.link },
          showUrl: true,
          fine: `The link works once and expires in ${o.expires}. If you didn't ask for it, you can ignore this email.`,
        },
      }
    : {
        subject: 'Your Porchlight sign-in link',
        content: {
          preheader: 'Your one-time sign-in link is inside.',
          eyebrow: 'Sign in',
          heading: 'Welcome back to the block',
          greeting: `Hi ${o.name},`,
          body: ['Tap the button to sign in.'],
          button: { label: 'Sign me in', url: o.link },
          showUrl: true,
          fine: `The link works once and expires in ${o.expires}. If you didn't ask for it, you can ignore this email.`,
        },
      };
}

export function welcomeEmail(o: { username: string; host: boolean; bonusXp: number; referralCode: string }, url: Link): Email {
  return {
    subject: 'Welcome to Porchlight',
    content: {
      preheader: `You're in. ${o.bonusXp} XP and the Porch Pass badge are waiting.`,
      eyebrow: 'Porch Pass unlocked',
      accent: 'candy',
      heading: 'You’re in!',
      greeting: `Hi ${o.username},`,
      body: [
        `Your welcome gift: ${o.bonusXp} XP and the Porch Pass badge.`,
        o.host ? 'Finish your host profile with your property and this season’s decorations, then post your house.' : 'Add a profile photo, then head out and find some lights.',
      ],
      details: [['Your invite code', o.referralCode]],
      button: { label: o.host ? 'Finish my profile' : 'Open my profile', url: url('/profile') },
      fine: 'Invite neighbors with your code. You both earn XP when they join.',
    },
  };
}

export function submissionReceivedEmail(o: { name: string; house: string; season: string }, url: Link): Email {
  return {
    subject: `We got ${o.house}`,
    content: {
      preheader: 'Your house is in the review queue.',
      eyebrow: 'Submission received',
      heading: `${o.house} is in the queue`,
      greeting: `Hi ${o.name},`,
      body: [`Thanks for posting ${o.house} for ${o.season}. We review new houses quickly, and you'll get an email once it's live on the map.`],
      button: { label: 'See my submissions', url: url('/profile') },
    },
  };
}

export function approvedEmail(o: { name: string; house: string; season: string; xp: number; note: string | null; pledge?: string | null }, url: Link): Email {
  return {
    subject: `${o.house} is live on Porchlight`,
    content: {
      preheader: `${o.house} is on the map. Let the votes roll in.`,
      eyebrow: 'You’re on the map',
      accent: 'candy',
      heading: `${o.house} is live!`,
      greeting: `Hi ${o.name},`,
      body: [
        `${o.house} is now on the ${o.season} map. You earned ${o.xp} XP and the Lamplighter badge.`,
        ...(o.pledge ? [`You pledged ${o.pledge} to the prize pot. Whenever you're ready, you can pay it by card from your profile. It's optional, and it never affects votes.`] : []),
      ],
      ...(o.note && { quote: { label: 'Note from the team', text: o.note } }),
      button: { label: 'See it on the map', url: url('/') },
    },
  };
}

export function rejectedEmail(o: { name: string; house: string; note: string | null }, url: Link): Email {
  return {
    subject: `About your ${o.house} submission`,
    content: {
      preheader: `We couldn't publish ${o.house} yet.`,
      eyebrow: 'Submission update',
      accent: 'lilac',
      heading: 'Not quite yet',
      greeting: `Hi ${o.name},`,
      body: [`We couldn't publish ${o.house} yet.`],
      ...(o.note && { quote: { label: 'Reason', text: o.note } }),
      button: { label: 'Post it again', url: url('/submit') },
      fine: 'You can post it again any time.',
    },
  };
}

export function removedEmail(o: { name: string; house: string; note: string | null }, url: Link): Email {
  return {
    subject: `${o.house} was removed from Porchlight`,
    content: {
      preheader: `${o.house} is no longer on the map.`,
      eyebrow: 'Submission removed',
      accent: 'lilac',
      heading: `${o.house} was removed`,
      greeting: `Hi ${o.name},`,
      body: [`We removed ${o.house} from Porchlight.`],
      ...(o.note && { quote: { label: 'Reason', text: o.note } }),
      button: { label: 'Post a house', url: url('/submit') },
      fine: 'You can post your house again any time.',
    },
  };
}

// Admin notifications. The first body line keeps "name <email>" so the inbox can be searched by sender.

export function newMemberAdminEmail(
  o: { username: string; email: string; host: boolean; propertyAddress: string | null; invitedBy: string | null; marketingOptIn: boolean },
  url: Link,
): Email {
  const role = o.host ? 'host' : 'viewer';
  return {
    subject: `New ${role}: ${o.username}`,
    content: {
      audience: 'admin',
      preheader: `${o.username} joined as a ${o.host ? 'host / decorator' : 'viewer / rater'}.`,
      eyebrow: `New ${role}`,
      heading: `${o.username} joined`,
      body: [`${o.username} <${o.email}> verified their email and joined as a ${o.host ? 'host / decorator' : 'viewer / rater'}.`],
      details: [
        ...(o.host ? [['Property location', o.propertyAddress ?? 'not given yet'] as [string, string]] : []),
        ['Invited by', o.invitedBy ?? 'nobody'],
        ['Email updates', o.marketingOptIn ? 'yes' : 'no'],
      ],
      button: { label: 'Manage users', url: url('/admin/users') },
    },
  };
}

export function submissionAdminEmail(o: {
  username: string;
  email: string;
  season: string;
  year: number;
  house: string;
  address: string;
  showExactAddress: boolean;
  lit: string;
  tags: string[];
  pledge: number;
  photoUrls: string[];
  mapPin: string | null;
  description: string;
  reviewUrl: string;
}): Email {
  return {
    subject: `New ${o.season} submission: ${o.house}`,
    content: {
      audience: 'admin',
      preheader: `${o.username} posted ${o.house}. It needs a review.`,
      eyebrow: 'Needs review',
      heading: o.house,
      body: [`${o.username} <${o.email}> posted a house for ${o.season} ${o.year}.`],
      details: [
        ['Address', o.address],
        ['Show exact address', o.showExactAddress ? 'yes' : 'no'],
        ['Lit', o.lit],
        ['Features', o.tags.join(', ') || 'none listed'],
        ['Pot pledge', `$${o.pledge}`],
        ['Photos', String(o.photoUrls.length)],
        ['Map pin', o.mapPin ?? 'none yet'],
      ],
      quote: { label: 'Description', text: o.description },
      links: { label: 'Photos', urls: o.photoUrls },
      button: { label: 'Approve or reject it', url: o.reviewUrl },
    },
  };
}

export function newPhotoAdminEmail(o: { username: string; email: string; house: string; live: boolean; photoUrls: string[]; reviewUrl: string }): Email {
  return {
    subject: `New photo on ${o.house}`,
    content: {
      audience: 'admin',
      preheader: `${o.username} added a photo to ${o.house}.`,
      eyebrow: o.live ? 'Live submission' : 'Needs review',
      heading: `New photo on ${o.house}`,
      body: [`${o.username} <${o.email}> added a photo to ${o.house}${o.live ? ', which is live on the site now' : ''}.`],
      links: { label: 'All photos on this submission', urls: o.photoUrls },
      button: { label: o.live ? 'Review it (take it down if needed)' : 'Approve or reject it', url: o.reviewUrl },
    },
  };
}

export function contactAdminEmail(o: { name: string; email: string; topic: string; signedInAs: string | null; message: string }, url: Link): Email {
  return {
    subject: `Contact: ${o.topic} from ${o.name}`,
    content: {
      audience: 'admin',
      preheader: o.message.slice(0, 120),
      eyebrow: 'Contact form',
      accent: 'lilac',
      heading: `Message from ${o.name}`,
      body: [`${o.name} <${o.email}> sent a message through the contact form.`],
      details: [
        ['Topic', o.topic],
        ['Signed in', o.signedInAs ?? 'no'],
      ],
      quote: { label: 'Message', text: o.message },
      button: { label: 'All messages', url: url('/admin/inbox?kind=contact') },
      fine: `Reply to this email to answer ${o.name} directly.`,
    },
  };
}

export function testAdminEmail(url: Link): Email {
  return {
    subject: 'Porchlight test email',
    content: {
      audience: 'admin',
      preheader: 'Form notifications reach this inbox.',
      eyebrow: 'Test',
      heading: 'It works!',
      body: ['This is a test from Porchlight. If you can read this, form notifications reach this inbox.'],
      button: { label: 'Open the form inbox', url: url('/admin/inbox') },
    },
  };
}
