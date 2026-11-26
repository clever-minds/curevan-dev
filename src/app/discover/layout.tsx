import type { ReactNode } from 'react';
import { PAGE_SEO, seoMetadata } from '@/lib/seo';

export const metadata = seoMetadata('/discover', PAGE_SEO.discover);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
