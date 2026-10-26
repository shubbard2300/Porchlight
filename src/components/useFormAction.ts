'use client';

import { useActionState } from 'react';
import type { FormState } from '@/lib/forms';

type Echo = Record<string, string[]>;
const SECRET = new Set(['password', 'confirm']);

/**
 * useActionState for our server actions, plus the values that were just submitted.
 * React resets a form after its action runs, so fields read their defaults from here
 * to keep what the person typed when validation fails. Passwords are never echoed back.
 */
export function useFormAction(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, formAction] = useActionState(async (prev: (FormState & { values?: Echo }) | undefined, fd: FormData) => {
    const values: Echo = {};
    fd.forEach((v, k) => { if (typeof v === 'string' && !SECRET.has(k)) (values[k] ??= []).push(v); });
    const result = await action(prev, fd);
    return { ...result, values };
  }, undefined);
  const values = state?.values;
  return {
    state,
    formAction,
    errors: state?.errors ?? {},
    /** Last submitted text for a field, else the fallback. */
    value: (name: string, fallback = '') => values?.[name]?.[0] ?? fallback,
    /** Whether a checkbox or radio was submitted checked, else the fallback. */
    checked: (name: string, fallback = false, option = 'on') => (values ? (values[name] ?? []).includes(option) : fallback),
  };
}
