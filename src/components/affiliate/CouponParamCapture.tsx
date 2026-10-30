'use client';

import { useEffect } from 'react';

export const PENDING_COUPON_KEY = 'curevan.pendingCoupon';

/** /ecommerce?coupon=CODE: keep the code until checkout applies it. */
export function CouponParamCapture() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get('coupon');
      if (code && /^[A-Za-z0-9_-]{2,40}$/.test(code)) localStorage.setItem(PENDING_COUPON_KEY, code.toUpperCase());
    } catch { /* storage can be blocked; the customer can still type the code */ }
  }, []);
  return null;
}
