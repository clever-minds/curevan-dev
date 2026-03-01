'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CouponForm } from "@/components/admin/CouponForm";
import { getCouponByCode } from '@/lib/repos/coupons';

export const dynamic = 'force-dynamic';

export default function EditCouponPage() {
  const params = useParams();
  const code = Array.isArray(params.id) ? params.id[0] : params.id;

  const [coupon, setCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    const fetchCoupon = async () => {
      try {
        const data = await getCouponByCode(code);
        console.log("Fetched coupon for editing data:", data);

        setCoupon(data);
      } catch (error) {
        console.error('Error fetching coupon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, [code]);

  if (loading) {
    return <div className="p-6">Loading coupon...</div>;
  }
  if (!coupon) {
    return <div className="p-6 text-red-500">Coupon not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Update Coupon
        </h1>
        <p className="text-muted-foreground">
          Modify the coupon details below.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* 👇 PASS DATA HERE */}
          <CouponForm coupon={coupon} couponId={coupon?.id}/>
        </CardContent>
      </Card>
    </div>
  );
}
