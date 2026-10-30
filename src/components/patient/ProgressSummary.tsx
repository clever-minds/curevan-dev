'use client';

import Link from 'next/link';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalProgressList } from '@/components/clinical/GoalProgressList';
import { ProgressChart } from '@/components/clinical/ProgressChart';
import type { DashboardRecovery, PatientDashboard } from '@/lib/repos/patientDashboard';

const MIN_POINTS = 2;      // a line needs two points; charts appear from then on

function QuickScores({ rows }: { rows: PatientDashboard['quickScores'] }) {
  const f = rows.filter((r) => r.functionalScore !== null), p = rows.filter((r) => r.painVas !== null);
  if (f.length < MIN_POINTS && p.length < MIN_POINTS) return null;
  const data = rows.map((r, i) => ({ x: i + 1, Function: r.functionalScore, Pain: r.painVas }));
  const caption = p.length >= MIN_POINTS ? `Your pain score went from ${p[0].painVas} to ${p[p.length - 1].painVas} (0 = no pain, 10 = worst).` : 'How you rated your function after each session (10 = best).';
  return (
    <div data-testid="quick-scores">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" ticks={data.map((d) => d.x)} tickFormatter={(v) => `S${v}`} />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Function" stroke="#7c3aed" connectNulls />
            <Line type="monotone" dataKey="Pain" stroke="#dc2626" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{caption}</p>
    </div>
  );
}

/** My recovery: plan numbers, goal bars and up to 3 charts of the measures the therapist records. */
export function ProgressSummary({ recovery, quickScores }: { recovery: DashboardRecovery; quickScores: PatientDashboard['quickScores'] }) {
  const charts = recovery.measures.filter((m) => m.series.length >= MIN_POINTS);
  return (
    <Card data-testid="recovery">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">My recovery: {recovery.condition}<Badge variant="secondary">{recovery.status === 'discharged' ? 'Completed' : recovery.status.replace('_', ' ')}</Badge></CardTitle>
        <CardDescription>
          {recovery.sessionsDone} of {recovery.plannedSessions ?? '-'} sessions done
          {recovery.adherence.ratio !== null ? ` | attendance ${Math.round(recovery.adherence.ratio * 100)}%` : ''}
          {recovery.sessionsToNextReview !== null && recovery.status === 'active' ? ` | next review in ${recovery.sessionsToNextReview} session${recovery.sessionsToNextReview === 1 ? '' : 's'}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <GoalProgressList goals={recovery.goals} />
        {charts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {charts.map((m) => (
              <div key={m.planMeasureId} className="rounded-md border p-3"><ProgressChart measure={m} /></div>
            ))}
          </div>
        )}
        <QuickScores rows={quickScores} />
        <Link href="/dashboard/patient/progress" className="inline-block text-sm text-primary underline">See full progress</Link>
      </CardContent>
    </Card>
  );
}
