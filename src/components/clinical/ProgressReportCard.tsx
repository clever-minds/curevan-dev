'use client';

import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ProgressReportRow } from '@/lib/types';
import { downloadReportPdf } from '@/lib/repos/clinical';

export function ProgressReportCard({ reports }: { reports: ProgressReportRow[] }) {
  const { toast } = useToast();

  const download = async (r: ProgressReportRow) => {
    const blob = await downloadReportPdf(r.id);
    if (!blob) {
      toast({ variant: 'destructive', title: 'Could not download', description: 'The report is not available right now.' });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curevan-${r.reportType}-report-${r.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!reports.length) return <p className="text-sm text-muted-foreground">Reports appear here after each review and at discharge.</p>;
  return (
    <ul className="divide-y rounded-md border">
      {reports.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
          <span>{r.reportType === 'discharge' ? 'Discharge summary' : `Progress report after session ${r.sessionNumber ?? ''}`}<span className="ml-2 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span></span>
          <Button size="sm" variant="outline" onClick={() => download(r)}><FileDown className="mr-2 h-4 w-4" />Download PDF</Button>
        </li>
      ))}
    </ul>
  );
}
