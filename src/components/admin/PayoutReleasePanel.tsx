'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  FileDown,
  Upload,
  AlertTriangle,
  RotateCw,
  FileText,
  DollarSign,
  Layers,
  Percent,
  Check,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { Price } from '@/components/money/price';
import type { PayoutBatchRow } from '@/lib/types';
import {
  listPayoutBatches,
  approvePayoutBatch,
  holdPayoutBatch,
  releasePayoutBatch,
  markPayoutBatchPaid,
  exportPayoutCsv,
  downloadPayoutStatement,
} from '@/lib/repos/payouts';

/** Computes the Monday (YYYY-MM-DD) of the week containing today in IST */
function getThisMonday(): string {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const day = istDate.getUTCDay(); // 0 is Sun, 1 is Mon...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(istDate.getTime() + diff * 24 * 60 * 60 * 1000);
  return monday.toISOString().slice(0, 10);
}

export function PayoutReleasePanel() {
  const [selectedWeek, setSelectedWeek] = useState<string>(getThisMonday);
  const [batches, setBatches] = useState<PayoutBatchRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hold dialog state
  const [holdModal, setHoldModal] = useState<{ open: boolean; batchId: number | null; reason: string }>({
    open: false,
    batchId: null,
    reason: '',
  });

  // Mark Paid dialog state
  const [markPaidModal, setMarkPaidModal] = useState<{ open: boolean; batchId: number | null; utr: string }>({
    open: false,
    batchId: null,
    utr: '',
  });

  // Hidden file input for bulk CSV upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await listPayoutBatches({ week: selectedWeek });
      setBatches(data);
    } catch (err: any) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [selectedWeek]);

  // Totals
  const totals = useMemo(() => {
    return batches.reduce(
      (acc, b) => {
        acc.count += 1;
        acc.gross += Number(b.gross || 0);
        acc.fee += Number(b.platformFee || 0);
        acc.gst += Number(b.gstOnFee || 0);
        acc.tds += Number(b.tds || 0);
        acc.net += Number(b.net || 0);
        if (b.status === 'scheduled') acc.scheduled += 1;
        if (b.status === 'approved') acc.approved += 1;
        if (b.status === 'on_hold') acc.onHold += 1;
        if (b.status === 'paid') acc.paid += 1;
        return acc;
      },
      { count: 0, gross: 0, fee: 0, gst: 0, tds: 0, net: 0, scheduled: 0, approved: 0, onHold: 0, paid: 0 }
    );
  }, [batches]);

  // Actions
  const handleApproveAll = async () => {
    const scheduled = batches.filter((b) => b.status === 'scheduled');
    if (!scheduled.length) return;
    setActionLoading(true);
    setFeedback(null);
    let successCount = 0;
    let failCount = 0;

    for (const b of scheduled) {
      const res = await approvePayoutBatch(b.id);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (failCount === 0) {
      setFeedback({ type: 'success', message: `Successfully approved all ${successCount} scheduled batches.` });
    } else {
      setFeedback({ type: 'error', message: `Approved ${successCount} batches, but ${failCount} failed.` });
    }
    setActionLoading(false);
    await fetchBatches();
  };

  const handleExportCsv = async () => {
    if (!selectedWeek) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const blob = await exportPayoutCsv(selectedWeek);
      if (!blob) {
        setFeedback({ type: 'error', message: 'No approved payouts available to export for this week.' });
        setActionLoading(false);
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curevan-payouts-${selectedWeek}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: `Downloaded payout bank transfer CSV for week of ${selectedWeek}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to export CSV: ' + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleApprove = async (batchId: number) => {
    setActionLoading(true);
    const res = await approvePayoutBatch(batchId);
    if (res.success) {
      setFeedback({ type: 'success', message: `Batch #${batchId} approved.` });
      await fetchBatches();
    } else {
      setFeedback({ type: 'error', message: res.error || `Failed to approve batch #${batchId}` });
    }
    setActionLoading(false);
  };

  const handleConfirmHold = async () => {
    if (!holdModal.batchId || !holdModal.reason.trim()) return;
    setActionLoading(true);
    const res = await holdPayoutBatch(holdModal.batchId, holdModal.reason.trim());
    if (res.success) {
      setFeedback({ type: 'success', message: `Batch #${holdModal.batchId} put on hold.` });
      setHoldModal({ open: false, batchId: null, reason: '' });
      await fetchBatches();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to put batch on hold' });
    }
    setActionLoading(false);
  };

  const handleSingleRelease = async (batchId: number) => {
    setActionLoading(true);
    const res = await releasePayoutBatch(batchId);
    if (res.success) {
      setFeedback({ type: 'success', message: `Batch #${batchId} released back to scheduled.` });
      await fetchBatches();
    } else {
      setFeedback({ type: 'error', message: res.error || `Failed to release batch #${batchId}` });
    }
    setActionLoading(false);
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidModal.batchId || !markPaidModal.utr.trim()) return;
    setActionLoading(true);
    const res = await markPayoutBatchPaid(markPaidModal.batchId, { utr: markPaidModal.utr.trim() });
    if (res.success) {
      setFeedback({ type: 'success', message: `Batch #${markPaidModal.batchId} marked as paid (UTR: ${markPaidModal.utr.trim()}).` });
      setMarkPaidModal({ open: false, batchId: null, utr: '' });
      await fetchBatches();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to mark batch as paid' });
    }
    setActionLoading(false);
  };

  const handleDownloadPdf = async (batchId: number) => {
    try {
      const blob = await downloadPayoutStatement(batchId);
      if (!blob) {
        setFeedback({ type: 'error', message: `Failed to download statement for batch #${batchId}` });
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curevan-payout-statement-${batchId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'PDF statement error: ' + err.message });
    }
  };

  // Bulk CSV upload for UTRs
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActionLoading(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setFeedback({ type: 'error', message: 'Uploaded CSV file was empty.' });
        setActionLoading(false);
        return;
      }

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setFeedback({ type: 'error', message: 'CSV must contain at least a header and one row.' });
        setActionLoading(false);
        return;
      }

      // Identify column indices
      const headerCols = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
      const batchIdIdx = headerCols.findIndex((h) => h.includes('batch') || h === 'id');
      const utrIdx = headerCols.findIndex((h) => h.includes('utr') || h.includes('ref') || h.includes('bank'));

      if (batchIdIdx === -1 || utrIdx === -1) {
        setFeedback({
          type: 'error',
          message: 'CSV header must include "Batch id" and "UTR" columns.',
        });
        setActionLoading(false);
        return;
      }

      let markedCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const batchId = parseInt(row[batchIdIdx], 10);
        const utr = row[utrIdx];
        if (batchId && utr) {
          const res = await markPayoutBatchPaid(batchId, { utr });
          if (res.success) {
            markedCount++;
          } else {
            errorCount++;
          }
        }
      }

      setFeedback({
        type: errorCount === 0 ? 'success' : 'error',
        message: `Processed bulk UTRs: ${markedCount} batches marked paid, ${errorCount} errors.`,
      });
      setActionLoading(false);
      await fetchBatches();
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">Scheduled</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-blue-600 text-white">Approved</Badge>;
      case 'on_hold':
        return <Badge variant="destructive">On Hold</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="shadow-sm border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Friday Payout Release Panel
              </CardTitle>
              <Badge variant="outline" className="text-xs uppercase font-semibold">Weekly Cycle</Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              Approve weekly therapist batches, download bank-ready transfer CSV, and record bank UTR references.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md border text-xs">
              <span className="text-muted-foreground font-medium">Week:</span>
              <input
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBatches}
              disabled={loading || actionLoading}
              className="h-8"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {feedback && (
          <div
            className={`p-3 rounded-md text-xs font-medium flex items-center justify-between ${
              feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Current Week Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Batches</div>
            <div className="text-lg font-bold mt-0.5">{totals.count}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {totals.scheduled} sched • {totals.approved} apprv
            </div>
          </div>
          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Gross Amount</div>
            <div className="text-lg font-bold mt-0.5"><Price amount={totals.gross} /></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Sessions billed</div>
          </div>
          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Platform Fee</div>
            <div className="text-lg font-bold mt-0.5"><Price amount={totals.fee} /></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Curevan share</div>
          </div>
          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">GST on Fee</div>
            <div className="text-lg font-bold mt-0.5"><Price amount={totals.gst} /></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">18% GST slab</div>
          </div>
          <div className="p-3 bg-muted/40 rounded-lg border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">TDS Deducted</div>
            <div className="text-lg font-bold mt-0.5"><Price amount={totals.tds} /></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Sec 194J threshold</div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-[10px] uppercase font-bold text-primary">Net Payable</div>
            <div className="text-lg font-bold text-primary mt-0.5"><Price amount={totals.net} /></div>
            <div className="text-[10px] text-primary/80 mt-0.5">{totals.paid} paid of {totals.count}</div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground font-medium">
            Showing batches for week starting <span className="font-bold text-foreground">{selectedWeek}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleApproveAll}
              disabled={actionLoading || totals.scheduled === 0}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" /> Approve all scheduled ({totals.scheduled})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={actionLoading || totals.approved === 0}
              className="h-8 font-medium"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export Bank CSV ({totals.approved})
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={actionLoading}
              className="h-8 font-medium"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload UTRs CSV
            </Button>
          </div>
        </div>

        {/* Status Ledger Table */}
        <div className="border rounded-md overflow-hidden bg-white/50">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold">Batch ID</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Therapist</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Sessions</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Gross</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Fee</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">GST</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">TDS</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Net</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-center">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold">Bank Ref (UTR)</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-xs">
                    Loading payout ledger...
                  </TableCell>
                </TableRow>
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-xs">
                    No payout batches found for the week of {selectedWeek}.
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs font-bold">#{batch.id}</TableCell>
                    <TableCell className="font-medium text-xs">
                      <div>{batch.therapistName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">ID: {batch.therapistId}</div>
                    </TableCell>
                    <TableCell className="text-center text-xs">{batch.itemCount}</TableCell>
                    <TableCell className="text-right text-xs"><Price amount={batch.gross} /></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground"><Price amount={batch.platformFee} /></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground"><Price amount={batch.gstOnFee} /></TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground"><Price amount={batch.tds} /></TableCell>
                    <TableCell className="text-right text-xs font-bold text-primary"><Price amount={batch.net} /></TableCell>
                    <TableCell className="text-center">{getStatusBadge(batch.status)}</TableCell>
                    <TableCell className="text-xs">
                      {batch.utr ? (
                        <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {batch.utr}
                        </span>
                      ) : batch.holdReason ? (
                        <span className="text-[11px] text-destructive line-clamp-1" title={batch.holdReason}>
                          {batch.holdReason}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {batch.status === 'scheduled' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
                              onClick={() => handleSingleApprove(batch.id)}
                              disabled={actionLoading}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
                              onClick={() => setHoldModal({ open: true, batchId: batch.id, reason: '' })}
                              disabled={actionLoading}
                            >
                              Hold
                            </Button>
                          </>
                        )}

                        {batch.status === 'on_hold' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => handleSingleRelease(batch.id)}
                            disabled={actionLoading}
                          >
                            Release
                          </Button>
                        )}

                        {batch.status === 'approved' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-7 px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setMarkPaidModal({ open: true, batchId: batch.id, utr: '' })}
                            disabled={actionLoading}
                          >
                            Mark Paid
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                          title="Download PDF statement"
                          onClick={() => handleDownloadPdf(batch.id)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Hold Reason Modal */}
      <Dialog open={holdModal.open} onOpenChange={(open) => !open && setHoldModal({ open: false, batchId: null, reason: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <PauseCircle className="w-5 h-5" /> Put Batch #{holdModal.batchId} On Hold
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a reason for withholding payment (e.g. pending clinical audit, missing PAN/IFSC, patient dispute).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-semibold mb-1 block">Reason for hold:</label>
            <Input
              value={holdModal.reason}
              onChange={(e) => setHoldModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Bank IFSC code verification pending"
              className="text-xs"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHoldModal({ open: false, batchId: null, reason: '' })}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmHold}
              disabled={actionLoading || holdModal.reason.trim().length < 3}
            >
              Confirm Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={markPaidModal.open} onOpenChange={(open) => !open && setMarkPaidModal({ open: false, batchId: null, utr: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" /> Mark Batch #{markPaidModal.batchId} Paid
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter the bank transfer UTR / reference number provided by your netbanking portal (6-30 letters or digits).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-semibold mb-1 block">Bank UTR Reference:</label>
            <Input
              value={markPaidModal.utr}
              onChange={(e) => setMarkPaidModal((prev) => ({ ...prev, utr: e.target.value }))}
              placeholder="e.g. CMS9876543210"
              className="text-xs font-mono uppercase"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMarkPaidModal({ open: false, batchId: null, utr: '' })}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmMarkPaid}
              disabled={actionLoading || !/^[A-Za-z0-9]{6,30}$/.test(markPaidModal.utr.trim())}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
