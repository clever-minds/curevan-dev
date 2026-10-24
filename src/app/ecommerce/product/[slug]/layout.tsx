import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import type { ReactNode } from 'react';
import { fetchProductById } from '@/lib/repos/products';
import { productPath } from '@/lib/slug';
import { seoMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

const product = cache(fetchProductById);

const plain = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await product(slug);
  if (!p) return { title: 'Product not found', robots: { index: false } };
  // sheet template: "[Product name] – Buy Online" and "[First 120 characters of description] Price ₹[price]. Order online from Curevan."
  const intro = plain(p.description || p.longDescription || '').slice(0, 120);
  // the /ecommerce layout above sets a plain title, which switches the root " | Curevan" template off for pages under it: add the brand here
  return seoMetadata(productPath(p), {
    title: `${p.name} – Buy Online | Curevan`,
    // no price sentence while the product has no price yet ("Price ₹0" would show in Google)
    description: `${intro}${intro ? ' ' : ''}${p.price > 0 ? `Price ₹${p.price}. ` : ''}Order online from Curevan.`,
  }, { absoluteTitle: true });
}

export default async function ProductLayout({ params, children }: Props & { children: ReactNode }) {
  const { slug } = await params;
  // an old link made from the product number goes to the clean link
  if (/^\d+$/.test(slug)) {
    const p = await product(slug);
    if (p?.slug) permanentRedirect(productPath(p));
  }
  return children;
}
