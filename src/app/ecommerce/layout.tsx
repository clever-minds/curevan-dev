import type { ReactNode } from 'react';
import { PAGE_SEO, seoMetadata } from '@/lib/seo';
import { CouponParamCapture } from '@/components/affiliate/CouponParamCapture';

export const metadata = seoMetadata('/ecommerce', PAGE_SEO.ecommerce);

// a ?coupon=CODE in the shop link is kept until checkout applies it
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <CouponParamCapture />
      {children}
    </>
  );
}
