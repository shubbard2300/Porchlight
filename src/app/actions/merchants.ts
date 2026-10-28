'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { FormState } from '@/lib/forms';
import { geocodeAddress } from '@/lib/geocode';
import { fieldErrors, merchantSchema } from '@/lib/validation';

/** Adds or edits a merchant pitstop. Without coordinates, the address is looked up on the map. */
export async function saveMerchant(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = merchantSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { id, lat, lng, ...d } = parsed.data;
  if ((lat === undefined) !== (lng === undefined)) return { errors: { lat: 'Fill in both latitude and longitude, or neither.' } };

  const existing = id ? await db.merchant.findUnique({ where: { id } }) : null;
  if (id && !existing) return { errors: { form: 'That pitstop no longer exists.' } };
  let spot = lat !== undefined && lng !== undefined ? { lat, lng } : null;
  if (!spot && existing && existing.address === d.address && existing.lat !== null) spot = { lat: existing.lat, lng: existing.lng! };
  if (!spot) spot = await geocodeAddress(d.address);

  const data = { ...d, hours: d.hours || null, website: d.website || null, lat: spot?.lat ?? null, lng: spot?.lng ?? null };
  const saved = existing ? await db.merchant.update({ where: { id: existing.id }, data }) : await db.merchant.create({ data });
  revalidatePath('/admin/merchants', 'layout');
  revalidatePath('/');
  redirect(`/admin/merchants/${saved.id}?saved=${spot ? 1 : 'nopin'}`);
}

export async function deleteMerchant(id: string) {
  await requireAdmin();
  await db.merchant.delete({ where: { id } }).catch(() => null);
  revalidatePath('/admin/merchants', 'layout');
  revalidatePath('/');
  redirect('/admin/merchants');
}
