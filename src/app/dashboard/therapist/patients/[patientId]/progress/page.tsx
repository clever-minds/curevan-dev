'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { ProgressChart } from '@/components/clinical/ProgressChart';
import { GoalProgressList } from '@/components/clinical/GoalProgressList';
import { ProgressReportCard } from '@/components/clinical/ProgressReportCard';
import type { Appointment, PlanProgress, ProgressReportRow } from '@/lib/types';
import { getPlanProgress, listPlanReports, listPlans } from '@/lib/repos/clinical';
import { listAppointmentsForUser } from '@/lib/repos/appointments';

/** Therapist view: the same charts as the patient, plus every raw value and the Start review / Discharge shortcuts. */
export default function TherapistPatientProgressPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [openBooking, setOpenBooking] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const plans = await listPlans({ patientId: Number(patientId) });
      const current = plans.find((p) => p.status === 'active') ?? plans[0];
      if (current) {
        const [prog, reps] = await Promise.all([getPlanProgress(current.id), listPlanReports(current.id)]);
        setProgress(prog);
        setReports(reps);
      }
      const appts = await listAppointmentsForUser(user.id, 'therapist');
      setOpenBooking(appts.find((a) => String(a.patientId) === String(patientId) && ['in_progress', 'pcr_pending', 'arrived', 'therapist_on_the_way', 'confirmed'].includes(a.status)) ?? null);
      setLoading(false);
    })();
  }, [user, patientId]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!progress) return <Card><CardContent className="py-10 text-center text-muted-foreground">No treatment plan for this patient yet (or you do not have access to it). Start one from the initial assessment PCR.</CardContent></Card>;

  const rows = progress.measures.flatMap((m) => m.series.map((s) => ({ measure: m.name, side: s.side || m.side, item: s.item || m.item, ...s }))).sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">{progress.plan.condition}</h1>
          <p className="text-muted-foreground">{progress.sessionsDone} of {progress.plannedSessions ?? '-'} sessions | {progress.plan.status.replace('_', ' ')}</p>
          {progress.stalled && <Badge variant="destructive" className="mt-2">Stalled: no improvement over the last two checkpoints</Badge>}
        </div>
        {openBooking && progress.plan.status === 'active' && (
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href={`/pcr/${openBooking.id}?type=review`}>Start review</Link></Button>
            <Button asChild variant="outline"><Link href={`/pcr/${openBooking.id}?type=discharge`}>Discharge</Link></Button>
          </div>
        )}
      </div>

      <Card><CardHeader><CardTitle>Goals</CardTitle></CardHeader><CardContent><GoalProgressList goals={progress.goals} /></CardContent></Card>

      <div className="grid gap-4 md:grid-cols-2">
        {progress.measures.filter((m) => m.series.length > 0).map((m) => (
          <Card key={m.planMeasureId}><CardContent className="pt-6"><ProgressChart measure={m} /></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All recorded values</CardTitle><CardDescription>Newest first.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Session</TableHead><TableHead>Measure</TableHead><TableHead>Side</TableHead><TableHead>Value</TableHead><TableHead>Point</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}><TableCell>{new Date(r.date).toLocaleDateString()}</TableCell><TableCell>{r.sessionNumber ?? '-'}</TableCell><TableCell>{r.measure}{r.item ? ` - ${r.item}` : ''}</TableCell><TableCell>{r.side || '-'}</TableCell><TableCell>{r.value}</TableCell><TableCell>{r.point}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Reports</CardTitle></CardHeader><CardContent><ProgressReportCard reports={reports} /></CardContent></Card>
    </div>
  );
}
