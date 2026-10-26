import type { FieldErrors } from './validation';

export type FormState = { errors?: FieldErrors; message?: string } | undefined;

/** Only allow same-site relative redirects after login. */
export function safeNext(v: FormDataEntryValue | null | undefined): string | null {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : null;
}
