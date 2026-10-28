import type { Icon3DName } from '@/components/Icon3D';
import { BOOST_HOURS } from './pitstops';

export const SIGNUP_BONUS_XP = 100;
export const APPROVAL_XP = 100;
/** First check-in at each house. */
export const CHECKIN_XP = 20;
/** First scorecard at each house. */
export const VOTE_XP = 10;
/** First scan at each merchant's counter QR. */
export const PITSTOP_XP = 15;
/** Checking in where a squadmate checked in within this window earns the squad bonus. */
export const SQUAD_WINDOW_MIN = 30;
export const SQUAD_BONUS_XP = 5;
/** Catching the AR critter at a house, once per house. */
export const AR_CATCH_XP = 15;

/** Every way to earn XP, in the order the XP guide lists them. */
export const XP_SOURCES: { xp: number; icon: Icon3DName; title: string; detail: string }[] = [
  { xp: SIGNUP_BONUS_XP, icon: 'party', title: 'Join Porchlight', detail: 'A welcome bonus once you confirm your email.' },
  { xp: CHECKIN_XP, icon: 'pin', title: 'Check in at a house', detail: 'Your first check-in at each porch, by location or the porch QR sign.' },
  { xp: VOTE_XP, icon: 'star', title: 'Fill in a scorecard', detail: 'Your first scorecard at each house you checked in at.' },
  { xp: PITSTOP_XP, icon: 'gift', title: 'Scan a pitstop QR', detail: `Your first scan at each sponsor's counter. It also turns on ${BOOST_HOURS} hours of double XP.` },
  { xp: AR_CATCH_XP, icon: 'ghost', title: 'Catch a porch critter', detail: 'After checking in, find the AR critter hiding around you with your camera. One per house.' },
  { xp: SQUAD_BONUS_XP, icon: 'people', title: 'Arrive with your caravan', detail: `Bonus when a squadmate checked in at the same porch within ${SQUAD_WINDOW_MIN} minutes.` },
  { xp: APPROVAL_XP, icon: 'house', title: 'Get your house approved', detail: 'For hosts, once your display goes live on the map.' },
];
