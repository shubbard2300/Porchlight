import type { Icon3DName } from '@/components/Icon3D';
import { MILESTONES, MILESTONE_NOUN } from './community';
import { CHECKIN_XP, SIGNUP_BONUS_XP, VOTE_XP } from './rewards';

/**
 * Answers are plain text with [label](/path) links. Anything about prizes, eligibility or money points to
 * the official rules instead of restating terms, so the rules page stays the single source of truth.
 */
export type FaqItem = { id: string; q: string; a: string[]; list?: string[] };
export type FaqTopic = { key: string; label: string; icon: Icon3DName; items: FaqItem[] };

const milestoneLines = MILESTONES.map((m) => `${m.goal.toLocaleString('en-US')} ${MILESTONE_NOUN[m.key]}: ${m.unlock}. ${m.detail}`);

export const FAQ: FaqTopic[] = [
  {
    key: 'start', label: 'Getting started', icon: 'bulb', items: [
      { id: 'what', q: 'What is Porchlight?', a: [
        'Porchlight is a neighborhood holiday light map that everyone builds together. Hosts add their decorated homes, neighbors visit in person, and the community votes on its favorites.',
        'It’s a celebration first. The friendly competition is there to make the night more fun, not to make it about one winner.',
      ] },
      { id: 'cost', q: 'Does it cost anything?', a: [
        'No. Joining, posting your house, visiting and voting are all free. Some contests have an optional prize pot, and paying into it never changes votes, ranking or eligibility. See the [official rules](/rules).',
      ] },
      { id: 'roles', q: 'What’s the difference between a host and a visitor?', a: [
        'Hosts decorate and add their home to the map. Visitors explore the map, check in at porches and vote. You can be both, and your account works for either.',
      ] },
      { id: 'together', q: 'How does the whole community take part?', a: [
        'Every porch added, every check-in and every scorecard moves the whole neighborhood toward shared goals. When we hit one, everyone unlocks it together:',
      ], list: milestoneLines },
    ],
  },
  {
    key: 'host', label: 'Hosting and photos', icon: 'camera', items: [
      { id: 'post', q: 'How do I add my house?', a: [
        'Create a free host account, then [post your house](/submit) with at least one photo and your location. We take a quick look at each submission, and once it’s approved it shows up on the map.',
      ] },
      { id: 'photo-tips', q: 'Any tips for a great photo?', a: ['A few habits that make night photos glow:'], list: [
        'Shoot at dusk, about 20 to 40 minutes after sunset. There’s still some blue in the sky, so the house and the lights both show up.',
        'Stand across the street and hold your phone level, in landscape. Get the whole display in the frame.',
        'Turn off the flash and hold still, or rest your phone on something steady. Night mode on most phones helps a lot.',
        'Tap on the brightest lights to set focus and exposure, then slide the brightness down a little so bulbs don’t blow out.',
        'Add a close-up or two of your favorite details. Keep people’s faces and your house number out of the shot if you’d rather not share them.',
      ] },
      { id: 'video', q: 'Can I post a video or a music show?', a: [
        'Photos are what we support today. If your display is synced to music, add the “Synced to music” tag and the times you run the show so visitors can catch it in person.',
      ] },
      { id: 'edit', q: 'Can I change or remove my submission?', a: [
        'Yes, any time. Update your photos, details and lit-up hours from [your profile](/profile), or remove your submission there. Removing it takes it off the map right away.',
      ] },
      { id: 'ar-host', q: 'What are AR decorations?', a: [
        'Virtual props you add on top of your real display, like a ghost on the roof or a reindeer on the lawn. Open AR decorations from [your profile](/profile) or your house page, tap props to drop them on your house photo, drag them into place and save. You can also float a short greeting over the house.',
        'Each holiday has its own set of props, so a Christmas porch gets snowmen and reindeer, a Halloween porch gets ghosts and bats, and so on. Visitors standing out front point their phone at your house and see the props right where you put them. It works in the phone’s browser, no app needed.',
      ] },
      { id: 'what-counts', q: 'What kind of displays are welcome?', a: [
        'Family-friendly outdoor holiday decorations at a home you live at or have permission to use, visible from the street or sidewalk. We don’t approve ads, business branding, political signs, or anything unsafe or unkind.',
      ] },
    ],
  },
  {
    key: 'vote', label: 'Visiting and voting', icon: 'heart', items: [
      { id: 'how-vote', q: 'How does voting work?', a: [
        'Votes come from people who actually visited. Check in at the house, either with your phone’s location when you’re close by or by scanning the porch QR sign. Then you can love it and fill in a quick scorecard: creativity, lighting, story and sound.',
      ] },
      { id: 'why-checkin', q: 'Why do I have to check in?', a: [
        'It keeps voting fair and local. Anyone can like a photo from the couch; a check-in shows you were there. It also lets hosts see how many neighbors stopped by.',
      ] },
      { id: 'how-many', q: 'How many times can I vote?', a: [
        'Once per house. You can change your own vote at that house while voting is open, and you can vote for as many houses as you visit.',
      ] },
      { id: 'fair', q: 'What stops people from gaming the votes?', a: [
        'Votes need an in-person check-in, each account gets one vote per house, and we review unusual patterns. We remove votes from fake accounts, bots, vote trading or paid voting, and may remove entries that benefit from them. Details are in the [official rules](/rules).',
      ] },
      { id: 'ar-visit', q: 'How do I see a house’s AR decorations?', a: [
        'When a host added virtual props, their house page shows an AR decorations card. At the house, tap it and open your camera, line up the faint outline with the real house and tap “Pin it here”. The props stay on the house as you look around, and you can take a photo with them to share.',
      ] },
      { id: 'route', q: 'How do I plan a night out?', a: [
        'Use [Plan a route](/route) to pick a handful of houses near you in a sensible order, then hand the route to Google or Apple Maps. Start a [Caravan](/caravan) to go with friends and earn a squad bonus.',
      ] },
      { id: 'comments', q: 'Can I leave a comment?', a: [
        'Yes, after you check in. Keep it kind: comments are for cheering hosts on, and we filter or remove anything mean.',
      ] },
    ],
  },
  {
    key: 'safety', label: 'Safety and etiquette', icon: 'shield', items: [
      { id: 'visit-safe', q: 'Any tips for visiting safely?', a: ['Be the kind of visitor hosts love to see:'], list: [
        'Stay on the sidewalk or street, and never walk onto a lawn or porch unless the host invites you. Hosts are asked to put porch QR signs where you can scan them from the sidewalk.',
        'Park legally, keep driveways clear, and don’t idle with your headlights pointed at the house.',
        'Bring a flashlight or wear something reflective, and keep an eye on kids near the road.',
        'Visit during the host’s listed hours and keep the volume down late in the evening.',
        'Never use the app while driving. Let a passenger navigate, or pull over first.',
      ] },
      { id: 'host-safe', q: 'Any tips for hosts?', a: ['Keep it bright and safe for everyone:'], list: [
        'Use outdoor-rated lights and cords, don’t overload outlets, and keep walkways and sidewalks clear of cords and props.',
        'Put your QR sign somewhere visible from the sidewalk so people don’t need to step onto your property.',
        'Set lit-up hours you’re comfortable with. Visitors see them on your house page.',
      ] },
      { id: 'report', q: 'How do I report a problem?', a: [
        'Use the [contact form](/contact) for anything that feels unsafe, unkind or not allowed. We read every message.',
      ] },
    ],
  },
  {
    key: 'privacy', label: 'Privacy', icon: 'key', items: [
      { id: 'address', q: 'Will my exact address be public?', a: [
        'Never to the public. When you add your house you choose between an approximate pin, which puts visitors on the right block without pointing at your door, or your exact address. Even then, only signed-in members see it; everyone else sees the approximate pin.',
      ] },
      { id: 'visitor-location', q: 'Do you track my location when I check in?', a: [
        'We use your location only at the moment you check in, to confirm you’re near the house. We store how far away you were, not where you were standing.',
      ] },
      { id: 'data', q: 'Do you sell my information?', a: [
        'No. We don’t sell or rent your personal information. The [Privacy Policy](/privacy) explains what we keep and why, and you can ask us to delete your account any time.',
      ] },
    ],
  },
  {
    key: 'prizes', label: 'Prizes and rules', icon: 'trophy', items: [
      { id: 'win', q: 'How is the winner chosen?', a: [
        'By the community. The [official rules](/rules) describe exactly how verified votes are counted, how ties are handled and who is eligible, for each contest.',
      ] },
      { id: 'pot', q: 'Is there a prize?', a: [
        'Some contests have a prize pot. What’s in it, who can win and how it’s paid are set out in the [official rules](/rules), which are the final word. No purchase or payment is ever needed to enter or win.',
      ] },
      { id: 'eligible', q: 'Who can enter?', a: [
        'Eligibility, such as age and where you live, is listed in the [official rules](/rules). Check them before you post your house.',
      ] },
      { id: 'xp-cash', q: 'Are XP and badges worth money?', a: [
        'No. XP, levels and badges are just for fun and bragging rights. They never change anyone’s vote or ranking and have no cash value.',
      ] },
    ],
  },
  {
    key: 'xp', label: 'XP and rewards', icon: 'sparkles', items: [
      { id: 'earn', q: 'How do I earn XP?', a: [
        `You get ${SIGNUP_BONUS_XP} XP for joining, ${CHECKIN_XP} XP for your first check-in at each house and ${VOTE_XP} XP for each scorecard, plus bonuses for pitstops, porch critters and arriving with your caravan. Tap your XP in the menu to see every way to earn.`,
      ] },
      { id: 'milestones', q: 'What are community milestones?', a: [
        'Shared goals for the whole neighborhood. They’re on the home page with a progress bar, and when one is reached, everyone who took part gets the unlock.',
      ] },
    ],
  },
];

/** Answer text without link markup, for search. */
export const plainAnswer = (item: FaqItem) => [...item.a, ...(item.list ?? [])].join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
