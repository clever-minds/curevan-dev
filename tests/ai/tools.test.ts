// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { _resetQuotes, createTools, FAILURE_LIMIT, type Http } from '@/ai/tools';

type Call = { method: string; path: string; body?: any };

/** A fake backend: it records every call and answers from a table, like the API of a signed-in user would. */
function fakeBackend(routes: Record<string, any>) {
  const calls: Call[] = [];
  const http: Http = async (method, path, body) => {
    calls.push({ method, path, body });
    const key = `${method} ${path}`;
    const hit = routes[key] ?? Object.entries(routes).find(([k]) => key.startsWith(k.replace(/\*$/, '')) && k.endsWith('*'))?.[1];
    if (hit === undefined) throw Object.assign(new Error('Not found'), { response: { data: { error: 'Not found' } } });
    if (hit instanceof Error) throw hit;
    return typeof hit === 'function' ? hit(body) : hit;
  };
  return { http, calls };
}

const ORDERS = { data: [
  { id: 11, number: 'ORD-11', status: 'in_transit', paymentStatus: 'Paid', createdAt: '2026-10-10T10:00:00Z', deliveredAt: null, total: '1180', awb: 'AWB77', items: [{ id: 5, name: 'Band', qty: 2 }], shippingAddress: { full_address: 'SECRET STREET 1', phone: '9999999999' } },
  { id: 12, number: 'ORD-12', status: 'delivered', paymentStatus: 'Paid', createdAt: '2026-10-01T10:00:00Z', deliveredAt: '2026-10-05T10:00:00Z', total: '500', awb: null, items: [{ id: 6, name: 'Ball', qty: 1 }, { id: 7, name: 'Strap', qty: 1 }] },
] };

beforeEach(() => _resetQuotes());

describe('trackOrder', () => {
  it('returns the status and tracking link of an own order, and no address or phone', async () => {
    const { http } = fakeBackend({ 'GET /api/orders/my-orders': ORDERS });
    const t = createTools({ http, userId: 1, userMessage: 'where is ORD-11' });
    const out: any = await t.trackOrder({ orderId: 'where is ORD-11?' });
    expect(out.found).toBe(true);
    expect(out.status).toBe('in_transit');
    expect(out.trackingLink).toBe('https://shiprocket.co/tracking/AWB77');
    expect(JSON.stringify(out)).not.toMatch(/SECRET|9999999999/);
  });
  it("refuses an order that is not in the user's own list (the API returns only own orders)", async () => {
    const { http } = fakeBackend({ 'GET /api/orders/my-orders': ORDERS });
    const t = createTools({ http, userId: 1, userMessage: 'x' });
    const out: any = await t.trackOrder({ orderId: 'ORD-999' });
    expect(out.found).toBe(false);
    expect(t.failures).toBe(0);              // "not found" is an answer, not a failed attempt
  });
});

describe('appointmentStatus', () => {
  const list = { data: [
    { id: 1, date: '2026-10-20', time: '10:00', status: 'confirmed', therapist: 'Dr A', therapyType: 'Physio', paymentStatus: 'Paid' },
    { id: 2, date: '2026-10-25', time: '10:00', status: 'pending_payment', therapist: 'Dr A', therapyType: 'Physio', paymentStatus: 'Pending' },
    { id: 3, date: '2026-10-01', time: '10:00', status: 'cancelled_by_patient', therapist: 'Dr A' },
  ] };
  it('asks for the start code only of a confirmed / on-the-way / arrived booking', async () => {
    const { http, calls } = fakeBackend({ 'GET /api/appointments/user/1/patient': list, 'GET /api/appointments/1/otp': { data: { otp: '4821' } }, 'GET /api/clinical/followups/mine': { data: [] } });
    const out: any = await createTools({ http, userId: 1, userMessage: 'x' }).appointmentStatus({});
    expect(out.bookings.find((b: any) => b.id === 1).startCode).toBe('4821');
    expect(out.bookings.find((b: any) => b.id === 2).startCode).toBeUndefined();
    expect(out.bookings.some((b: any) => b.id === 3)).toBe(false);          // cancelled ones are left out
    expect(calls.filter((c) => c.path.endsWith('/otp')).map((c) => c.path)).toEqual(['/api/appointments/1/otp']);
  });
  it('does not show a code when the API refuses it (too early)', async () => {
    const { http } = fakeBackend({ 'GET /api/appointments/user/1/patient': list, 'GET /api/appointments/1/otp': Object.assign(new Error('403'), { response: { data: { error: 'later' } } }), 'GET /api/clinical/followups/mine': { data: [] } });
    const t = createTools({ http, userId: 1, userMessage: 'x' });
    const out: any = await t.appointmentStatus({});
    expect(out.bookings[0].startCode).toBeNull();
    expect(out.bookings[0].startCodeNote).toMatch(/2 hours/);
    expect(t.failures).toBe(0);
  });
  it('lists a pending next-session proposal and sends the user to the Confirm flow (it never confirms by itself)', async () => {
    const { http, calls } = fakeBackend({ 'GET /api/appointments/user/1/patient': { data: [] }, 'GET /api/clinical/followups/mine': { data: [{ id: 9, status: 'proposed', apptStatus: 'proposed', date: '2026-10-22', time: '16:00', holdExpiresAt: '2026-10-21T10:00:00Z' }] } });
    const out: any = await createTools({ http, userId: 1, userMessage: 'x' }).appointmentStatus({});
    expect(out.pendingNextSession).toHaveLength(1);
    expect(out.note).toMatch(/Confirm & pay/);
    expect(calls.some((c) => c.method !== 'GET')).toBe(false);
  });
});

describe('myProgress', () => {
  it('summarises goals and the change of the measures in plain words, without advice', async () => {
    const { http } = fakeBackend({
      'GET /api/clinical/plans': { data: [{ id: 3, status: 'active', condition: 'Post-stroke mobility' }] },
      'GET /api/clinical/plans/3/progress': { data: { plan: { condition: 'Post-stroke mobility' }, sessionsDone: 3, plannedSessions: 12, goals: [{ description: 'Walk indoors', percentTowardTarget: 70 }], measures: [{ name: 'Berg Balance Scale', status: 'improving', baseline: 30, latest: 44, unit: 'points', series: [{}, {}, {}] }, { name: 'Pain', status: 'improving', baseline: 8, latest: 8, series: [{}] }] } },
    });
    const out: any = await createTools({ http, userId: 1, userMessage: 'x' }).myProgress();
    expect(out.hasPlan).toBe(true);
    expect(out.changes).toEqual(['Berg Balance Scale improved: from 30 to 44 points']);          // a measure with one point is not described
    expect(out.goals[0]).toEqual({ goal: 'Walk indoors', percentTowardTarget: 70 });
    expect(out.note).toMatch(/not medical advice/i);
  });
  it('says so when there is no plan yet', async () => {
    const { http } = fakeBackend({ 'GET /api/clinical/plans': { data: [] } });
    expect(((await createTools({ http, userId: 1, userMessage: 'x' }).myProgress()) as any).hasPlan).toBe(false);
  });
});

describe('findSpecialty', () => {
  it('maps the symptom and lists nearby therapists only when a location is given', async () => {
    const { http, calls } = fakeBackend({ 'GET /api/therapists/listnearby*': { data: [{ name: 'Dr N', qualification: 'BPT', distance: 2.1 }] } });
    const t = createTools({ http, userId: 1, userMessage: 'x' });
    const a: any = await t.findSpecialty({ symptoms: 'knee pain' });
    expect(a.specialty).toBe('Musculoskeletal physiotherapy');
    expect(a.therapists).toEqual([]);
    expect(calls).toHaveLength(0);
    const b: any = await t.findSpecialty({ symptoms: 'stroke', lat: 22.3, lng: 73.1 });
    expect(b.specialty).toBe('Neuro physiotherapy');
    expect(b.therapists[0].name).toBe('Dr N');
    expect(calls[0].path).toContain('lat=22.3');
  });
});

describe('requestReturn', () => {
  it('sends the return with the pack reason code for a single-item order', async () => {
    const { http, calls } = fakeBackend({
      'GET /api/orders/my-orders': { data: [{ id: 20, number: 'ORD-20', items: [{ id: 8, qty: 2 }] }] },
      'POST /api/orders/20/return': { returnId: 77 },
    });
    const out: any = await createTools({ http, userId: 1, userMessage: 'x' }).requestReturn({ orderId: 'ORD-20', reason: 'it is the wrong item' });
    expect(out.done).toBe(true);
    expect(calls[1].body).toMatchObject({ reason: 'wrong_item', items: [{ order_item_id: 8, quantity: 2 }] });
  });
  it('does not send a damaged or defective return: those need a photo', async () => {
    const { http, calls } = fakeBackend({ 'GET /api/orders/my-orders': { data: [{ id: 20, number: 'ORD-20', items: [{ id: 8, qty: 1 }] }] } });
    const out: any = await createTools({ http, userId: 1, userMessage: 'x' }).requestReturn({ orderId: 'ORD-20', reason: 'it arrived damaged' });
    expect(out.needsPhoto).toBe(true);
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });
  it('asks which item when the order has several, and refuses an unknown order', async () => {
    const { http } = fakeBackend({ 'GET /api/orders/my-orders': ORDERS });
    const t = createTools({ http, userId: 1, userMessage: 'x' });
    expect(((await t.requestReturn({ orderId: 'ORD-12', reason: 'wrong item' })) as any).done).toBe(false);
    expect(((await t.requestReturn({ orderId: 'ORD-404', reason: 'wrong item' })) as any).message).toMatch(/could not find/);
  });
});

describe('cancelBooking (P26: "Cancel my booking" shows the charge and waits)', () => {
  const routes = (calls?: any) => ({
    'GET /api/appointments/5/cancel-quote': { data: { chargeInr: 750, refundInr: 750 } },
    'POST /api/appointments/5/cancel': { quote: { chargeInr: 750, refundInr: 750 } },
  });
  it('without confirm it only shows the charge and cancels nothing', async () => {
    const { http, calls } = fakeBackend(routes());
    const out: any = await createTools({ http, userId: 1, userMessage: 'cancel my booking' }).cancelBooking({ appointmentId: '5' });
    expect(out.awaitingConfirmation).toBe(true);
    expect(out.chargeInr).toBe(750);
    expect(calls.map((c) => c.method)).toEqual(['GET']);
  });
  it('the model cannot confirm by itself: confirm=true with a user message that is not a yes does nothing', async () => {
    const { http, calls } = fakeBackend(routes());
    const t = createTools({ http, userId: 1, userMessage: 'how much will it cost?' });
    await t.cancelBooking({ appointmentId: '5' });
    const out: any = await t.cancelBooking({ appointmentId: '5', confirm: true });
    expect(out.cancelled).toBe(false);
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });
  it('confirm=true without the charge having been shown first does nothing', async () => {
    const { http, calls } = fakeBackend(routes());
    const out: any = await createTools({ http, userId: 1, userMessage: 'yes' }).cancelBooking({ appointmentId: '5', confirm: true });
    expect(out.cancelled).toBe(false);
    expect(calls).toHaveLength(0);
  });
  it('after the charge was shown and the user said yes, it cancels with that exact charge accepted', async () => {
    const { http, calls } = fakeBackend(routes());
    await createTools({ http, userId: 1, userMessage: 'cancel it' }).cancelBooking({ appointmentId: '5' });
    const out: any = await createTools({ http, userId: 1, userMessage: 'Yes, please cancel' }).cancelBooking({ appointmentId: '5', confirm: true });
    expect(out.cancelled).toBe(true);
    expect(calls[calls.length - 1]).toMatchObject({ method: 'POST', path: '/api/appointments/5/cancel', body: { acceptedChargeInr: 750 } });
  });
  it("the charge shown to one user cannot be used to cancel for another, and it expires", async () => {
    const { http, calls } = fakeBackend(routes());
    await createTools({ http, userId: 1, userMessage: 'cancel it' }).cancelBooking({ appointmentId: '5' });
    const other: any = await createTools({ http, userId: 2, userMessage: 'yes' }).cancelBooking({ appointmentId: '5', confirm: true });
    expect(other.cancelled).toBe(false);
    let clock = 0;
    const t = createTools({ http, userId: 3, userMessage: 'yes', now: () => clock });
    await t.cancelBooking({ appointmentId: '5' });
    clock += 11 * 60 * 1000;
    expect(((await t.cancelBooking({ appointmentId: '5', confirm: true })) as any).cancelled).toBe(false);
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });
});

describe('failed tool attempts', () => {
  it(`after ${FAILURE_LIMIT} failures the tools say hand over and shouldHandOver is true`, async () => {
    const { http } = fakeBackend({});            // every call fails
    const t = createTools({ http, userId: 1, userMessage: 'x' });
    const a: any = await t.trackOrder({ orderId: 'ORD-1' });
    expect(a.ok).toBe(false); expect(a.handOver).toBe(false); expect(t.shouldHandOver).toBe(false);
    const b: any = await t.myProgress();
    expect(b.handOver).toBe(true); expect(t.shouldHandOver).toBe(true);
    expect(t.trace.map((x) => x.ok)).toEqual([false, false]);
  });
});
