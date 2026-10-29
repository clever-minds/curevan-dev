// The tools of the AI assistant (handoff pack P26). Each one is a thin wrapper over an existing backend API and is called with the
// signed-in user's OWN token, so the backend decides what that user may see. They never query the database and they return only the
// few fields the answer needs (no addresses, no phone numbers, no session-record text).
import { trackingUrl } from '@/lib/tracking';
import { isAffirmative, specialtyFor } from '@/ai/safety';

export type Http = (method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown) => Promise<any>;

export interface ToolContext {
  http: Http;
  userId: number;
  userMessage: string;               // what the user just wrote: a cancellation needs a clear "yes" in it
  now?: () => number;
}

export const FAILURE_LIMIT = 2;      // two failed tool attempts and the chat hands over to a person
const QUOTE_TTL_MS = 10 * 60 * 1000;
const quotes = new Map<string, { chargeInr: number; at: number }>();

const REASONS: { code: 'damaged' | 'defective' | 'wrong_item' | 'missing_part'; match: RegExp; photo: boolean }[] = [
  { code: 'damaged', match: /damag|broken|broke|crack|torn/i, photo: true },
  { code: 'defective', match: /defect|not\s+work|doesn'?t\s+work|faulty|stopped\s+working/i, photo: true },
  { code: 'wrong_item', match: /wrong|different|not\s+what\s+i\s+ordered/i, photo: false },
  { code: 'missing_part', match: /missing|incomplete|part/i, photo: false },
];

const orderNumberOf = (s: string) => { const m = /ORD-\d+/i.exec(String(s)); return m ? m[0].toUpperCase() : null; };
const day = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : null);

export function createTools(ctx: ToolContext) {
  let failures = 0;
  const trace: { name: string; ok: boolean }[] = [];
  const now = ctx.now ?? Date.now;

  /** Runs one tool: a thrown error counts as a failed attempt, and after FAILURE_LIMIT the model is told to hand over. */
  async function run<T>(name: string, fn: () => Promise<T>): Promise<T | { ok: false; error: string; handOver: boolean }> {
    try {
      const out = await fn();
      trace.push({ name, ok: true });
      return out;
    } catch (e: any) {
      failures += 1;
      trace.push({ name, ok: false });
      const error = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'The request failed';
      return { ok: false, error: String(error).slice(0, 200), handOver: failures >= FAILURE_LIMIT };
    }
  }

  return {
    get failures() { return failures; },
    get trace() { return trace; },
    get shouldHandOver() { return failures >= FAILURE_LIMIT; },

    /** Where is my order: status, courier status and tracking link of ONE of the user's own orders. */
    trackOrder: (input: { orderId: string }) => run('trackOrder', async () => {
      const wanted = orderNumberOf(input.orderId) ?? String(input.orderId).trim();
      const res = await ctx.http('GET', '/api/orders/my-orders');
      const mine: any[] = res?.data ?? [];                                 // the API returns only this user's orders
      const o = mine.find((x) => String(x.number).toUpperCase() === wanted.toUpperCase() || String(x.id) === wanted);
      if (!o) return { found: false, message: 'I could not find that order in your account.' };
      return {
        found: true, orderNumber: o.number, status: o.status, paymentStatus: o.paymentStatus, placedOn: day(o.createdAt), deliveredOn: day(o.deliveredAt),
        itemCount: (o.items ?? []).length, total: Number(o.total),
        trackingLink: o.awb ? trackingUrl(o.awb) : null,
      };
    }),

    /** My bookings and their status; the start code only for a booking that is confirmed, on the way or arrived (the API decides). */
    appointmentStatus: (input: { appointmentId?: string }) => run('appointmentStatus', async () => {
      const list = await ctx.http('GET', `/api/appointments/user/${ctx.userId}/patient`);
      let rows: any[] = Array.isArray(list) ? list : list?.data ?? [];
      if (input.appointmentId) rows = rows.filter((a) => String(a.id) === String(input.appointmentId));
      rows = rows.filter((a) => !/^(cancelled|proposal_|no_show)/.test(String(a.status))).slice(0, 5);
      const out: any[] = [];
      for (const a of rows) {
        const item: any = { id: a.id, date: day(a.date), time: a.time, status: a.status, therapist: a.therapist ?? a.therapistName ?? null, service: a.therapyType ?? null, paymentStatus: a.paymentStatus };
        if (['confirmed', 'therapist_on_the_way', 'arrived'].includes(a.status)) {
          try { const o = await ctx.http('GET', `/api/appointments/${a.id}/otp`); item.startCode = o?.data?.otp ?? null; }
          catch { item.startCode = null; item.startCodeNote = 'The start code opens 2 hours before the session.'; }
        }
        out.push(item);
      }
      let proposals: any[] = [];
      try {
        const p = await ctx.http('GET', '/api/clinical/followups/mine');
        proposals = (p?.data ?? []).filter((x: any) => ['proposed', 'changed'].includes(x.status) && x.apptStatus === 'proposed')
          .map((x: any) => ({ id: x.id, date: x.date, time: x.time, confirmBy: x.holdExpiresAt ?? null }));
      } catch { /* proposals are optional */ }
      return { bookings: out, pendingNextSession: proposals, note: proposals.length ? 'A recommended next session is waiting. To confirm it, open the Confirm & pay card on your dashboard.' : undefined };
    }),

    /** A plain-language summary of the user's own active treatment plan. No interpretation, no advice. */
    myProgress: () => run('myProgress', async () => {
      const plans = (await ctx.http('GET', '/api/clinical/plans'))?.data ?? [];
      const plan = plans.find((p: any) => p.status === 'active') ?? plans[0];
      if (!plan) return { hasPlan: false, message: 'Your therapist has not set up a treatment plan yet.' };
      const prog = (await ctx.http('GET', `/api/clinical/plans/${plan.id}/progress`))?.data;
      const lines: string[] = [];
      for (const m of (prog?.measures ?? []).filter((x: any) => (x.series ?? []).length >= 2).slice(0, 3)) {
        const verb = m.status === 'improving' ? 'improved' : m.status === 'worsening' ? 'went down' : 'stayed the same';
        lines.push(`${m.name} ${verb}: from ${m.baseline} to ${m.latest}${m.unit ? ' ' + m.unit : ''}`);
      }
      return {
        hasPlan: true, condition: prog?.plan?.condition ?? plan.condition, sessionsDone: prog?.sessionsDone, plannedSessions: prog?.plannedSessions ?? null,
        goals: (prog?.goals ?? []).slice(0, 4).map((g: any) => ({ goal: g.description, percentTowardTarget: g.percentTowardTarget })),
        changes: lines, note: 'This is a summary of your recorded results, not medical advice. Please ask your therapist about what it means.',
      };
    }),

    /** Which kind of therapist fits the symptoms (a fixed table) and, with a location, nearby approved therapists. */
    findSpecialty: (input: { symptoms: string; lat?: number; lng?: number }) => run('findSpecialty', async () => {
      const hit = specialtyFor(input.symptoms);
      if (!hit) return { matched: false, message: 'I could not match that to a therapy. Please describe it a little more, or ask for a person.' };
      let therapists: any[] = [];
      if (typeof input.lat === 'number' && typeof input.lng === 'number') {
        const res = await ctx.http('GET', `/api/therapists/listnearby?lat=${input.lat}&lng=${input.lng}`);
        therapists = ((res?.data ?? res) as any[]).slice?.(0, 5).map((t: any) => ({ name: t.name, qualification: t.qualification ?? null, distanceKm: t.distance ?? null })) ?? [];
      }
      return { matched: true, specialty: hit.specialty, why: hit.note, therapists, findLink: '/therapists', note: 'This only suggests the kind of therapist. It is not a diagnosis.' };
    }),

    /** Start a return for a delivered order, with the same rules as the website (reason list, photo, window). */
    requestReturn: (input: { orderId: string; reason: string }) => run('requestReturn', async () => {
      const wanted = orderNumberOf(input.orderId) ?? String(input.orderId).trim();
      const mine: any[] = (await ctx.http('GET', '/api/orders/my-orders'))?.data ?? [];
      const o = mine.find((x) => String(x.number).toUpperCase() === wanted.toUpperCase() || String(x.id) === wanted);
      if (!o) return { done: false, message: 'I could not find that order in your account.' };
      const reason = REASONS.find((r) => r.match.test(input.reason));
      if (!reason) return { done: false, message: 'Please tell me the reason: damaged, not working, wrong item, or a missing part.' };
      if (reason.photo) return { done: false, needsPhoto: true, message: 'A photo of the problem is needed for this reason. Please send the return request from Orders in your dashboard.', link: '/dashboard/patient/orders' };
      const items: any[] = o.items ?? [];
      if (items.length !== 1 || !items[0].id) return { done: false, message: 'This order has several items. Please choose which to return from Orders in your dashboard.', link: '/dashboard/patient/orders' };
      const res = await ctx.http('POST', `/api/orders/${o.id}/return`, { reason: reason.code, note: String(input.reason).slice(0, 300), items: [{ order_item_id: items[0].id, quantity: Number(items[0].qty) || 1 }] });
      return { done: true, returnId: res?.returnId ?? null, message: 'Your return request was sent. We will tell you when it is approved.' };
    }),

    /**
     * Cancel a booking. Without `confirm` it only returns what cancelling costs. With `confirm` it cancels only if the user's
     * own latest message is a clear "yes" and the charge was shown first (the model cannot confirm by itself).
     */
    cancelBooking: (input: { appointmentId: string; confirm?: boolean }) => run('cancelBooking', async () => {
      const key = `${ctx.userId}:${input.appointmentId}`;
      if (!input.confirm) {
        const quote = (await ctx.http('GET', `/api/appointments/${input.appointmentId}/cancel-quote`))?.data ?? {};
        quotes.set(key, { chargeInr: Number(quote.chargeInr ?? 0), at: now() });
        return { cancelled: false, awaitingConfirmation: true, chargeInr: Number(quote.chargeInr ?? 0), refundInr: Number(quote.refundInr ?? 0), message: 'Please confirm: reply "yes" to cancel this booking.' };
      }
      const shown = quotes.get(key);
      if (!shown || now() - shown.at > QUOTE_TTL_MS) return { cancelled: false, awaitingConfirmation: true, message: 'I need to show you the cancellation charge first. Ask me to cancel again.' };
      if (!isAffirmative(ctx.userMessage)) return { cancelled: false, awaitingConfirmation: true, message: 'I will cancel only after you reply "yes".' };
      const res = await ctx.http('POST', `/api/appointments/${input.appointmentId}/cancel`, { acceptedChargeInr: shown.chargeInr });
      quotes.delete(key);
      return { cancelled: true, refundInr: Number(res?.quote?.refundInr ?? 0), chargeInr: Number(res?.quote?.chargeInr ?? 0), message: 'Your booking is cancelled.' };
    }),
  };
}

export type CurevanTools = ReturnType<typeof createTools>;

/** Test helper: forget remembered quotes. */
export const _resetQuotes = () => quotes.clear();
