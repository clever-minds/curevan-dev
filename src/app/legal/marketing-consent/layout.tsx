import type { ReactNode } from 'react';
import { LEGAL_SEO, seoMetadata } from '@/lib/seo';

export const metadata = seoMetadata('/legal/marketing-consent', LEGAL_SEO['marketing-consent']);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
