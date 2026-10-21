'use client';

import Link from 'next/link';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { downloadReportPdf } from '@/lib/repos/clinical';
import { downloadPcrPdf } from '@/lib/repos/pcr';
import type { PatientDashboard } from '@/lib/repos/patientDashboard';

const day = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/** The last 3 session records and progress reports, each with a PDF. */
export function RecentRecords({ records }: { records: PatientDashboard['records'] }) {
  const { toast } = useToast();
  const failed = () => toast({ variant: 'destructive', title: 'Could not download', description: 'The file is not available right now.' });
  const empty = records.pcrs.length === 0 && records.reports.length === 0;

  return (
    <Card data-testid="recent-records">
      <CardHeader><CardTitle className="text-base">Recent health records</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {empty && <p className="text-sm text-muted-foreground">Your session records and reports will appear here after your first visit.</p>}
        {records.pcrs.map((p) => (
          <div key={`pcr-${p.appointmentId}`} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
            <span className="min-w-0 truncate">Session record, {day(p.date)}{p.therapistName ? ` with ${p.therapistName}` : ''}</span>
            <Button size="sm" variant="outline" aria-label={`Download session record of ${day(p.date)}`} onClick={async () => { const b = await downloadPcrPdf(p.appointmentId); if (b) save(b, `curevan-session-record-${p.appointmentId}.pdf`); else failed(); }}><FileDown className="h-4 w-4" /></Button>
          </div>
        ))}
        {records.reports.map((r) => (
          <div key={`rep-${r.id}`} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
            <span className="min-w-0 truncate">{r.reportType === 'discharge' ? 'Discharge summary' : 'Progress report'}, {day(r.createdAt)}</span>
            <Button size="sm" variant="outline" aria-label={`Download ${r.reportType} report of ${day(r.createdAt)}`} onClick={async () => { const b = await downloadReportPdf(r.id); if (b) save(b, `curevan-${r.reportType}-report-${r.id}.pdf`); else failed(); }}><FileDown className="h-4 w-4" /></Button>
          </div>
        ))}
        {!empty && <Link href="/dashboard/patient/health-records" className="inline-block text-sm text-primary underline">All health records</Link>}
      </CardContent>
    </Card>
  );
}
