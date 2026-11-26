import type { ReactNode } from 'react';
import { PAGE_SEO, seoMetadata } from '@/lib/seo';

export const metadata = seoMetadata('/contact', PAGE_SEO.contact);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
