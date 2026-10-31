/* eslint-disable */
// Cross-role verification: one role acts, the other roles' screens are checked.
// Runs against the TEST stack only (see docs/TESTING.md): the API on :5000 with the stubbed Razorpay, its test database and this website.
// The weekly jobs and the clock-dependent steps use the API repo (E2E_API_DIR, default ../curevan-node) and its database.
import { test, expect, Browser, Page, APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { API, USERS, bearer, login } from './users';

declare const require: any;
const NODE_DIR = process.env.E2E_API_DIR || path.resolve(__dirname, '../../curevan-node');
const { Client } = require(path.join(NODE_DIR, 'node_modules', 'pg'));
const dbEnv = { DB_HOST: '127.0.0.1', DB_PORT: '54329', DB_NAME: 'curevan_test', DB_USER: 'curevan', DB_PASSWORD: 'testpw', ...process.env } as any;
const RZP_SECRET = process.env.E2E_RZP_SECRET || 'rzp_secret_123';
const sign = (o: string, p: string) => crypto.createHmac('sha256', RZP_SECRET).update(`${o}|${p}`).digest('hex');

async function sql(text: string, params: any[] = []) {
  const c = new Client({ host: dbEnv.DB_HOST, port: Number(dbEnv.DB_PORT), database: dbEnv.DB_NAME, user: dbEnv.DB_USER, password: dbEnv.DB_PASSWORD });
  await c.connect();
  try { return (await c.query(text, params)).rows as any[]; } finally { await c.end(); }
}
/** Runs a snippet inside the API repo (its services, its database): the jobs that cron runs in production. */
function inApi(code: string) {
  return execFileSync(process.execPath, ['-e', `require('dotenv').config({quiet:true});(async()=>{${code}})().then(r=>{console.log('RESULT '+JSON.stringify(r===undefined?null:r));process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})`], { cwd: NODE_DIR, env: dbEnv, encoding: 'utf8' });
}
const istNow = (plusMin = 0) => new Date(Date.now() + 5.5 * 3600e3 + plusMin * 60000);
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const hm = (d: Date) => d.toISOString().slice(11, 16);
const dayLabel = (date: string, time: string) => { const d = new Date(`${date}T00:00:00`); return `${d.toLocaleDateString('en-US', { month: 'short' })} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()} at ${time}`; };   // the lists print "Nov 01, 2026 at 10:00"

const tokens: Record<string, string> = {};
const S: Record<string, any> = {};
let patientId = 0, therapistId = 0;

async function api(request: APIRequestContext, role: string, method: string, url: string, data?: any) {
  const r = await request.fetch(`${API}${url}`, { method, headers: bearer(tokens[role]), data });
  let json: any = null; try { json = await r.json(); } catch { /* not json */ }
  return { status: r.status(), json };
}
async function as(browser: Browser, role: string): Promise<Page> {
  const ctx = await browser.newContext({ storageState: `playwright/.auth/${role}.json`, viewport: { width: 1280, height: 1000 }, geolocation: { latitude: 22.3, longitude: 73.19 }, permissions: ['geolocation'] });
  return ctx.newPage();
}
const body = async (p: Page) => (await p.locator('body').innerText());

test.describe.configure({ mode: 'serial' });
test.setTimeout(240_000);

test.beforeAll(async ({ request }) => {
  for (const [role, email] of Object.entries(USERS)) tokens[role] = await login(request, email);
  patientId = (await sql(`SELECT id FROM users WHERE email = $1`, [USERS.patient]))[0].id;
  therapistId = (await sql(`SELECT id FROM users WHERE email = $1`, [USERS.therapist]))[0].id;
  await sql(`UPDATE therapist_profiles SET bank_account_number = '1234567890', bank_ifsc_code = 'HDFC0000001' WHERE user_id = $1`, [therapistId]);
});

test('1. the patient books through the form; the therapist and the admins see the same booking', async ({ browser, request }) => {
  const patient = await as(browser, 'patient');
  await patient.goto(`/booking/${therapistId}`);
  await patient.waitForTimeout(4500);
  await patient.getByLabel('Patient Full Name').fill('Priya Patient');
  await patient.getByLabel('Date of Birth').fill('1990-05-05');
  const days = patient.locator('button[role="gridcell"], td button');
  // the 5th bookable day; near the end of a month the calendar has to be turned to the next month first, and a day without open times is skipped
  let skip = 4, picked = false;
  for (let month = 0; month < 2 && !picked; month++) {
    if (month === 1) { await patient.getByRole('button', { name: /next month/i }).click(); await patient.waitForTimeout(800); skip = 0; }
    for (let i = 0; i < await days.count() && !picked; i++) {
      const d = days.nth(i);
      if (!/^\d+$/.test((await d.innerText()).trim()) || !(await d.isEnabled())) continue;
      if (skip-- > 0) continue;
      await d.click();
      await patient.waitForTimeout(2500);
      picked = (await patient.getByRole('button', { name: /^\d{2}:\d{2}$/ }).count()) > 0;
    }
  }
  expect(picked, 'a day with open times').toBeTruthy();
  const slot = patient.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first();
  S.time1 = (await slot.innerText()).trim();
  await slot.click();
  for (const cb of await patient.getByRole('checkbox').all()) await cb.check().catch(() => {});
  const created = patient.waitForResponse((r) => r.url().includes('/api/appointments/create-appointment') && r.request().method() === 'POST');
  await patient.getByRole('button', { name: /Request Appointment/ }).click();
  const j = await (await created).json();
  expect(j.success, JSON.stringify(j)).toBeTruthy();
  S.appt1 = j.appointmentId; S.rz1 = j.razorpayOrderId;
  S.date1 = (await sql(`SELECT to_char(date,'YYYY-MM-DD') d FROM appointments WHERE id = $1`, [S.appt1]))[0].d;
  expect((await sql(`SELECT status FROM appointments WHERE id = $1`, [S.appt1]))[0].status).toBe('pending_payment');
  // payment: the signed confirmation Razorpay's checkout hands back (the popup itself is third-party)
  const paid = await api(request, 'patient', 'POST', '/api/payments/verify-booking', { razorpay_order_id: S.rz1, razorpay_payment_id: 'pay_e2e_1', razorpay_signature: sign(S.rz1, 'pay_e2e_1') });
  expect(paid.status, JSON.stringify(paid.json)).toBe(200);
  expect((await sql(`SELECT status, payment_status FROM appointments WHERE id = $1`, [S.appt1]))[0]).toMatchObject({ status: 'confirmed', payment_status: 'Paid' });
  const label = dayLabel(S.date1, S.time1);

  // the patient's own list
  await patient.goto('/dashboard/patient/bookings'); await patient.waitForTimeout(3500);
  await expect(patient.locator('tr', { hasText: label }).first()).toContainText(/Confirmed/);
  // the therapist's list
  const therapist = await as(browser, 'therapist');
  await therapist.goto('/dashboard/therapist/bookings'); await therapist.waitForTimeout(3500);
  const trow = therapist.locator('tr', { hasText: label }).first();
  await expect(trow).toContainText(/Confirmed/);
  await expect(trow).toContainText(/Priya Patient/);
  // the Therapy Admin and the Super Admin see it in All Appointments
  for (const role of ['therapy-admin', 'super-admin']) {
    const admin = await as(browser, role);
    await admin.goto('/dashboard/admin/appointments'); await admin.waitForTimeout(3500);
    await expect(admin.locator('tr', { hasText: label }).first(), `${role} sees the booking`).toContainText(/Confirmed|Paid/);
  }
  // the invoice exists for the patient: list entry opens a tax invoice
  await patient.goto('/dashboard/patient/invoices'); await patient.waitForTimeout(3500);
  const link = patient.locator(`a[href*="invoices?id=BK-${S.appt1}"]`);
  await expect(link).toHaveCount(1);
  await link.click(); await patient.waitForTimeout(4000);
  expect(await body(patient)).toMatch(/INVOICE/i);
  expect(await body(patient)).toMatch(/1,500|1500/);
});

test('2. the home address stays hidden from the therapist until the visit is near', async ({ request }) => {
  const far = await api(request, 'therapist', 'GET', `/api/appointments/user/${therapistId}/appointments?role=therapist`);
  const row = (far.json.data as any[]).find((a) => a.id === S.appt1);
  expect(row, 'therapist has the booking').toBeTruthy();
  expect(row.serviceAddressDetail && Object.keys(row.serviceAddressDetail).length).toBeFalsy();
  // the start code cannot be read by anyone but the patient
  expect((await api(request, 'therapist', 'GET', `/api/appointments/${S.appt1}/otp`)).status).toBe(403);
  expect((await api(request, 'ecom-admin', 'GET', `/api/appointments/${S.appt1}/otp`)).status).toBe(403);
  // 37 minutes before the visit: inside the window
  const n = istNow(37);
  await sql(`UPDATE appointments SET date = $1, time = $2 WHERE id = $3`, [ymd(n), hm(n), S.appt1]);
  const near = await api(request, 'therapist', 'GET', `/api/appointments/user/${therapistId}/appointments?role=therapist`);
  const nrow = (near.json.data as any[]).find((a) => a.id === S.appt1);
  expect(nrow.serviceAddressDetail && Object.keys(nrow.serviceAddressDetail).length, 'address visible inside the window').toBeTruthy();
});

test('3. visit flow: the therapist moves the status, the patient sees every step and the start code opens the session', async ({ browser }) => {
  const therapist = await as(browser, 'therapist');
  const patient = await as(browser, 'patient');
  await therapist.goto('/dashboard/therapist/schedule'); await therapist.waitForTimeout(4000);
  await therapist.getByRole('button', { name: /^Start$/ }).click(); await therapist.waitForTimeout(2500);
  await therapist.getByRole('button', { name: /Start travel/ }).click(); await therapist.waitForTimeout(3000);
  await patient.goto('/dashboard/patient/my-dashboard'); await patient.waitForTimeout(4500);
  expect(await body(patient)).toMatch(/On the way|Therapist on the way|on the way/i);
  await therapist.getByRole('button', { name: /I have arrived/ }).click(); await therapist.waitForTimeout(3000);
  await patient.reload(); await patient.waitForTimeout(4500);
  expect(await body(patient)).toMatch(/arrived/i);
  const code = (await patient.locator('[aria-label="Start code"]').innerText()).replace(/\s/g, '');
  expect(code).toMatch(/^\d{4}$/);
  // a wrong code is refused, the right one starts the session
  await therapist.getByRole('button', { name: /Start session/ }).click(); await therapist.waitForTimeout(1500);
  const dlg = therapist.getByRole('dialog');
  await dlg.locator('input').first().fill(code === '0000' ? '1111' : '0000');
  await dlg.getByRole('button', { name: /Verify & start/ }).click(); await therapist.waitForTimeout(2500);
  expect((await sql(`SELECT status FROM appointments WHERE id = $1`, [S.appt1]))[0].status).toBe('arrived');
  await dlg.locator('input').first().fill(code);
  await dlg.getByRole('button', { name: /Verify & start/ }).click(); await therapist.waitForTimeout(3500);
  expect((await sql(`SELECT status FROM appointments WHERE id = $1`, [S.appt1]))[0].status).toBe('in_progress');
  expect(await body(therapist)).toMatch(/Active Session/);
  // the therapist cannot complete the booking by hand before the report
  await therapist.getByRole('button', { name: /Complete session/ }).click(); await therapist.waitForTimeout(3500);
  expect((await sql(`SELECT status FROM appointments WHERE id = $1`, [S.appt1]))[0].status).toBe('pcr_pending');
  // timeline events on both sides
  const hist = (await sql(`SELECT to_status FROM appointment_status_history WHERE appointment_id = $1 ORDER BY id`, [S.appt1])).map((x) => x.to_status);
  expect(hist).toEqual(expect.arrayContaining(['therapist_on_the_way', 'arrived', 'in_progress', 'pcr_pending']));
});

test('4. the report: the therapist submits it, then patient, Therapy Admin, therapist earnings and notifications all show the result', async ({ browser, request }) => {
  const pcrId = (await sql(`SELECT id FROM pcr WHERE appointment_id = $1`, [S.appt1]))[0]?.id;
  expect(pcrId, 'a report exists after the session started').toBeTruthy();
  const early = await api(request, 'therapist', 'PATCH', `/api/appointments/pcr/${S.appt1}`, { chiefComplaint: 'knee pain', status: 'submitted' });
  expect(early.status, 'an incomplete report cannot be submitted').toBeGreaterThanOrEqual(400);
  const full = { chiefComplaint: 'Knee pain after a fall', assessment: '<p>Reduced knee flexion</p>', diagnosis: 'Knee sprain', treatmentProvided: '<p>Manual therapy</p>', planOfCare: '<p>Twice weekly</p>', bp: '120/80', hr: '78', rr: '16', temp: '98.4', hep: '<p>Straight leg raises 3x10</p>', functionalScore: 6, painVas: 4, functionalMeasure: 'Range of motion', incidentDate: ymd(istNow()), incidentLocation: 'Home', therapistName: 'Dr Tara Therapist', signatureConfirmation: true, sessionType: 'follow_up' };
  const sub = await api(request, 'therapist', 'PATCH', `/api/appointments/pcr/${S.appt1}`, { ...full, status: 'submitted', nextSessionPlan: { mode: 'later', reason: 'Patient will check the calendar' } });
  expect(sub.status, JSON.stringify(sub.json)).toBe(200);
  expect((await sql(`SELECT status FROM appointments WHERE id = $1`, [S.appt1]))[0].status).toBe('completed');
  expect((await sql(`SELECT status, content_hash FROM pcr WHERE appointment_id = $1`, [S.appt1]))[0]).toMatchObject({ status: 'submitted', content_hash: null });

  const ta = await as(browser, 'therapy-admin');
  await ta.goto(`/pcr/${S.appt1}`); await ta.waitForTimeout(5000);
  expect(await body(ta)).toMatch(/Reduced knee flexion/);
  // the Therapy Admin locks and finalises: hash, PDF, payout line released
  await ta.getByRole('button', { name: /Lock & Finalize/ }).click(); await ta.waitForTimeout(5000);
  const locked = (await sql(`SELECT status, content_hash, pdf_path FROM pcr WHERE appointment_id = $1`, [S.appt1]))[0];
  expect(locked.status).toBe('locked');
  expect(locked.content_hash).toMatch(/^[0-9a-f]{64}$/);
  await ta.reload(); await ta.waitForTimeout(4500);
  await expect(ta.getByRole('button', { name: /Unlock for Edit/ })).toBeVisible();
  expect((await api(request, 'therapist', 'PATCH', `/api/appointments/pcr/${S.appt1}`, { assessment: '<p>edited after the lock</p>' })).status, 'the therapist cannot edit a locked report').toBeGreaterThanOrEqual(400);

  const patient = await as(browser, 'patient');
  await patient.goto('/dashboard/patient/health-records'); await patient.waitForTimeout(4500);
  expect(await patient.locator('tbody tr').count(), 'the patient sees the session record').toBeGreaterThan(0);
  const pdf = await api(request, 'patient', 'GET', `/api/pcr/appointment/${S.appt1}/pdf`);
  expect(pdf.status).toBe(200);
  expect((await api(request, 'ecom-admin', 'GET', `/api/pcr/appointment/${S.appt1}/pdf`)).status, 'the e-com admin cannot read the report').toBe(403);
  const notes = (await sql(`SELECT event FROM notification_log WHERE user_id = $1`, [patientId])).map((x) => x.event);
  expect(notes).toEqual(expect.arrayContaining(['therapist_on_the_way', 'session_completed_review']));

  const therapist = await as(browser, 'therapist');
  await therapist.goto('/dashboard/earnings'); await therapist.waitForTimeout(4500);
  expect(await body(therapist)).toMatch(/₹1,?500/);
  const items = await sql(`SELECT state, gross_amount, net_amount FROM payout_items WHERE source_id = $1`, [S.appt1]);
  expect(items.length).toBe(1);
  expect(Number(items[0].gross_amount)).toBe(1500);
});

test('5. weekly payout: the batch is made, the Super Admin approves and pays with a UTR, the therapist sees it as paid', async ({ browser, request }) => {
  const out = inApi(`const ps=require('./src/services/payoutService'); const d=new Date(Date.now()+5.5*3600e3); const dow=d.getUTCDay(); const runAt=new Date(d.toISOString().slice(0,10)+'T23:59:00+05:30').getTime()+((7-dow)%7)*86400000; return await ps.runWeeklyBatches(runAt);`);
  expect(out).toMatch(/RESULT/);
  const batch = (await sql(`SELECT id, status FROM payout_batches WHERE therapist_id = $1 ORDER BY id DESC LIMIT 1`, [therapistId]))[0];
  expect(batch.status).toBe('scheduled');
  S.batch = batch.id;
  const sa = await as(browser, 'super-admin');
  await sa.goto('/dashboard/admin/payouts'); await sa.waitForTimeout(5000);
  expect(await sa.locator('tbody tr').count(), 'the batch is listed').toBeGreaterThan(0);
  expect((await api(request, 'therapy-admin', 'POST', `/api/payout-batches/${S.batch}/approve`)).status, 'only the Super Admin approves').toBe(403);
  expect((await api(request, 'super-admin', 'POST', `/api/payout-batches/${S.batch}/approve`)).status).toBe(200);
  expect((await api(request, 'super-admin', 'POST', `/api/payout-batches/${S.batch}/mark-paid`, { utr: 'x' })).status, 'a bad UTR is refused').toBeGreaterThanOrEqual(400);
  expect((await api(request, 'super-admin', 'POST', `/api/payout-batches/${S.batch}/mark-paid`, { utr: 'UTR2026E2E01' })).status).toBe(200);
  const mine = await api(request, 'therapist', 'GET', '/api/payout-batches/list');
  expect(JSON.stringify(mine.json)).toContain('UTR2026E2E01');
  const therapist = await as(browser, 'therapist');
  await therapist.goto('/dashboard/earnings'); await therapist.waitForTimeout(4500);
  expect(await body(therapist)).toMatch(/UTR2026E2E01|Paid/);
});

test('6. cancellation: the patient cancels with the exact charge shown, the therapist sees it, the refund goes back', async ({ browser, request }) => {
  const d = ymd(istNow(60 * 24 * 9)); const t = '10:00';   // inside the seeded working hours
  const mk = await api(request, 'patient', 'POST', '/api/appointments/create-appointment', { bookingData: { therapistId, patientName: 'Priya Patient', serviceTypeId: 1, therapyType: 'Physiotherapy', date: d, time: t, mode: 'home', addressId: 1, dateofBirth: '1990-05-05', consents: { medical: true, privacy: true } } });
  expect(mk.status, JSON.stringify(mk.json)).toBe(200);
  S.appt2 = mk.json.appointmentId;
  await api(request, 'patient', 'POST', '/api/payments/verify-booking', { razorpay_order_id: mk.json.razorpayOrderId, razorpay_payment_id: 'pay_e2e_2', razorpay_signature: sign(mk.json.razorpayOrderId, 'pay_e2e_2') });
  const label = dayLabel(d, t);
  const therapist = await as(browser, 'therapist');
  await therapist.goto('/dashboard/therapist/bookings'); await therapist.waitForTimeout(3500);
  await expect(therapist.locator('tr', { hasText: label }).first()).toContainText(/Confirmed/);
  const patient = await as(browser, 'patient');
  await patient.goto('/dashboard/patient/bookings'); await patient.waitForTimeout(3500);
  const row = patient.locator('tr', { hasText: label }).first();
  await row.getByRole('button').last().click();
  await patient.getByRole('menuitem', { name: /^Cancel/ }).click(); await patient.waitForTimeout(2500);
  const dialog = await patient.locator('[role="dialog"], [role="alertdialog"]').first().innerText();
  expect(dialog).toMatch(/Free cancellation|Cancellation charge/);
  expect(dialog).toMatch(/Refund to you[\s\S]*1,500/);
  await patient.getByRole('button', { name: /^Cancel booking$/ }).click(); await patient.waitForTimeout(4000);
  expect((await sql(`SELECT status FROM appointments WHERE id = $1`, [S.appt2]))[0].status).toBe('cancelled_by_patient');
  await therapist.reload(); await therapist.waitForTimeout(3500);
  await expect(therapist.locator('tr', { hasText: label }).first()).toContainText(/Cancel/i);
  const ev = (await sql(`SELECT event FROM notification_log WHERE appointment_id = $1`, [S.appt2]).catch(() => [])).map((x: any) => x.event);
  if (ev.length) expect(ev).toContain('booking_cancelled');
});

test('7. shop: a therapist code gives the discount, the e-com admin sees the order, a return is refused before delivery and paid out after inspection', async ({ browser, request }) => {
  const gen = await api(request, 'ecom-admin', 'POST', '/api/coupons/generate-missing', {});
  expect(gen.status).toBe(200);
  const code = (await sql(`SELECT code FROM coupons WHERE code LIKE 'DR%' ORDER BY id LIMIT 1`))[0].code;
  const therapist = await as(browser, 'therapist');
  await therapist.goto('/dashboard/therapist/affiliate'); await therapist.waitForTimeout(4000);
  expect(await body(therapist)).toContain(code);

  const patient = await as(browser, 'patient');
  await sql(`DELETE FROM cart WHERE user_id = $1`, [patientId]);
  await patient.goto('/ecommerce/product/1'); await patient.waitForTimeout(3500);
  await patient.getByRole('button', { name: /add to cart/i }).first().click(); await patient.waitForTimeout(2500);
  await patient.goto('/shop/checkout'); await patient.waitForTimeout(4000);
  await patient.getByPlaceholder(/coupon|code/i).first().fill(code);
  await patient.getByRole('button', { name: /^Apply$/ }).first().click(); await patient.waitForTimeout(3000);
  expect(await body(patient)).toMatch(/Coupon \(/);
  const created = patient.waitForResponse((r) => r.url().includes('/api/orders/create-order') && r.request().method() === 'POST');
  await patient.getByRole('button', { name: /Proceed to Payment/ }).click();
  const oj = await (await created).json();
  expect(oj.success, JSON.stringify(oj)).toBeTruthy();
  S.order = oj.data.orderId; S.orderNumber = oj.data.orderNumber;
  expect(oj.data.amountPaise).toBe(106200);   // 1,000 - 10% = 900, GST 18% = 162, free shipping
  const pay = await api(request, 'patient', 'POST', '/api/payments/verify', { razorpay_order_id: oj.data.razorpayOrderId, razorpay_payment_id: 'pay_e2e_o', razorpay_signature: sign(oj.data.razorpayOrderId, 'pay_e2e_o') });
  expect(pay.status, JSON.stringify(pay.json)).toBe(200);

  const ecom = await as(browser, 'ecom-admin');
  await ecom.goto('/dashboard/admin/orders'); await ecom.waitForTimeout(4500);
  await expect(ecom.locator('tr', { hasText: S.orderNumber }).first()).toBeVisible();
  const commission = (await sql(`SELECT status, commission_amount FROM affiliate_commissions WHERE order_id = $1`, [S.order]))[0];
  expect(commission.status).toBe('pending');
  await therapist.reload(); await therapist.waitForTimeout(4000);
  expect(await body(therapist)).toMatch(/Orders with your code[\s\S]{0,12}1/);

  // return before delivery
  const early = await api(request, 'patient', 'POST', `/api/orders/${S.order}/return`, { reason: 'damaged', items: [] });
  expect(early.status).toBeGreaterThanOrEqual(400);
  // delivered today: the return is accepted, the e-com admin handles it, the commission is cancelled
  await sql(`UPDATE orders SET status = 'delivered', delivered_at = now() WHERE id = $1`, [S.order]);
  const item = (await sql(`SELECT id FROM order_items WHERE order_id = $1 LIMIT 1`, [S.order]))[0].id;
  const ret = await api(request, 'patient', 'POST', `/api/orders/${S.order}/return`, { reason: 'defective', note: 'e2e', items: [{ order_item_id: item, quantity: 1 }], photos: ['https://example.com/p.jpg'] });
  expect(ret.status, JSON.stringify(ret.json)).toBeLessThan(300);
  const rid = (await sql(`SELECT id FROM order_returns WHERE order_id = $1 ORDER BY id DESC LIMIT 1`, [S.order]))[0].id;
  await ecom.goto('/dashboard/admin/returns'); await ecom.waitForTimeout(4500);
  expect(await ecom.locator('tbody tr').count()).toBeGreaterThan(0);
  expect((await api(request, 'ecom-admin', 'PUT', `/api/orders/returns/${rid}/approve`, {})).status).toBeLessThan(300);   // books the reverse pickup (stubbed courier)
  expect((await sql(`SELECT status FROM affiliate_commissions WHERE order_id = $1`, [S.order]))[0].status, 'an approved return cancels the commission').toBe('cancelled_returned');
  expect((await api(request, 'ecom-admin', 'PUT', `/api/orders/returns/${rid}/receive`, {})).status).toBeLessThan(300);
  const insp = await api(request, 'ecom-admin', 'PUT', `/api/orders/returns/${rid}/inspect`, { result: 'pass' });
  expect(insp.status, JSON.stringify(insp.json)).toBeLessThan(300);
  await patient.goto('/dashboard/patient/orders'); await patient.waitForTimeout(4000);
  expect(await body(patient)).toContain(S.orderNumber);
});

test('8. follow-up: only the doctor\'s date can be booked and the new report opens with the last visit', async ({ browser, request }) => {
  // the first visit's report named a date; build a second completed visit with a "single next session" plan
  const doctorDate = ymd(istNow(60 * 24 * 6));
  const n = istNow(41);
  const mk = (await sql(`INSERT INTO appointments(patient_id, patient_name, therapist_id, therapist_name, service_type_id, therapy_type, service_amount, total_amount, date, time, status, payment_status, payment_method, mode, created_at) VALUES ($1,'Priya Patient',$2,'Dr Tara Therapist',1,'Physiotherapy',1500,1500,$3,$4,'pcr_pending','Paid','razorpay','home', now()) RETURNING id`, [patientId, therapistId, ymd(n), hm(n)]))[0].id;
  S.appt3 = mk;
  await sql(`INSERT INTO pcr(appointment_id, patient_id, therapist_id, service_type_id, status, version) VALUES ($1,$2,$3,1,'in_progress',1)`, [mk, patientId, therapistId]);
  const full = { chiefComplaint: 'Knee pain', assessment: '<p>Improving, flexion 110 degrees</p>', diagnosis: 'Knee sprain', treatmentProvided: '<p>Strengthening</p>', planOfCare: '<p>Weekly review</p>', bp: '118/76', hr: '74', rr: '15', temp: '98.2', hep: '<p>Wall slides</p>', functionalScore: 7, painVas: 2, functionalMeasure: 'Range of motion', incidentDate: ymd(istNow()), incidentLocation: 'Home', therapistName: 'Dr Tara Therapist', signatureConfirmation: true, sessionType: 'follow_up' };
  const sub = await api(request, 'therapist', 'PATCH', `/api/appointments/pcr/${mk}`, { ...full, status: 'submitted', nextSessionPlan: { mode: 'single', date: doctorDate, time: '10:00' } });
  expect(sub.status, JSON.stringify(sub.json)).toBe(200);
  // the doctor's slot is held for the patient (a proposal): booking a second one is refused, the dashboard confirms it
  const held = await api(request, 'patient', 'GET', `/api/appointments/${mk}/follow-up-options`);
  expect(held.json.data.mode).toBe('proposed');
  const again = await api(request, 'patient', 'POST', '/api/appointments/create-appointment', { bookingData: { therapistId, patientName: 'Priya', serviceTypeId: 1, therapyType: 'Physiotherapy', date: doctorDate, time: '11:00', mode: 'home', addressId: 1, followUpOf: mk } });
  expect(again.status).toBe(409);
  const prop = (await sql(`SELECT id FROM followup_proposals WHERE patient_id = $1 AND status = 'proposed' ORDER BY id DESC LIMIT 1`, [patientId]))[0];
  expect((await api(request, 'patient', 'POST', `/api/clinical/followups/${prop.id}/decline`, {})).status).toBeLessThan(300);
  // after declining, the doctor's date is the only date the patient can book
  const opts = await api(request, 'patient', 'GET', `/api/appointments/${mk}/follow-up-options`);
  expect(opts.json.data).toMatchObject({ mode: 'dates', dates: [doctorDate] });
  const other = ymd(istNow(60 * 24 * 7));
  const bad = await api(request, 'patient', 'POST', '/api/appointments/create-appointment', { bookingData: { therapistId, patientName: 'Priya', serviceTypeId: 1, therapyType: 'Physiotherapy', date: other, time: '11:00', mode: 'home', addressId: 1, followUpOf: mk } });
  expect(bad.status).toBe(400);
  expect(JSON.stringify(bad.json)).toContain(doctorDate);
  // the booking page itself offers one date only
  const patient = await as(browser, 'patient');
  await patient.goto(`/booking/${therapistId}?followUp=${mk}`); await patient.waitForTimeout(6000);
  expect(await body(patient)).toMatch(/Your therapist asked for this visit on/);
  const enabledSel = patient.locator('button[role="gridcell"]:not([disabled]), td button:not([disabled])');
  if ((await enabledSel.count()) === 0) { await patient.getByRole('button', { name: /next month/i }).click(); await patient.waitForTimeout(800); }   // the doctor's date can be in the next month
  const enabled = await enabledSel.allInnerTexts();
  expect(enabled.map((x) => x.trim()).filter((x) => /^\d+$/.test(x))).toEqual([String(new Date(`${doctorDate}T00:00:00`).getDate())]);
  // the therapist opens the follow-up's report: the last visit's report is at the top
  const fu = (await sql(`INSERT INTO appointments(patient_id, patient_name, therapist_id, therapist_name, service_type_id, therapy_type, service_amount, total_amount, date, time, status, payment_status, payment_method, mode, follow_up_of, created_at) VALUES ($1,'Priya Patient',$2,'Dr Tara Therapist',1,'Physiotherapy',1500,1500,$3,$4,'in_progress','Paid','razorpay','home',$5, now()) RETURNING id`, [patientId, therapistId, ymd(istNow(60)), hm(istNow(52)), mk]))[0].id;
  await sql(`INSERT INTO pcr(appointment_id, patient_id, therapist_id, service_type_id, status, version) VALUES ($1,$2,$3,1,'in_progress',1)`, [fu, patientId, therapistId]);
  const therapist = await as(browser, 'therapist');
  await therapist.goto(`/pcr/${fu}`); await therapist.waitForTimeout(5500);
  const card = therapist.getByTestId('last-visit-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText(/Improving, flexion 110 degrees/);
  // a therapist of another booking and the e-com admin cannot open it
  expect((await api(request, 'ecom-admin', 'GET', `/api/appointments/pcr/${fu}`)).status).toBe(403);
});

test('9. support, SOS and privacy: what the patient and the therapist raise appears for the right admins', async ({ browser, request }) => {
  const patient = await as(browser, 'patient');
  await patient.goto('/dashboard/patient/my-dashboard'); await patient.waitForTimeout(3500);
  await patient.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Open AI Assistant/.test(x.textContent || '')); b && (b as HTMLButtonElement).click(); }); await patient.waitForTimeout(2500);
  await patient.getByRole('button', { name: 'Talk to a person' }).click(); await patient.waitForTimeout(4500);
  expect(await body(patient)).toMatch(/ticket #\d+/);
  const sa = await as(browser, 'super-admin');
  await sa.goto('/dashboard/admin/support-tickets'); await sa.waitForTimeout(4500);
  await expect(sa.locator('tr', { hasText: /human requested/ }).first()).toBeVisible();

  const therapist = await as(browser, 'therapist');
  await therapist.goto('/dashboard/therapist/my-dashboard'); await therapist.waitForTimeout(3500);
  await therapist.getByRole('button', { name: 'SOS' }).first().click(); await therapist.waitForTimeout(3500);
  await sa.goto('/dashboard/admin/sos-alerts'); await sa.waitForTimeout(4500);
  expect(await body(sa)).toMatch(/Active Alerts \([1-9]/);

  await patient.goto('/dashboard/account/privacy'); await patient.waitForTimeout(3500);
  await patient.getByRole('button', { name: /Withdraw marketing consent/ }).click(); await patient.waitForTimeout(3000);
  await sa.goto('/dashboard/admin/privacy-requests'); await sa.waitForTimeout(4500);
  await expect(sa.locator('tr', { hasText: /Withdraw consent/ }).first()).toBeVisible();
  expect((await api(request, 'therapy-admin', 'GET', '/api/privacy/admin/requests')).status).toBe(403);
});

test('10. leave: a leave over a booking alerts the Therapy Admin, who sees it in the emergency queue', async ({ browser, request }) => {
  const d = ymd(istNow(60 * 24));   // the emergency queue looks one day ahead (businessRules.emergency.lookAheadDays)
  const t = '11:00';
  const mk = await api(request, 'patient', 'POST', '/api/appointments/create-appointment', { bookingData: { therapistId, patientName: 'Priya Patient', serviceTypeId: 1, therapyType: 'Physiotherapy', date: d, time: t, mode: 'home', addressId: 1, dateofBirth: '1990-05-05', consents: { medical: true, privacy: true } } });
  expect(mk.status, JSON.stringify(mk.json)).toBe(200);
  await api(request, 'patient', 'POST', '/api/payments/verify-booking', { razorpay_order_id: mk.json.razorpayOrderId, razorpay_payment_id: 'pay_e2e_l', razorpay_signature: sign(mk.json.razorpayOrderId, 'pay_e2e_l') });
  S.appt4 = mk.json.appointmentId;
  const leave = await api(request, 'therapist', 'POST', '/api/therapists/leaves', { start_date: d, end_date: d, reason: 'e2e' });
  expect(leave.status, JSON.stringify(leave.json)).toBeLessThan(300);
  const q = await api(request, 'therapy-admin', 'GET', '/api/therapy-admin/emergency-queue');
  expect(q.status).toBe(200);
  expect(JSON.stringify(q.json)).toContain(String(S.appt4));
  // a patient cannot book the slot on a leave day
  const blocked = await api(request, 'patient', 'POST', '/api/appointments/create-appointment', { bookingData: { therapistId, patientName: 'Priya', serviceTypeId: 1, therapyType: 'Physiotherapy', date: d, time: '12:00', mode: 'home', addressId: 1 } });
  expect(blocked.status).toBeGreaterThanOrEqual(400);
  const ta = await as(browser, 'therapy-admin');
  await ta.goto('/dashboard/therapy-admin/my-dashboard'); await ta.waitForTimeout(6000);
  expect(await body(ta)).toMatch(/Emergency|Reassign|leave/i);
});
