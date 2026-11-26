'use client';

import { useCallback, useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Price } from '@/components/money/price';
import { Banknote, CheckCircle2, FileDown, MoreHorizontal, PauseCircle, PlayCircle, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import type { PayoutBatchRow } from '@/lib/types';
import { downloadPayoutStatement, exportPayoutCsv, listPayoutBatches } from '@/lib/repos/payouts';
import { approvePayoutBatch, holdPayoutBatch, markPayoutBatchPaid, releasePayoutBatch } from '@/lib/actions/payouts';

const STATUS_CLASS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800', approved: 'bg-indigo-100 text-indigo-800', paid: 'bg-green-100 text-green-800', on_hold: 'bg-yellow-100 text-yellow-800',
};
const STATUS_LABEL: Record<string, string> = { scheduled: 'Scheduled', approved: 'Approved', paid: 'Paid', on_hold: 'On hold' };

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

/** Weekly payouts: the Sunday job makes the batches; the Super Admin approves and records the bank transfer (UTR). */
export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSuper = (user?.roles ?? []).includes('admin.super');
  const [rows, setRows] = useState<PayoutBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState('');
  const [hold, setHold] = useState<{ id: number; reason: string } | null>(null);
  const [pay, setPay] = useState<{ id: number; utr: string } | null>(null);

  const load = useCallback(async () => { setLoading(true); setRows(await listPayoutBatches()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (label: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    const res = await fn();
    if (!res.success) { toast({ variant: 'destructive', title: 'Not done', description: res.error }); return false; }
    toast({ title: label });
    load();
    return true;
  };

  const exportCsv = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) { toast({ variant: 'destructive', title: 'Choose the week', description: 'Pick the Monday of the week to export.' }); return; }
    const blob = await exportPayoutCsv(week);
    if (!blob) { toast({ variant: 'destructive', title: 'Export failed' }); return; }
    saveBlob(blob, `curevan-payouts-${week}.csv`);
  };

  const statement = async (id: number) => {
    const blob = await downloadPayoutStatement(id);
    if (blob) saveBlob(blob, `curevan-payout-statement-${id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Therapist Payouts</h1>
          <p className="text-muted-foreground text-sm">Batches are made every Sunday night. Approve, export the bank file, then record the UTR.</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-sm">Week (Monday)<Input type="date" value={week} onChange={(e) => setWeek(e.target.value)} /></label>
          <Button onClick={exportCsv}><FileDown className="mr-2 h-4 w-4" />Export bank CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Payout batches</CardTitle><CardDescription>One batch per therapist per week.</CardDescription></CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? <Skeleton className="h-40 w-full" /> : rows.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <Banknote className="h-10 w-10 text-muted-foreground opacity-60" />
              <p className="text-muted-foreground">No batches yet. They appear after the Sunday run, once PCRs are locked.</p>
            </div>
          ) : (
            <div className="rounded-md border-x sm:border overflow-x-auto">
              <Table className="min-w-[900px] lg:min-w-full">
                <TableHeader>
                  <TableRow><TableHead>Week</TableHead><TableHead>Therapist</TableHead><TableHead>Gross</TableHead><TableHead>Fee + GST</TableHead><TableHead>TDS</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Bank ref</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.weekStart} to {b.weekEnd}</TableCell>
                      <TableCell>{b.therapistName}<span className="block text-xs text-muted-foreground">{b.itemCount} line(s)</span></TableCell>
                      <TableCell><Price amount={b.gross} showDecimals /></TableCell>
                      <TableCell><Price amount={b.platformFee + b.gstOnFee} showDecimals /></TableCell>
                      <TableCell><Price amount={b.tds} showDecimals /></TableCell>
                      <TableCell className="font-semibold"><Price amount={b.net} showDecimals /></TableCell>
                      <TableCell>
                        <Badge className={cn(STATUS_CLASS[b.status], 'capitalize')}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                        {b.status === 'on_hold' && b.holdReason && <span className="block text-xs text-muted-foreground">{b.holdReason}</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.utr}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for batch ${b.id}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isSuper && b.status === 'scheduled' && <DropdownMenuItem onClick={() => run('Batch approved', () => approvePayoutBatch(b.id))}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</DropdownMenuItem>}
                            {isSuper && b.status === 'approved' && <DropdownMenuItem onClick={() => setPay({ id: b.id, utr: '' })}><Banknote className="mr-2 h-4 w-4" />Mark paid (UTR)</DropdownMenuItem>}
                            {b.status !== 'paid' && b.status !== 'on_hold' && <DropdownMenuItem onClick={() => setHold({ id: b.id, reason: '' })}><PauseCircle className="mr-2 h-4 w-4" />Hold</DropdownMenuItem>}
                            {b.status === 'on_hold' && <DropdownMenuItem onClick={() => run('Batch released', () => releasePayoutBatch(b.id))}><PlayCircle className="mr-2 h-4 w-4" />Release</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => statement(b.id)}><Receipt className="mr-2 h-4 w-4" />Statement (PDF)</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!hold} onOpenChange={(o) => !o && setHold(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hold this payout</DialogTitle><DialogDescription>The therapist is not paid until it is released. The reason is kept.</DialogDescription></DialogHeader>
          <Textarea value={hold?.reason ?? ''} onChange={(e) => hold && setHold({ ...hold, reason: e.target.value })} placeholder="Reason" maxLength={300} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setHold(null)}>Cancel</Button>
            <Button disabled={(hold?.reason.trim().length ?? 0) < 3} onClick={async () => { if (hold && (await run('Batch put on hold', () => holdPayoutBatch(hold.id, hold.reason.trim())))) setHold(null); }}>Hold</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record the bank transfer</DialogTitle><DialogDescription>Enter the UTR the bank gave you. The therapist is told their payout was sent.</DialogDescription></DialogHeader>
          <Input value={pay?.utr ?? ''} onChange={(e) => pay && setPay({ ...pay, utr: e.target.value.trim() })} placeholder="UTR reference" maxLength={30} aria-label="UTR reference" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPay(null)}>Cancel</Button>
            <Button disabled={!/^[A-Za-z0-9]{6,30}$/.test(pay?.utr ?? '')} onClick={async () => { if (pay && (await run('Marked paid', () => markPayoutBatchPaid(pay.id, pay.utr)))) setPay(null); }}>Mark paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
