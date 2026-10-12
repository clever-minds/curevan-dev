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
import { useState, useEffect, useMemo } from "react";
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
  Users 
} from "lucide-react";
import { getSafeDate, downloadCsv } from "@/lib/utils";

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
}

export default function FinancialReportPage() {
  const [payoutItems, setPayoutItems] = useState<PayoutItem[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [quickPeriod, setQuickPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

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
      map.set(String(t.id), t);
    });
    return map;
  }, [therapists]);

  const appointmentMap = useMemo(() => {
    const map = new Map<number, Appointment>();
    appointments.forEach((a) => {
      map.set(a.id, a);
    });
    return map;
  }, [appointments]);

  // Enriched raw transactions
  const enrichedData: EnrichedPayoutItem[] = useMemo(() => {
    return payoutItems.map((item) => {
      const appt = appointmentMap.get(item.sourceId);
      const therapist = therapistMap.get(String(item.therapistId));

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

      return {
        ...item,
        therapistName: item.therapistName || therapist?.name || appt?.therapist || `Therapist #${item.therapistId}`,
        therapistPan: item.therapistPan || therapist?.tax?.pan || therapist?.pan || '-',
        patientName: appt?.patientName || `Patient #${item.patientId}`,
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
        item.therapistIds.size,
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
        item.therapistIds.size,
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
        item.therapistIds.size,
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <Skeleton className="h-24 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Txn Count</TableHead>
                    <TableHead className="text-center">Therapists</TableHead>
                    <TableHead className="text-right">Gross Revenue</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">GST on Fee</TableHead>
                    <TableHead className="text-right">TDS Withheld</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-24 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : dailySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No daily transactions found for the selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailySummary.map((day) => (
                      <TableRow key={day.key}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {day.label}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold">
                          <Badge variant="outline">{day.count}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {day.therapistIds.size}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <Price amount={day.grossAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">
                          <Price amount={day.platformFeeAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Price amount={day.gstOnPlatformFee} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          <Price amount={day.tdsDeducted} showDecimals />
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          <Price amount={day.netAmount} showDecimals />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week Period</TableHead>
                    <TableHead className="text-center">Txn Count</TableHead>
                    <TableHead className="text-center">Therapists</TableHead>
                    <TableHead className="text-right">Gross Revenue</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">GST on Fee</TableHead>
                    <TableHead className="text-right">TDS Withheld</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-24 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : weeklySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No weekly transactions found for the selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    weeklySummary.map((week) => (
                      <TableRow key={week.key}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {week.label}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold">
                          <Badge variant="outline">{week.count}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {week.therapistIds.size}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <Price amount={week.grossAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">
                          <Price amount={week.platformFeeAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Price amount={week.gstOnPlatformFee} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          <Price amount={week.tdsDeducted} showDecimals />
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          <Price amount={week.netAmount} showDecimals />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month & Year</TableHead>
                    <TableHead className="text-center">Txn Count</TableHead>
                    <TableHead className="text-center">Therapists</TableHead>
                    <TableHead className="text-right">Gross Revenue</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">GST on Fee</TableHead>
                    <TableHead className="text-right">TDS Withheld</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-24 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : monthlySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No monthly transactions found for the selected period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlySummary.map((month) => (
                      <TableRow key={month.key}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {month.label}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold">
                          <Badge variant="outline">{month.count}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-muted-foreground">
                          {month.therapistIds.size}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <Price amount={month.grossAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">
                          <Price amount={month.platformFeeAmount} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <Price amount={month.gstOnPlatformFee} showDecimals />
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          <Price amount={month.tdsDeducted} showDecimals />
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          <Price amount={month.netAmount} showDecimals />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
