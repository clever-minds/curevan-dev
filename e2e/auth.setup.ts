import { test as setup, expect } from '@playwright/test';
import { API, PASSWORD, USERS } from './users';

// Sign-in goes through Firebase in production; the test stack has none, so log in through the API (POST /api/auth/login)
// and give the browser the same `token` cookie + localStorage entry the sign-in form sets.
for (const [name, email] of Object.entries(USERS)) {
  setup(`authenticate as ${name}`, async ({ page, request, baseURL }) => {
    const r = await request.post(`${API}/api/auth/login`, { data: { email, password: PASSWORD } });
    expect(r.ok(), `login ${email}: ${r.status()}`).toBeTruthy();
    const { token } = await r.json();
    expect(token).toBeTruthy();
    await page.context().addCookies([{ name: 'token', value: token, url: baseURL! }]);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.context().storageState({ path: `playwright/.auth/${name}.json` });
  });
}
