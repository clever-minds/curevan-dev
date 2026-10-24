import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getTherapyCategoriesWithIds } from '@/lib/repos/categories';
import { categorySlug } from '@/lib/slug';
import { CATEGORY_SEO, seoMetadata } from '@/lib/seo';
import TherapistCategoryPage from './category-view';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

// the category list is read once for both the title and the page
const categories = cache(getTherapyCategoriesWithIds);

async function find(raw: string) {
  const wanted = decodeURIComponent(raw);
  const list = await categories();
  const bySlug = list.find((c) => categorySlug(c) === wanted);
  // an old link made from the name ("Post-Surgery%20Rehab") goes to the clean link
  const byName = bySlug ? undefined : list.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
  return { bySlug, byName };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { bySlug } = await find(slug);
  if (!bySlug) return { title: 'Service not found', robots: { index: false } };
  const path = `/therapists/category/${categorySlug(bySlug)}`;
  const seo = CATEGORY_SEO[categorySlug(bySlug)];
  if (seo) return seoMetadata(path, seo);
  // a category the SEO sheet does not list yet
  return seoMetadata(path, {
    title: `${bySlug.name} at Home`,
    description: bySlug.description || `Book a verified ${bySlug.name.toLowerCase()} professional at home with Curevan.`,
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { bySlug, byName } = await find(slug);
  if (byName) permanentRedirect(`/therapists/category/${categorySlug(byName)}`);
  if (!bySlug) notFound();
  return <TherapistCategoryPage serviceName={bySlug.name} />;
}
