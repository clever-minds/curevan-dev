'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { listAppointmentsForUser } from '@/lib/repos/appointments';
import { listOrders } from '@/lib/repos/orders';
import { getSafeDate } from '@/lib/utils';
import { Price } from '@/components/money/price';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Row = { key: string; kind: 'Session' | 'Shop order'; label: string; date: Date | null; amount: number; href: string };

/** The patient's invoices: one row per paid session or paid shop order, each opening the invoice viewer. */
export function InvoiceList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [appts, orders] = await Promise.all([listAppointmentsForUser(user.id, 'patient'), listOrders({ userId: Number(user.uid) })]);
      const sessions: Row[] = (appts ?? []).filter((a: any) => a.paymentStatus === 'Paid').map((a: any) => ({
        key: `a${a.id}`, kind: 'Session', label: `${a.therapyType || 'Session'} with ${a.therapist || a.therapistName || 'your therapist'}`,
        date: getSafeDate(a.date), amount: Number(a.totalAmount || 0), href: `/dashboard/invoices?id=BK-${a.id}`,
      }));
      const shop: Row[] = (orders ?? []).filter((o: any) => o.paymentStatus === 'Paid').map((o: any) => ({
        key: `o${o.id}`, kind: 'Shop order', label: `Order ${o.number}`,
        date: getSafeDate(o.createdAt), amount: Number(o.total || 0), href: `/dashboard/invoices?id=${o.invoiceId ? o.invoiceId : `ORD-${o.id}`}`,
      }));
      setRows([...sessions, ...shop].sort((x, y) => (y.date?.getTime() ?? 0) - (x.date?.getTime() ?? 0)));
    })();
  }, [user]);

  return (
    <div className="container py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>My invoices</CardTitle>
          <CardDescription>Invoices for your paid sessions and shop orders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows === null && <><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></>}
          {rows?.length === 0 && <p className="text-sm text-muted-foreground">You have no invoices yet. They appear here once a session or an order is paid.</p>}
          {rows?.map((r) => (
            <Link key={r.key} href={r.href} className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/50">
              <span className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.kind}{r.date ? ` · ${format(r.date, 'dd MMM yyyy')}` : ''}</span>
                </span>
              </span>
              <Price amount={r.amount} showDecimals className="text-sm font-medium" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
