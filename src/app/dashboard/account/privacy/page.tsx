'use client';

import * as React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { createPrivacyRequest, downloadMyData, listMyPrivacyRequests, type PrivacyRequestRow, type PrivacyRequestType } from '@/lib/repos/privacy';

const TYPE_LABEL: Record<PrivacyRequestType, string> = { export: 'Copy of my data', correction: 'Correction', erasure: 'Erasure', withdraw_consent: 'Marketing consent withdrawn' };
const STATUS_LABEL: Record<PrivacyRequestRow['status'], string> = { open: 'Open', in_progress: 'In progress', done: 'Done', rejected: 'Not possible' };

/** Your data rights under the DPDP Act: a copy of your data, correction, erasure, stop marketing. */
export default function PrivacyPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<PrivacyRequestRow[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const load = React.useCallback(async () => setRows(await listMyPrivacyRequests()), []);
  React.useEffect(() => { load(); }, [load]);

  const submit = async (type: PrivacyRequestType, text?: string, done?: string) => {
    setBusy(type);
    const res = await createPrivacyRequest(type, text);
    setBusy(null);
    if (!res.ok) { toast({ variant: 'destructive', title: 'Not saved', description: res.error }); return; }
    toast({ title: done ?? 'Request received', description: 'You can follow it in the list below.' });
    if (type === 'correction') setNote('');
    load();
  };

  const download = async () => {
    setBusy('export');
    const text = await downloadMyData();
    setBusy(null);
    if (!text) { toast({ variant: 'destructive', title: 'Could not prepare your data' }); return; }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'curevan-my-data.json'; a.click();
    URL.revokeObjectURL(url);
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Privacy &amp; Data</h1>
        <p className="text-sm text-muted-foreground">You decide what happens to your personal data. Medical records are kept for the period the law and our retention schedule require. [OWNER TO CONFIRM: final wording]</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Download my data</CardTitle><CardDescription>Your profile, bookings, orders, session record summaries and consents, as a JSON file.</CardDescription></CardHeader>
        <CardContent><Button onClick={download} disabled={busy === 'export'}>{busy === 'export' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download my data</Button></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ask for a correction</CardTitle><CardDescription>Tell us what is wrong and what it should say.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="For example: my date of birth is 12 March 1990" aria-label="What should be corrected" />
          <Button onClick={() => submit('correction', note.trim())} disabled={busy === 'correction' || note.trim().length < 5}>Send correction request</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Stop marketing messages</CardTitle><CardDescription>Withdraw your consent to offers and promotions. Messages about your bookings and orders continue.</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={() => submit('withdraw_consent', undefined, 'Marketing consent withdrawn')} disabled={busy === 'withdraw_consent'}>Withdraw marketing consent</Button></CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader><CardTitle className="text-base">Erase my data</CardTitle><CardDescription>Our team reviews the request. Records we must keep by law (medical records, tax and payment records) stay for the period in our retention schedule; the rest is deleted.</CardDescription></CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">Request erasure</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Request erasure of your data?</AlertDialogTitle><AlertDialogDescription>Nothing is deleted straight away. We review your request and tell you what was deleted and what we have to keep, and why.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => submit('erasure')}>Send request</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">My requests</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">You have not made any request yet.</p>}
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
              <span>{TYPE_LABEL[r.type]} <span className="text-muted-foreground">({new Date(r.createdAt).toLocaleDateString('en-IN')})</span></span>
              <Badge variant={r.status === 'done' ? 'secondary' : 'outline'}>{STATUS_LABEL[r.status]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
