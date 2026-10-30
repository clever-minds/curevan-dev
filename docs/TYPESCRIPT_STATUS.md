# TypeScript status

- `npx tsc --noEmit`: 0 errors (checked in CI on every pull request).
- `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: **0**.
- `as any` casts: **150** in 41 files (list below, most first). They are old and are removed when a file is touched; none hides a compile error.

| File | casts |
|---|---|
| `src/lib/repos/content.ts` | 43 |
| `src/app/dashboard/admin/products/product-form.tsx` | 28 |
| `src/lib/actions/therapist.ts` | 11 |
| `src/app/pcr/[bookingId]/pcr-form.tsx` | 8 |
| `src/app/join-as-therapist/therapist-onboarding-form.tsx` | 6 |
| `src/app/dashboard/therapist/edit/page.tsx` | 5 |
| `src/components/request-therapist-form.tsx` | 3 |
| `src/app/journal/[slug]/page.tsx` | 3 |
| `src/services/invoice-service.ts` | 2 |
| `src/components/order-invoice.tsx` | 2 |
| `src/components/header.tsx` | 2 |
| `src/components/appointment-invoice.tsx` | 2 |
| `src/components/admin/OfferForm.tsx` | 2 |
| `src/components/admin/AdminUsersTable.tsx` | 2 |
| `src/app/shop/checkout/checkout-address-form.tsx` | 2 |
| `src/app/ecommerce/page.tsx` | 2 |
| `src/app/dashboard/therapist/page.tsx` | 2 |
| `src/app/booking/[id]/booking-form.tsx` | 2 |
| `src/lib/repos/categories.ts` | 1 |
| `src/lib/actions/booking.ts` | 1 |
| `src/lib/actions.ts` | 1 |
| `src/components/ui/calendar.tsx` | 1 |
| `src/components/therapist-card.tsx` | 1 |
| `src/components/product-card.tsx` | 1 |
| `src/components/money/price.tsx` | 1 |
| `src/components/invoice.tsx` | 1 |
| `src/components/incoming-booking-modal.tsx` | 1 |
| `src/components/ecommerce/bundle-components-list.tsx` | 1 |
| `src/components/dashboard-nav.tsx` | 1 |
| `src/components/ai-chat-assistant.tsx` | 1 |
| `src/components/admin/FilterBar.tsx` | 1 |
| `src/components/admin/CouponForm.tsx` | 1 |
| `src/app/ecommerce/product/[slug]/page.tsx` | 1 |
| `src/app/dashboard/therapy-admin/users/page.tsx` | 1 |
| `src/app/dashboard/new-post/new-post-form.tsx` | 1 |
| `src/app/dashboard/earnings/page.tsx` | 1 |
| `src/app/dashboard/admin/users/page.tsx` | 1 |
| `src/app/dashboard/admin/reports/financials/page.tsx` | 1 |
| `src/app/dashboard/admin/products/[id]/edit/page.tsx` | 1 |
| `src/app/contact/page.tsx` | 1 |
| `src/ai/tools.ts` | 1 |
