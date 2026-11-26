'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { listAllPrivacyRequests, updatePrivacyRequest, type PrivacyRequestRow } from '@/lib/repos/privacy';

const TYPE_LABEL: Record<string, string> = { export: 'Copy of data', correction: 'Correction', erasure: 'Erasure', withdraw_consent: 'Withdraw consent' };

/** Super Admin: data rights requests of users. Nothing is deleted by this page: the Super Admin decides against the retention schedule. */
export default function PrivacyRequestsPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<PrivacyRequestRow[] | null>(null);
  const load = React.useCallback(async () => setRows(await listAllPrivacyRequests()), []);
  React.useEffect(() => { load(); }, [load]);

  const act = async (r: PrivacyRequestRow, status: PrivacyRequestRow['status']) => {
    let note: string | undefined;
    if (status === 'done' || status === 'rejected') {
      const text = prompt(status === 'done' ? 'What was done, and what was kept and why? (the user sees this)' : 'Why can it not be done? (the user sees this)');
      if (!text || text.trim().length < 3) return;
      note = text.trim();
    }
    const res = await updatePrivacyRequest(r.id, status, note);
    if (!res.ok) { toast({ variant: 'destructive', title: 'Not saved', description: res.error }); return; }
    toast({ title: 'Request updated' });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Privacy Requests</h1>
        <p className="text-sm text-muted-foreground">Requests under the DPDP Act. Check docs/DATA_RETENTION.md before you delete anything.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">All requests</CardTitle><CardDescription>Open ones first.</CardDescription></CardHeader>
        <CardContent className="p-0 sm:p-6">
          {rows === null ? <Skeleton className="h-32 w-full" /> : rows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No requests yet.</p> : (
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Request</TableHead><TableHead>Note</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.userName ?? `#${r.userId}`}<span className="block text-xs text-muted-foreground">{r.userEmail}</span></TableCell>
                      <TableCell>{TYPE_LABEL[r.type] ?? r.type}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm" title={r.note ?? ''}>{r.note}</TableCell>
                      <TableCell>{new Date(r.createdAt).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell><Badge variant={r.status === 'open' ? 'destructive' : 'secondary'}>{r.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="space-x-2 text-right">
                        {r.status === 'open' && <Button size="sm" variant="outline" onClick={() => act(r, 'in_progress')}>Start</Button>}
                        {(r.status === 'open' || r.status === 'in_progress') && <>
                          <Button size="sm" onClick={() => act(r, 'done')}>Done</Button>
                          <Button size="sm" variant="outline" onClick={() => act(r, 'rejected')}>Cannot do</Button>
                        </>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
