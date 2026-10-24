/** Clean link text: lowercase, hyphens, no symbols. "Post-Surgery Rehab" -> "post-surgery-rehab". Same rule as the API. */
export const slugify = (text: string) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// The slug the API stores for a category the SEO sheet names explicitly; used only until a row has its own slug.
const NAMED_SLUGS: Record<string, string> = { 'occupational health & wellness': 'occupational-therapy' };

/** The link text of a therapy category: its own slug, else one made from its name. */
export const categorySlug = (c: { name: string; slug?: string | null }) => c.slug || NAMED_SLUGS[c.name.trim().toLowerCase()] || slugify(c.name);

/** The link text of a product: its slug, else its id (an old row without a slug still opens). */
export const productPath = (p: { id: number | string; slug?: string | null }) => `/ecommerce/product/${p.slug || p.id}`;
