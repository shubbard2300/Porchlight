import { z } from 'zod';

import { CONTRIBUTIONS, HOUSE_TAGS } from './houseOptions';

export { CONTRIBUTIONS, HOUSE_TAGS };

const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Tell us your name.').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
  referralCode: z.string().trim().toUpperCase().max(20).optional().or(z.literal('')),
  marketingOptIn: checkbox,
  terms: checkbox.refine((v) => v, 'Please accept the contest rules to continue.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const houseSchema = z.object({
  season: z.string().min(1, 'Pick a holiday.'),
  name: z.string().trim().min(2, 'Give your display a name people will remember.').max(60),
  address: z.string().trim().min(5, 'Add an address so visitors can find you.').max(120),
  neighborhood: z.string().trim().max(60).optional().or(z.literal('')),
  showExactAddress: checkbox,
  tags: z.array(z.enum(HOUSE_TAGS)).max(9).default([]),
  litFrom: z.string().trim().min(1).max(20),
  litUntil: z.string().trim().min(1).max(20),
  description: z.string().trim().min(10, 'Tell visitors what to look for (at least 10 characters).').max(600),
  contribution: z.coerce.number().refine((n) => (CONTRIBUTIONS as readonly number[]).includes(n), 'Pick a contribution amount.'),
  permission: checkbox.refine((v) => v, 'Please confirm you live here or have permission.'),
});

export const settingsSchema = z.object({
  notificationEmail: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  emailFrom: z.string().trim().max(120).optional().or(z.literal('')),
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
