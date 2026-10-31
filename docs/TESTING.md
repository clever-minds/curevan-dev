# Testing the website

## Every pull request (CI: `.github/workflows/ci.yml`, no Firebase / App Hosting step)

```bash
npm ci
npm run typecheck      # go-live item 7 (build): types
npm run lint
npx vitest run         # unit tests: helpers, AI safety/tools, call window, server actions
npm run check:links    # go-live item 6: every menu/page link points to an existing page
npm run build          # go-live item 7
```

## Browser tests (Playwright) against the TEST stack

They log in through the API, so no Firebase is needed. Never point them at production.

```bash
# 1. in curevan-node, with a PostgreSQL named *test* (see its docs/TESTING.md)
npm run test:db && npm run test:users && node tests/integration/dev_server.js     # API on :5000, stubbed Razorpay
# 2. in this repo
npm run build && npx next start -p 3000        # NEXT_PUBLIC_API_URL=http://localhost:5000 and dummy Firebase values
npx playwright install chromium                # once; or set E2E_CHROME=1 to use the installed Chrome
npm run test:e2e
```

| Spec | Covers |
|---|---|
| `e2e/auth.setup.ts` | logs in the 5 seeded roles (`patient@`, `therapist@`, `super@`, `ecom@`, `therapy@curevan.test`, password `Test@1234`) |
| `e2e/rbac.spec.ts` | role guards (API 401/403) and pages a role may not open |
| `e2e/mobile.spec.ts` | project "Mobile 375": every dashboard home has no horizontal scroll (go-live item 19) |
| `e2e/journeys.spec.ts` | orders list, return on an undelivered order refused, legal entity config |
| `e2e/certificate.spec.ts` | P22: the therapist uploads the registration certificate in the browser, the therapy admin's queue shows it and the API serves the same file, a patient gets 403 |
| `e2e/cross-role.spec.ts` | P29: ten journeys across the roles (a patient books through the form, the therapist and the admins see the same booking, the visit flow and start code, report and lock, weekly payout, cancellation and refund, shop with return and commission, follow-up, support / SOS / privacy, leave). Takes about 5 minutes; start from a freshly seeded database (`npm run test:db` and `npm run test:users` in curevan-node) |

The booking -> pay -> OTP -> PCR -> lock -> payout and shop -> coupon -> webhook -> return journeys are asserted rule by rule
in the API suite (`npm test` in curevan-node; mapping in its `docs/TESTING.md`). The Razorpay popup itself is third-party and
is replaced by a signed test payment there; check it once by hand with the Razorpay test keys before go-live.

## In CI
The `e2e` job of `.github/workflows/ci.yml` runs all of the above on every pull request: PostgreSQL service, the API of curevan-node (main branch, stubbed Razorpay / Firebase / mail) on :5000, the built website on :3000, Playwright with Chromium. Merge the API pull request first, because the job takes the API from `main`.
