'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { Price } from '@/components/money/price';
import type { ReconciliationData, ReconciliationMismatch } from '@/lib/types';
import { getReconciliation } from '@/lib/repos/admin';

function getYesterdayIST(): string {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  istNow.setUTCDate(istNow.getUTCDate() - 1);
  return istNow.toISOString().slice(0, 10);
}

export function ReconciliationCard() {
  const [selectedDate, setSelectedDate] = useState<string>(getYesterdayIST);
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatched, setShowMatched] = useState<boolean>(false);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReconciliation(selectedDate);
      if (res) {
        setData(res);
      } else {
        setError('Failed to load reconciliation data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching reconciliation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  const getMismatchBadge = (type: ReconciliationMismatch['type']) => {
    switch (type) {
      case 'missing_in_curevan':
        return <Badge variant="destructive" className="bg-amber-600">Missing in Curevan</Badge>;
      case 'missing_in_razorpay':
        return <Badge variant="destructive">Missing in Razorpay</Badge>;
      case 'amount_mismatch':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">Amount Mismatch</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const summary = data?.summary;
  const mismatches = data?.mismatches || [];
  const matched = data?.matched || [];

  return (
    <Card className="shadow-sm border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                Payment Reconciliation
              </CardTitle>
              <Badge variant="outline" className="text-xs uppercase font-semibold">Razorpay vs Curevan</Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Automated audit comparing Curevan paid orders and appointments with captured Razorpay transactions.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md border text-xs">
              <span className="text-muted-foreground font-medium">Audit Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReport}
              disabled={loading}
              className="h-8"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md text-xs font-medium">
            {error}
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Curevan Paid Total</div>
            <div className="text-lg font-bold mt-0.5">
              <Price amount={summary?.curevanTotal ?? 0} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {summary?.curevanCount ?? 0} orders & bookings
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Razorpay Captured</div>
            <div className="text-lg font-bold mt-0.5">
              <Price amount={summary?.razorpayTotal ?? 0} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {summary?.razorpayCount ?? 0} captured payments
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Matched Payments</div>
            <div className="text-lg font-bold text-emerald-900 mt-0.5">
              <Price amount={summary?.matchedTotal ?? 0} />
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              {summary?.matchedCount ?? 0} verified transactions
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            (summary?.mismatchCount ?? 0) === 0
              ? 'bg-muted/40 border-muted'
              : 'bg-red-50 border-red-200 text-destructive'
          }`}>
            <div className="text-[10px] uppercase font-bold opacity-80">Mismatches / Diff</div>
            <div className="text-lg font-bold mt-0.5">
              <Price amount={summary?.difference ?? 0} />
            </div>
            <div className="text-[10px] opacity-80 mt-0.5">
              {summary?.mismatchCount ?? 0} discrepancy items
            </div>
          </div>
        </div>

        {/* Status Callout Banner: never a green "zero mismatches" when the report did not load */}
        {!loading && !error && data && (
          <div>
            {mismatches.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-900">Zero Mismatches Detected</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    All Curevan paid transactions match Razorpay settlement amounts exactly for {selectedDate}.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-amber-900">
                    {mismatches.length} Reconciliation Mismatch{mismatches.length > 1 ? 'es' : ''} Flagged
                  </div>
                  <div className="text-xs text-amber-800 mt-0.5">
                    The discrepancies listed below require investigation. Please inspect payment gateways or transaction ledgers using the links provided.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mismatches Table */}
        {mismatches.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Discrepancy Details
            </div>
            <div className="border rounded-md overflow-hidden bg-white/50">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold">Type</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Reference</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Payment ID</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Curevan Amt</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Razorpay Amt</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold">Details</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mismatches.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/40">
                      <TableCell>{getMismatchBadge(item.type)}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{item.reference}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.paymentId || '—'}</TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {item.curevanAmount > 0 ? <Price amount={item.curevanAmount} /> : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {item.razorpayAmount > 0 ? <Price amount={item.razorpayAmount} /> : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.link ? (
                          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                            <Link href={item.link}>
                              View <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Collapsible Matched Payments Section */}
        {matched.length > 0 && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMatched(!showMatched)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5"
            >
              {showMatched ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showMatched ? 'Hide' : 'Show'} Matched Transactions ({matched.length})
            </Button>

            {showMatched && (
              <div className="mt-3 border rounded-md overflow-hidden bg-white/40">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">Type</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Reference</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Payment ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Razorpay Order</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matched.map((m, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{m.reference}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.paymentId}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.orderId || '—'}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-emerald-800">
                          <Price amount={m.amount} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
