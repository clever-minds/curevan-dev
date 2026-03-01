
import { CouponForm } from "@/components/admin/CouponForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function NewCouponPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Create New Coupon</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new promotional or therapist referral code.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <CouponForm />
        </CardContent>
      </Card>
    </div>
  );
}
