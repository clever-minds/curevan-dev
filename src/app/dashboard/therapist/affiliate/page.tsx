'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Price } from '@/components/money/price';
import { ReferralCard, referralText, useAffiliateRules } from '@/components/affiliate/ReferralCard';
import { getAffiliateStats, type AffiliateStats } from '@/lib/repos/affiliate';

const Stat = ({ label, value, hint, money }: { label: string; value: number; hint?: string; money?: boolean }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{money ? <Price amount={value} showDecimals /> : value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

/** The therapist's DR code results: redemptions, sales, commission by stage, best sellers. */
export default function AffiliatePage() {
  const rules = useAffiliateRules();
  const [stats, setStats] = React.useState<AffiliateStats | null | undefined>(undefined);
  React.useEffect(() => { getAffiliateStats().then(setStats); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">My Referral Code</h1>
        <p className="text-muted-foreground text-sm">{referralText(rules)} Commission is for products only, never for therapy sessions.</p>
      </div>

      <ReferralCard title="Share your code" />

      {stats === undefined ? <Skeleton className="h-40 w-full" /> : stats === null ? (
        <p className="text-muted-foreground">Your numbers could not be loaded. Please try again later.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Orders with your code" value={stats.redemptions} />
            <Stat label="Gross sales" value={stats.grossSales} money hint="Before GST and shipping" />
            <Stat label="Pending" value={stats.pending} money hint={`Until ${rules.eligibleAfterDeliveryDays} days after delivery`} />
            <Stat label="Eligible" value={stats.eligible} money hint="Goes into the next weekly payout" />
            <Stat label="Paid" value={stats.paid} money />
          </div>

          <Card>
            <CardHeader><CardTitle>Top products</CardTitle><CardDescription>What your patients bought with your code.</CardDescription></CardHeader>
            <CardContent className="p-0 sm:p-6">
              {stats.topProducts.length === 0 ? (
                <p className="p-6 text-muted-foreground">No sales with your code yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Units</TableHead><TableHead className="text-right">Sales</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {stats.topProducts.map((p) => (
                        <TableRow key={p.name}><TableCell>{p.name}</TableCell><TableCell>{p.units}</TableCell><TableCell className="text-right"><Price amount={p.sales} showDecimals /></TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
