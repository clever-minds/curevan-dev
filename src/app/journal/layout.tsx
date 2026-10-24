import type { ReactNode } from 'react';
import { PAGE_SEO, seoMetadata } from '@/lib/seo';

export const metadata = seoMetadata('/journal', PAGE_SEO.journal);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
