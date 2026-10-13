'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilterBar } from "@/components/admin/FilterBar";
import { Price } from "@/components/money/price";
import React, { useState, useEffect, useMemo } from "react";
import type { PayoutItem, Therapist, Appointment } from "@/lib/types";
import { listPayoutItems } from "@/lib/repos/payouts";
import { listTherapists } from "@/lib/repos/therapists";
import { listAppointments } from "@/lib/repos/appointments";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileDown, 
  CalendarDays, 
  CalendarRange, 
  Calendar, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getSafeDate, downloadCsv } from "@/lib/utils";
import { ManualPaymentDialog } from "@/components/admin/ManualPaymentDialog";

export const dynamic = 'force-dynamic';

type EnrichedPayoutItem = PayoutItem & {
  therapistName?: string;
  therapistPan?: string;
  patientName?: string;
  therapyType?: string;
  transactionDate: Date;
};

interface PeriodSummary {
  key: string;
  label: string;
  date: Date;
  count: number;
  grossAmount: number;
  platformFeeAmount: number;
  gstOnPlatformFee: number;
  tdsDeducted: number;
  netAmount: number;
  therapistIds: Set<string | number>;
  therapistNames: string[];
  items: EnrichedPayoutItem[];
}

export default function FinancialReportPage() {
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [quickPeriod, setQuickPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [payoutData, therapistData, appointmentData] = await Promise.all([
          listPayoutItems(filters),
          listTherapists(),
          listAppointments().catch(() => [] as Appointment[]),
        ]);

        setPayoutItems(payoutData || []);
        setTherapists(therapistData || []);
        setAppointments(appointmentData || []);
      } catch (err) {
        console.error("Error loading therapy financial report data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Lookup maps for fast enrichment
  const therapistMap = useMemo(() => {
    const map = new Map<string, Therapist>();
    therapists.forEach((t) => {
      if (t.id != null) map.set(String(t.id), t);
      if (t.user_id != null) map.set(String(t.user_id), t);
    });
    return map;
  }, [therapists]);

  const appointmentMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointments.forEach((a) => {
      if (a.id != null) {
        map.set(String(a.id), a);
      }
    });
    return map;
  }, [appointments]);

  // Enriched raw transactions
  const enrichedData: EnrichedPayoutItem[] = useMemo(() => {
    return payoutItems.map((item) => {
      const appt = item.sourceId != null ? appointmentMap.get(String(item.sourceId)) : undefined;
      const tId = item.therapistId || appt?.therapistId;
      const therapist = tId != null ? therapistMap.get(String(tId)) : undefined;

      let tDate: Date | null = null;
      if (item.createdAt) {
        tDate = getSafeDate(item.createdAt);
      }
      if (!tDate && appt) {
        tDate = appt.date ? new Date(appt.date) : (appt.createdAt ? getSafeDate(appt.createdAt) : null);
      }
      if (!tDate && item.weekStart) {
        tDate = getSafeDate(item.weekStart);
      }
      if (!tDate) {
        tDate = new Date();
      }

      const resolvedTherapistName = 
        item.therapistName || 
        therapist?.name || 
        appt?.therapist || 
        (tId ? `Therapist #${tId}` : 'Therapist');

      return {
        ...item,
        therapistName: resolvedTherapistName,
        therapistPan: item.therapistPan || (therapist as any)?.tax?.pan || (therapist as any)?.pan || '-',
        patientName: appt?.patientName || (item.patientId ? `Patient #${item.patientId}` : 'Patient'),
        therapyType: appt?.therapyType || item.serviceTypeId || 'General Therapy',
        transactionDate: tDate,
      };
    });
  }, [payoutItems, therapistMap, appointmentMap]);

  // Apply quick period filter
  const filteredData = useMemo(() => {
    if (quickPeriod === 'all') return enrichedData;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (quickPeriod === 'today') {
      return enrichedData.filter((item) => item.transactionDate >= todayStart);
    }

    if (quickPeriod === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
      return enrichedData.filter((item) => item.transactionDate >= weekStart);
    }

    if (quickPeriod === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return enrichedData.filter((item) => item.transactionDate >= monthStart);
    }

    return enrichedData;
  }, [enrichedData, quickPeriod]);

  // High-level KPI totals
  const overallTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.gross += item.grossAmount || 0;
        acc.platformFee += item.platformFeeAmount || 0;
        acc.gstOnFee += item.gstOnPlatformFee || 0;
        acc.tds += item.tdsDeducted || 0;
        acc.netPayable += item.netAmount || 0;
        acc.count += 1;
        return acc;
      },
      { gross: 0, platformFee: 0, gstOnFee: 0, tds: 0, netPayable: 0, count: 0 }
    );
  }, [filteredData]);

  // Daily Summary Grouping
  const dailySummary: PeriodSummary[] = useMemo(() => {
    const map = new Map<string, PeriodSummary>();

    filteredData.forEach((item) => {
      const d = item.transactionDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          count: 0,
          grossAmount: 0,
          platformFeeAmount: 0,
          gstOnPlatformFee: 0,
          tdsDeducted: 0,
          netAmount: 0,
          therapistIds: new Set(),
          therapistNames: [],
          items: [],
        });
      }

      const entry = map.get(key)!;
      entry.count += 1;
      entry.grossAmount += item.grossAmount || 0;
      entry.platformFeeAmount += item.platformFeeAmount || 0;
      entry.gstOnPlatformFee += item.gstOnPlatformFee || 0;
      entry.tdsDeducted += item.tdsDeducted || 0;
      entry.netAmount += item.netAmount || 0;
      if (item.therapistId) entry.therapistIds.add(item.therapistId);
      if (item.therapistName && !entry.therapistNames.includes(item.therapistName)) {
        entry.therapistNames.push(item.therapistName);
      }
      entry.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredData]);

  // Weekly Summary Grouping
  const weeklySummary: PeriodSummary[] = useMemo(() => {
    const map = new Map<string, PeriodSummary>();

    filteredData.forEach((item) => {
      const d = new Date(item.transactionDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const key = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      const label = `${monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          date: monday,
          count: 0,
          grossAmount: 0,
          platformFeeAmount: 0,
          gstOnPlatformFee: 0,
          tdsDeducted: 0,
          netAmount: 0,
          therapistIds: new Set(),
          therapistNames: [],
          items: [],
        });
      }

      const entry = map.get(key)!;
      entry.count += 1;
      entry.grossAmount += item.grossAmount || 0;
      entry.platformFeeAmount += item.platformFeeAmount || 0;
      entry.gstOnPlatformFee += item.gstOnPlatformFee || 0;
      entry.tdsDeducted += item.tdsDeducted || 0;
      entry.netAmount += item.netAmount || 0;
      if (item.therapistId) entry.therapistIds.add(item.therapistId);
      if (item.therapistName && !entry.therapistNames.includes(item.therapistName)) {
        entry.therapistNames.push(item.therapistName);
      }
      entry.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredData]);

  // Monthly Summary Grouping
  const monthlySummary: PeriodSummary[] = useMemo(() => {
    const map = new Map<string, PeriodSummary>();

    filteredData.forEach((item) => {
      const d = item.transactionDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          date: new Date(d.getFullYear(), d.getMonth(), 1),
          count: 0,
          grossAmount: 0,
          platformFeeAmount: 0,
          gstOnPlatformFee: 0,
          tdsDeducted: 0,
          netAmount: 0,
          therapistIds: new Set(),
          therapistNames: [],
          items: [],
        });
      }

      const entry = map.get(key)!;
      entry.count += 1;
      entry.grossAmount += item.grossAmount || 0;
      entry.platformFeeAmount += item.platformFeeAmount || 0;
      entry.gstOnPlatformFee += item.gstOnPlatformFee || 0;
      entry.tdsDeducted += item.tdsDeducted || 0;
      entry.netAmount += item.netAmount || 0;
      if (item.therapistId) entry.therapistIds.add(item.therapistId);
      if (item.therapistName && !entry.therapistNames.includes(item.therapistName)) {
        entry.therapistNames.push(item.therapistName);
      }
      entry.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredData]);

  // Dynamic CSV Export
  const handleExport = () => {
    if (activeTab === 'daily') {
      const headers = [
        "Date",
        "Total Transactions",
        "Gross Revenue (INR)",
        "Platform Fee (INR)",
        "GST on Fee (INR)",
        "TDS Deducted (INR)",
        "Net Payable (INR)",
        "Active Therapists",
      ];
      const data = dailySummary.map((item) => [
        item.label,
        item.count,
        (item.grossAmount / 100).toFixed(2),
        (item.platformFeeAmount / 100).toFixed(2),
        (item.gstOnPlatformFee / 100).toFixed(2),
        (item.tdsDeducted / 100).toFixed(2),
        (item.netAmount / 100).toFixed(2),
        item.therapistNames.length > 0 ? item.therapistNames.join('; ') : item.therapistIds.size,
      ]);
      downloadCsv(headers, data, 'therapy-financial-daily-report.csv');
      return;
    }

    if (activeTab === 'weekly') {
      const headers = [
        "Week Period",
        "Total Transactions",
        "Gross Revenue (INR)",
        "Platform Fee (INR)",
        "GST on Fee (INR)",
        "TDS Deducted (INR)",
        "Net Payable (INR)",
        "Active Therapists",
      ];
      const data = weeklySummary.map((item) => [
        item.label,
        item.count,
        (item.grossAmount / 100).toFixed(2),
        (item.platformFeeAmount / 100).toFixed(2),
        (item.gstOnPlatformFee / 100).toFixed(2),
        (item.tdsDeducted / 100).toFixed(2),
        (item.netAmount / 100).toFixed(2),
        item.therapistNames.length > 0 ? item.therapistNames.join('; ') : item.therapistIds.size,
      ]);
      downloadCsv(headers, data, 'therapy-financial-weekly-report.csv');
      return;
    }

    if (activeTab === 'monthly') {
      const headers = [
        "Month",
        "Total Transactions",
        "Gross Revenue (INR)",
        "Platform Fee (INR)",
        "GST on Fee (INR)",
        "TDS Deducted (INR)",
        "Net Payable (INR)",
        "Active Therapists",
      ];
      const data = monthlySummary.map((item) => [
        item.label,
        item.count,
        (item.grossAmount / 100).toFixed(2),
        (item.platformFeeAmount / 100).toFixed(2),
        (item.gstOnPlatformFee / 100).toFixed(2),
        (item.tdsDeducted / 100).toFixed(2),
        (item.netAmount / 100).toFixed(2),
        item.therapistNames.length > 0 ? item.therapistNames.join('; ') : item.therapistIds.size,
      ]);
      downloadCsv(headers, data, 'therapy-financial-monthly-report.csv');
      return;
    }

    // Default: Detailed Transactions
    const headers = [
      "Payout Item ID",
      "Booking ID",
      "Transaction Date",
      "Therapist Name",
      "Therapist PAN",
      "Patient Name",
      "Therapy Type",
      "Gross Amount (Paise)",
      "Platform Fee Pct (%)",
      "Platform Fee (Paise)",
      "GST on Fee (Paise)",
      "TDS Deducted (Paise)",
      "Net Payable (Paise)",
      "Currency",
      "State",
    ];

    const data = filteredData.map((item) => [
      item.id || '',
      item.sourceId,
      item.transactionDate.toISOString().slice(0, 10),
      item.therapistName || '',
      item.therapistPan || '',
      item.patientName || '',
      item.therapyType || '',
      item.grossAmount,
      item.platformFeePct,
      item.platformFeeAmount,
      item.gstOnPlatformFee || 0,
      item.tdsDeducted || 0,
      item.netAmount,
      item.currency || 'INR',
      item.state,
    ]);

    downloadCsv(headers, data, 'therapy-financial-detailed-transactions.csv');
  };

  const renderSummaryTable = (
    data: PeriodSummary[],
    periodHeader: string,
    emptyMessage: string
  ) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{periodHeader}</TableHead>
          <TableHead className="text-center">Txn Count</TableHead>
          <TableHead>Therapist(s)</TableHead>
          <TableHead className="text-right">Gross Revenue</TableHead>
          <TableHead className="text-right">Platform Fee</TableHead>
          <TableHead className="text-right">GST on Fee</TableHead>
          <TableHead className="text-right">TDS Withheld</TableHead>
          <TableHead className="text-right">Net Payable</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9}>
              <Skeleton className="h-24 w-full" />
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map((row) => (
            <React.Fragment key={row.key}>
              <TableRow>
                <TableCell className="font-medium whitespace-nowrap">
                  {row.label}
                </TableCell>
                <TableCell className="text-center font-mono font-semibold">
                  <Badge variant="outline">{row.count}</Badge>
                </TableCell>
                <TableCell className="font-medium text-xs">
                  {row.therapistNames.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {row.therapistNames.map((name, i) => (
                        <span key={i} className="font-semibold text-foreground">
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-mono">
                      {row.therapistIds.size} therapist(s)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <Price amount={row.grossAmount} showDecimals />
                </TableCell>
                <TableCell className="text-right text-emerald-600 font-medium">
                  <Price amount={row.platformFeeAmount} showDecimals />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  <Price amount={row.gstOnPlatformFee} showDecimals />
                </TableCell>
                <TableCell className="text-right text-amber-600">
                  <Price amount={row.tdsDeducted} showDecimals />
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  <Price amount={row.netAmount} showDecimals />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {row.items.some((it) => it.state !== 'paid') ? (
                      row.items.length === 1 ? (
                        <ManualPaymentDialog
                          sourceId={row.items[0].sourceId}
                          grossAmount={row.items[0].grossAmount}
                          netAmount={row.items[0].netAmount}
                          therapistName={row.items[0].therapistName}
                          patientName={row.items[0].patientName}
                          onPaymentSuccess={() => {
                            setPayoutItems((prev) =>
                              prev.map((p) =>
                                p.sourceId === row.items[0].sourceId ? { ...p, state: 'paid' } : p
                              )
                            );
                          }}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1"
                          onClick={() => toggleExpand(row.key)}
                        >
                          <span>Pay ({row.items.filter((it) => it.state !== 'paid').length})</span>
                          {expandedKeys[row.key] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                        Paid
                      </Badge>
                    )}
                    {row.items.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-1.5"
                        onClick={() => toggleExpand(row.key)}
                      >
                        {expandedKeys[row.key] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {expandedKeys[row.key] && (
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                  <TableCell colSpan={9} className="p-3">
                    <div className="rounded-lg border bg-background p-3 space-y-2 shadow-sm">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Transactions in {row.label} ({row.items.length})
                      </div>
                      <div className="divide-y divide-border">
                        {row.items.map((item, idx) => (
                          <div key={item.id || `${item.sourceId}-${idx}`} className="flex flex-wrap items-center justify-between py-2 gap-2 text-xs">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded text-[11px]">#{item.sourceId}</span>
                              <div>
                                <span className="font-semibold text-foreground">{item.therapistName}</span>
                                {item.patientName && (
                                  <span className="text-muted-foreground ml-2">({item.patientName})</span>
                                )}
                                {item.therapyType && (
                                  <span className="text-muted-foreground text-[11px] block">{item.therapyType}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-bold text-primary">
                                  <Price amount={item.netAmount} showDecimals />
                                </div>
                                <div className="text-[10px] text-muted-foreground">Net Payout</div>
                              </div>
                              <Badge variant={item.state === 'paid' ? 'default' : 'secondary'} className="text-[11px]">
                                {item.state}
                              </Badge>
                              {item.state !== 'paid' ? (
                                <ManualPaymentDialog
                                  sourceId={item.sourceId}
                                  grossAmount={item.grossAmount}
                                  netAmount={item.netAmount}
                                  therapistName={item.therapistName}
                                  patientName={item.patientName}
                                  onPaymentSuccess={() => {
                                    setPayoutItems((prev) =>
                                      prev.map((p) =>
                                        p.sourceId === item.sourceId ? { ...p, state: 'paid' } : p
                                      )
                                    );
                                  }}
                                />
                              ) : (
                                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                                  Paid
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Therapy Financial Report</h1>
          <p className="text-muted-foreground">
            Daily, weekly, and monthly transactions breakdown with fee and tax accounting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" className="shadow-sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export {activeTab === 'all' ? 'Transactions CSV' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} CSV`}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        showDatePicker
        showTherapyFilters
        showSearch
        showAppointmentFilters
        onFilterChange={setFilters}
      />

      {/* Quick Period Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Quick Period:</span>
        <Button
          variant={quickPeriod === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickPeriod('all')}
        >
          All Records
        </Button>
        <Button
          variant={quickPeriod === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickPeriod('today')}
        >
          Today (Daily)
        </Button>
        <Button
          variant={quickPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickPeriod('week')}
        >
          This Week
        </Button>
        <Button
          variant={quickPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQuickPeriod('month')}
        >
          This Month
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium">
              Gross Volume
              <DollarSign className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-xl font-bold">
              {loading ? <Skeleton className="h-6 w-24" /> : <Price amount={overallTotals.gross} showDecimals />}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Total service charges billed
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium">
              Platform Commission
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-600">
              {loading ? <Skeleton className="h-6 w-24" /> : <Price amount={overallTotals.platformFee} showDecimals />}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Curevan fee revenue earned
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium">
              TDS & GST Withheld
              <Receipt className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-amber-600">
              {loading ? <Skeleton className="h-6 w-24" /> : <Price amount={overallTotals.tds + overallTotals.gstOnFee} showDecimals />}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            TDS deducted + GST on platform fee
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium">
              Net Therapist Payable
              <Users className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-blue-600">
              {loading ? <Skeleton className="h-6 w-24" /> : <Price amount={overallTotals.netPayable} showDecimals />}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Total therapist settlement
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium">
              Transactions Count
              <Receipt className="h-4 w-4 text-purple-600" />
            </CardDescription>
            <CardTitle className="text-xl font-bold text-purple-600">
              {loading ? <Skeleton className="h-6 w-16" /> : overallTotals.count}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Total completed sessions
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Transaction Breakdowns */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/70 p-1">
          <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" />
            <span>All Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" />
            <span>Daily Summary</span>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <CalendarRange className="h-4 w-4" />
            <span>Weekly Summary</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-4 w-4" />
            <span>Monthly Summary</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Detailed All Transactions */}
        <TabsContent value="all" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Detailed Transactions Ledger</CardTitle>
                  <CardDescription>
                    Individual therapy bookings, therapist shares, fee commissions, and taxes.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">{filteredData.length} Records</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Therapist</TableHead>
                    <TableHead>PAN</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">GST on Fee</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11}>
                        <Skeleton className="h-24 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No transactions found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, idx) => (
                      <TableRow key={item.id || `${item.sourceId}-${idx}`}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.transactionDate.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold">#{item.sourceId}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{item.therapistName}</div>
                          {item.therapyType && (
                            <div className="text-xs text-muted-foreground">{item.therapyType}</div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.therapistPan}</TableCell>
                        <TableCell className="text-right">
                          <Price amount={item.grossAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Price amount={item.platformFeeAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Price amount={item.gstOnPlatformFee || 0} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          <Price amount={item.tdsDeducted || 0} showDecimals />
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          <Price amount={item.netAmount} showDecimals />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.state === 'paid' ? 'default' : item.state === 'onHold' ? 'destructive' : 'secondary'}
                          >
                            {item.state}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {item.state !== 'paid' ? (
                            <ManualPaymentDialog
                              sourceId={item.sourceId}
                              grossAmount={item.grossAmount}
                              netAmount={item.netAmount}
                              therapistName={item.therapistName}
                              patientName={item.patientName}
                              onPaymentSuccess={() => {
                                setPayoutItems((prev) =>
                                  prev.map((p) =>
                                    p.sourceId === item.sourceId ? { ...p, state: 'paid' } : p
                                  )
                                );
                              }}
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Daily Summary */}
        <TabsContent value="daily" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Daily Financial Summary</CardTitle>
                  <CardDescription>
                    Aggregated daily transactions, platform commissions, and therapist net payables.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">{dailySummary.length} Days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {renderSummaryTable(dailySummary, 'Date', 'No daily transactions found for the selected period.')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Weekly Summary */}
        <TabsContent value="weekly" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Weekly Financial Summary</CardTitle>
                  <CardDescription>
                    Aggregated weekly batches (Monday through Sunday) for periodic payouts and audits.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">{weeklySummary.length} Weeks</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {renderSummaryTable(weeklySummary, 'Week Period', 'No weekly transactions found for the selected period.')}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Monthly Summary */}
        <TabsContent value="monthly" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Monthly Financial Summary</CardTitle>
                  <CardDescription>
                    Aggregated monthly performance for corporate reporting, tax compliance, and revenue tracking.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono">{monthlySummary.length} Months</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {renderSummaryTable(monthlySummary, 'Month & Year', 'No monthly transactions found for the selected period.')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
