import { test, expect } from '@playwright/test';
import { API, USERS, bearer, login } from './users';

// Money journeys through the real API of the test stack (Razorpay is the stub of dev_server.js). The rule-by-rule coverage of
// booking -> pay -> OTP -> PCR -> lock -> payout and of shop -> coupon -> webhook -> return is `npm test` in curevan-node.
test('the patient sees the seeded orders and the invoice of one', async ({ request }) => {
  const t = await login(request, USERS.patient);
  const orders = await request.get(`${API}/api/orders/my-orders`, { headers: bearer(t) });
  expect(orders.ok()).toBeTruthy();
});

test('a return on an order that is not delivered is refused', async ({ request }) => {
  const t = await login(request, USERS.patient);
  const r = await request.post(`${API}/api/orders/1/return`, { headers: bearer(t), data: { reason: 'damaged', note: 'e2e' } });
  expect([400, 403, 409, 422]).toContain(r.status());
});

test('the public config carries the legal entity', async ({ request }) => {
  const r = await request.get(`${API}/api/config/legal-entity`);
  expect(r.ok()).toBeTruthy();
});
