'use client';

import Link from 'next/link';
import { Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Price } from '@/components/money/price';
import { isInShipment, orderStatusClass, orderStatusLabel } from '@/lib/order-status';
import type { PatientDashboard } from '@/lib/repos/patientDashboard';

/** The last 3 shop orders with the courier status and a tracking link. */
export function RecentOrders({ orders }: { orders: PatientDashboard['orders'] }) {
  return (
    <Card data-testid="recent-orders">
      <CardHeader><CardTitle className="text-base">Recent orders</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {orders.length === 0 && <p className="text-sm text-muted-foreground">You have not ordered anything yet. <Link href="/shop" className="text-primary underline">Visit the shop</Link></p>}
        {orders.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
            <span className="font-mono text-xs">{o.number}</span>
            <Price amount={Number(o.total)} showDecimals />
            <Badge className={orderStatusClass(o.status)} variant="secondary">{orderStatusLabel(o.status)}</Badge>
            {o.awb && isInShipment(o.status) && (
              <a href={`https://shiprocket.co/tracking/${encodeURIComponent(o.awb)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline"><Truck className="h-3 w-3" />Track</a>
            )}
          </div>
        ))}
        {orders.length > 0 && <Link href="/dashboard/patient/orders" className="inline-block text-sm text-primary underline">All orders</Link>}
      </CardContent>
    </Card>
  );
}
