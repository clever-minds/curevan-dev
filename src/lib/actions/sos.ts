'use server';

import { createSosAlert } from '@/lib/repos/alerts';

/** Raise an SOS (or missed check-in) for the current user. Never reports success unless the backend saved it. */
export async function raiseSosAction(data: {
  bookingId?: string;
  location?: { lat: number; lng: number };
  type?: 'sos' | 'missed-checkin';
}): Promise<{ success: boolean; error?: string }> {
  const result = await createSosAlert({ bookingId: data.bookingId, location: data.location, type: data.type ?? 'sos' });
  return { success: result.success, error: result.error };
}
