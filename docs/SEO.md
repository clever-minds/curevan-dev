# SEO: page titles, descriptions and clean links

Source: `Curevan_SEO_Page_Titles.xlsx` (sheets "Page SEO" and "Clean links"). Everything in it is implemented as written.

## Where things are
| What | Where |
|---|---|
| Every title and description of the sheet | `src/lib/seo.ts` (`PAGE_SEO`, `CATEGORY_SEO`, `LEGAL_SEO`) |
| Brand suffix " \| Curevan" | added by the root layout template; Home uses its full sheet title |
| Canonical link, link-preview text | `seoMetadata()` in `src/lib/seo.ts`, used by every page |
| Slug rules | `src/lib/slug.ts` (same rule as the API: `src/utils/slug.js`) |
| Old link -> clean link (real 308) | `src/middleware.ts` (category names, product numbers) and `next.config.js` (fixed pages) |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts` |

## Addresses (one per page)
- `/book` -> `/discover`, `/shop` -> `/ecommerce` (query such as `?coupon=` is kept; the coupon capture now sits in the `/ecommerce` layout)
- `/auth/therapist-signup` -> `/join-as-therapist`
- `/therapists/category/<slug>`: `post-surgery-rehab`, `neuro-rehab`, `respiratory-therapy`, `postpartum-care`, `elder-care`, `nursing-care`, `speech-therapy`, `occupational-therapy` (for "Occupational Health & Wellness")
- `/ecommerce/product/<slug>` (the number still opens and redirects), `/journal/<slug>` (already slug based)
- Products and journal articles get the sheet's templates (`[Product name] – Buy Online`, `[Name] – [Specialty] in [City]`, `[Article title]`)

## Slugs (API, migration 0022)
- `service_types.slug` and `products.slug`, unique, filled from the name for existing rows; "Occupational Health & Wellness" -> `occupational-therapy`.
- Created automatically from the name when an item is added; the admin can type another one (service types page, product form). A taken slug is refused. Renaming an item does not change its link, only editing the slug does.
- `GET /api/products/frontend/:id` accepts the number or the slug.

## Rollout order
1. Apply migration `0022_slugs.sql` (`npm run migrate`) and deploy the API.
2. Deploy the website. It also works before step 1 (a category without a slug falls back to its name, a product to its number), but the old-link redirects for products need the API change.
3. Submit the new `sitemap.xml` in Google Search Console.

## Not in the sheet / left as is
- The main "Physiotherapy" category has no row: its title falls back to "Physiotherapy at Home".
- Therapist profile links stay `/therapists/<name>`; the sheet shows `[name-city]` only as a template example.
- Category and product pages are checked by `tests/seo.test.ts` (lengths <= 60 / 160, slug rules).
- Copy to confirm with the owner before it goes live: "keep 100% of patient payments" (Join as a Therapist) and the nursing services (IV care, injections).
