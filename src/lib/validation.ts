import { z } from 'zod';

import { CONTACT_TOPICS } from './contact';
import { CONTRIBUTIONS, HOUSE_TAGS } from './houseOptions';
import { isKind } from './visits';
import { PITSTOP_CATEGORIES } from './pitstops';
import { MAX_SPONSOR_DOLLARS } from './pot';

export { CONTRIBUTIONS, HOUSE_TAGS };

const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());

export const RESERVED_USERNAMES = ['admin', 'administrator', 'porchlight', 'support', 'help', 'moderator', 'staff'];

const email = z.string().trim().toLowerCase().email('Enter a valid email address.');
const optional = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`).optional().or(z.literal(''));

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, 'Use 3 to 20 letters, numbers or underscores.')
  .refine((u) => !RESERVED_USERNAMES.includes(u), 'That username is reserved. Try another.');

export const passwordSchema = z.string().min(8, 'Use at least 8 characters.').max(200, 'Keep it under 200 characters.');

/** Sign-up asks only for an email and password. A username is made from the email and can be changed on the profile. */
export const joinSchema = z.object({
  accountType: z.enum(['VIEWER', 'HOST']),
  email,
  password: passwordSchema,
  propertyAddress: optional(120),
  referralCode: z.string().trim().toUpperCase().max(20).optional().or(z.literal('')),
  marketingOptIn: checkbox,
});

export const emailOnlySchema = z.object({ email });

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password.') });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'The two passwords don\u2019t match.' });

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Tell us your name.').max(60, 'Keep this under 60 characters.'),
  email,
  topic: z.enum(CONTACT_TOPICS, 'Pick a topic.'),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters).').max(2000, 'Keep it under 2,000 characters.'),
  /** Honeypot: hidden from people, so anything typed here came from a bot. */
  website: z.string().optional(),
});

export const profileSchema = z.object({
  username: usernameSchema,
  displayName: optional(60),
  hometown: optional(60),
  bio: optional(500),
  marketingOptIn: checkbox,
});

export const hostProfileSchema = z.object({
  propertyAddress: optional(120),
  neighborhood: optional(60),
  hostSeason: optional(40),
  decorationTheme: optional(80),
  propertyDetails: optional(1000),
});

export const houseSchema = z.object({
  season: z.string().min(1, 'Pick a holiday.'),
  name: z.string().trim().min(2, 'Give your display a name people will remember.').max(60),
  address: z.string().trim().min(5, 'Add an address so visitors can find you.').max(120),
  neighborhood: z.string().trim().max(60).optional().or(z.literal('')),
  showExactAddress: checkbox,
  tags: z.array(z.enum(HOUSE_TAGS)).max(9).default([]),
  bracket: z.string({ error: 'Pick a bracket.' }).min(1, 'Pick a bracket.'),
  litFrom: z.string().trim().min(1).max(20),
  litUntil: z.string().trim().min(1).max(20),
  description: z.string().trim().min(10, 'Tell visitors what to look for (at least 10 characters).').max(600),
  contribution: z.coerce.number().refine((n) => (CONTRIBUTIONS as readonly number[]).includes(n), 'Pick a contribution amount.'),
  permission: checkbox.refine((v) => v, 'Please confirm you live here or have permission.'),
});

export const MAX_HOUSE_PHOTOS = 6;

const blankToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v);
const coord = (limit: number) => z.preprocess(blankToUndefined, z.coerce.number().min(-limit).max(limit).optional());

/** Location and size that come with a house photo. A position needs both coordinates and where it came from. */
export const photoMetaSchema = z
  .object({
    houseId: z.preprocess(blankToUndefined, z.string().max(40).optional()),
    width: z.coerce.number().int().min(50).max(4096),
    height: z.coerce.number().int().min(50).max(4096),
    lat: coord(90),
    lng: coord(180),
    locationSource: z.preprocess(blankToUndefined, z.enum(['photo', 'device']).optional()),
    takenAt: z.preprocess(blankToUndefined, z.coerce.date().optional()),
  })
  .refine((d) => (d.lat === undefined) === (d.lng === undefined) && (d.lat === undefined) === (d.locationSource === undefined), {
    message: 'Location is incomplete.',
    path: ['lat'],
  })
  .refine((d) => !(d.lat === 0 && d.lng === 0), { message: 'Location is not valid.', path: ['lat'] });

export const photoLocationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const settingsSchema = z.object({
  notificationEmail: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  emailFrom: z.string().trim().max(120).optional().or(z.literal('')),
  replyTo: z.string().trim().toLowerCase().email('Enter a valid email address.').optional().or(z.literal('')),
});

export type FieldErrors = Record<string, string | undefined>;

export function fieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? 'form');
    out[k] ??= issue.message;
  }
  return out;
}

const score = z.coerce.number().int().min(1, 'Pick 1 to 10.').max(10, 'Pick 1 to 10.');

export const voteSchema = z.object({
  houseId: z.string().min(1),
  liked: z.enum(['yes', 'no']).transform((v) => v === 'yes'),
  creativity: score,
  lighting: score,
  storytelling: score,
  sound: score,
  comment: z
    .string()
    .trim()
    .max(280, 'Keep it under 280 characters.')
    .refine(isKind, 'Comments are for cheering hosts on. Try saying what you loved.')
    .optional()
    .or(z.literal('')),
});

const optionalCoord = (min: number, max: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().min(min, 'Out of range.').max(max, 'Out of range.').optional());

export const merchantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, 'Give the business a name.').max(60),
  category: z.enum(PITSTOP_CATEGORIES.map((c) => c.key) as [string, ...string[]], 'Pick a category.'),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD'], 'Pick a tier.'),
  address: z.string().trim().min(5, 'Add the street address.').max(120),
  offer: z.string().trim().min(5, 'Say what visitors get, e.g. “20% off hot cocoa”.').max(120),
  hours: z.string().trim().max(60).optional().or(z.literal('')),
  website: z.string().trim().url('Use a full link starting with https://').max(200).optional().or(z.literal('')),
  lat: optionalCoord(-90, 90),
  lng: optionalCoord(-180, 180),
  active: checkbox,
});

export const blockSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, 'Give the block a name.').max(60),
  blurb: z.string().trim().min(10, 'Add a sentence on why it’s worth the trip.').max(240),
  address: z.string().trim().min(5, 'Add a street or intersection to center the zone on.').max(120),
  radiusM: z.coerce.number().int('Use whole meters.').min(100, 'Use at least 100 m.').max(2000, 'Keep it under 2,000 m.'),
  lat: optionalCoord(-90, 90),
  lng: optionalCoord(-180, 180),
  featured: checkbox,
  active: checkbox,
});

export const sponsorSchema = z.object({
  season: z.string().min(1, 'Pick a contest.'),
  amount: z.coerce.number('Enter an amount.').min(1, 'Enter at least $1.').max(MAX_SPONSOR_DOLLARS, `Keep it under $${MAX_SPONSOR_DOLLARS.toLocaleString('en-US')}.`),
  merchantId: z.string().optional().or(z.literal('')),
  sponsorName: z.string().trim().max(80, 'Keep this under 80 characters.').optional().or(z.literal('')),
});
