import { describe, it, expect } from 'vitest';
import { PAGE_SEO, CATEGORY_SEO, LEGAL_SEO } from '@/lib/seo';
import { slugify, categorySlug, productPath } from '@/lib/slug';

// The limits written at the top of Curevan_SEO_Page_Titles.xlsx: title 60 characters including " | Curevan", description 160.
const all = [
  ...Object.entries(PAGE_SEO).map(([k, v]) => [k, v, k === 'home' ? v.title : `${v.title} | Curevan`] as const),
  ...Object.entries(CATEGORY_SEO).map(([k, v]) => [`category ${k}`, v, `${v.title} | Curevan`] as const),
  ...Object.entries(LEGAL_SEO).map(([k, v]) => [`legal ${k}`, v, `${v.title} | Curevan`] as const),
];

describe('SEO sheet', () => {
  it('has every page of the sheet (8 main, 8 categories, 7 legal)', () => {
    expect(Object.keys(PAGE_SEO)).toHaveLength(8);
    expect(Object.keys(CATEGORY_SEO)).toHaveLength(8);
    expect(Object.keys(LEGAL_SEO)).toHaveLength(7);
  });
  it.each(all)('%s: title <= 60 and description <= 160 characters', (_k, seo, shown) => {
    expect(shown.length).toBeLessThanOrEqual(60);
    expect(seo.description.length).toBeLessThanOrEqual(160);
    expect(seo.description.length).toBeGreaterThan(40);
  });
  it('titles are entered without the brand (the layout template adds it), except Home', () => {
    for (const [k, seo] of all.map((a) => [a[0], a[1]] as const)) if (k !== 'home') expect(seo.title).not.toMatch(/\| Curevan$/);
  });
});

describe('clean links', () => {
  it('slugify removes spaces and symbols', () => {
    expect(slugify('Post-Surgery Rehab')).toBe('post-surgery-rehab');
    expect(slugify('Occupational Health & Wellness')).toBe('occupational-health-wellness');
    expect(slugify('  TENS / EMS  Pads! ')).toBe('tens-ems-pads');
  });
  it('a category keeps its own slug; the sheet names the occupational one', () => {
    expect(categorySlug({ name: 'Neuro Rehab', slug: 'neuro' })).toBe('neuro');
    expect(categorySlug({ name: 'Neuro Rehab' })).toBe('neuro-rehab');
    expect(categorySlug({ name: 'Occupational Health & Wellness' })).toBe('occupational-therapy');
  });
  it('every category link in the sheet is what the code produces for its name', () => {
    const names: Record<string, string> = { 'post-surgery-rehab': 'Post-Surgery Rehab', 'neuro-rehab': 'Neuro Rehab', 'respiratory-therapy': 'Respiratory Therapy', 'postpartum-care': 'Postpartum Care', 'elder-care': 'Elder Care', 'nursing-care': 'Nursing Care', 'speech-therapy': 'Speech Therapy', 'occupational-therapy': 'Occupational Health & Wellness' };
    for (const [slug, name] of Object.entries(names)) { expect(categorySlug({ name })).toBe(slug); expect(CATEGORY_SEO[slug]).toBeTruthy(); }
  });
  it('a product link uses the slug, and the id for a row without one', () => {
    expect(productPath({ id: 81, slug: 'tens-electrode-pads' })).toBe('/ecommerce/product/tens-electrode-pads');
    expect(productPath({ id: 81 })).toBe('/ecommerce/product/81');
  });
});
