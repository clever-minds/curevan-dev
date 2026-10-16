// Appointment status codes (same list as the backend state machine) and how they are shown.
export const APPOINTMENT_STATUSES = [
  'pending_payment', 'searching_therapist', 'accepted_unpaid', 'confirmed', 'therapist_on_the_way', 'arrived',
  'in_progress', 'pcr_pending', 'completed', 'cancelled_by_patient', 'cancelled_by_therapist', 'cancelled_by_admin',
  'cancelled_unpaid', 'no_show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const LABELS: Record<AppointmentStatus, string> = {
  pending_payment: 'Payment pending',
  searching_therapist: 'Finding a therapist',
  accepted_unpaid: 'Therapist found - pay to confirm',
  confirmed: 'Confirmed',
  therapist_on_the_way: 'Therapist on the way',
  arrived: 'Therapist arrived',
  in_progress: 'Session in progress',
  pcr_pending: 'Awaiting session notes',
  completed: 'Completed',
  cancelled_by_patient: 'Cancelled by patient',
  cancelled_by_therapist: 'Cancelled by therapist',
  cancelled_by_admin: 'Cancelled',
  cancelled_unpaid: 'Cancelled (not paid)',
  no_show: 'No-show',
};

export const statusLabel = (status?: string | null): string =>
  (status && LABELS[status as AppointmentStatus]) || status || '';

export const isCancelled = (status?: string | null) => !!status && status.startsWith('cancelled');

/** Steps shown to the patient on the booking card. */
export const VISIT_STEPS: { status: AppointmentStatus; label: string }[] = [
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'therapist_on_the_way', label: 'On the way' },
  { status: 'arrived', label: 'Arrived' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
];

export const UPCOMING_STATUSES: AppointmentStatus[] = ['confirmed', 'therapist_on_the_way', 'arrived'];
export const LIVE_STATUSES: AppointmentStatus[] = ['confirmed', 'therapist_on_the_way', 'arrived', 'in_progress'];

/** No more changes can happen to these. */
export const isFinished = (status?: string | null) => status === 'completed' || status === 'no_show' || isCancelled(status);

const IST_OFFSET_MS = 5.5 * 3600 * 1000;

/** Start of the slot as a timestamp (the API stores date + "HH:MM" in Indian time). */
export function slotStartMs(date: unknown, time?: string | null): number | null {
  if (!date) return null;
  let ymd = String(date);
  if (ymd.length > 10) {                    // an ISO timestamp: read the calendar day in India
    const d = new Date(ymd);
    if (isNaN(d.getTime())) return null;
    ymd = new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
  }
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(String(time ?? '').trim());
  if (!m) return null;
  let h = Number(m[1]);
  if (m[3]) { h = h % 12; if (m[3].toUpperCase() === 'PM') h += 12; }
  const t = new Date(`${ymd}T${String(h).padStart(2, '0')}:${m[2]}:00+05:30`).getTime();
  return isNaN(t) ? null : t;
}

type AddressDetail = { fullAddress?: string; city?: string; state?: string; pincode?: string; lat?: number | string | null; lng?: number | string | null };

/** Google Maps directions link for the service address (coordinates when we have them, else the address text). */
export function mapsDirectionsUrl(detail?: AddressDetail | null): string | null {
  if (!detail) return null;
  const hasCoords = detail.lat != null && detail.lng != null && Number.isFinite(Number(detail.lat)) && Number.isFinite(Number(detail.lng));
  const destination = hasCoords
    ? `${Number(detail.lat)},${Number(detail.lng)}`
    : [detail.fullAddress, detail.city, detail.state, detail.pincode].filter(Boolean).join(', ');
  if (!destination) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
