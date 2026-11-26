'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, ExternalLink, AlertOctagon } from 'lucide-react';
import { getStalledProgressQueue } from '@/lib/repos/therapyAdmin';

export function StalledProgressQueue() {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getStalledProgressQueue()
      .then(setPlans)
      .catch((err) => console.error('Failed to load stalled progress queue:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-red-500" /> Stalled Progress Queue
        </CardTitle>
        <CardDescription>
          Treatment plans flagged after two consecutive checkpoints without measurable improvement on the primary goal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading stalled plans...</div>
        ) : plans.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No active treatment plans currently flagged as stalled.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Therapist</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Primary Measure & Change</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.planId}>
                  <TableCell>
                    <div className="font-semibold text-sm">{p.patientName}</div>
                    <div className="text-xs text-muted-foreground">Plan #{p.planId}</div>
                  </TableCell>
                  <TableCell className="text-sm">Dr. {p.therapistName}</TableCell>
                  <TableCell className="text-xs">{p.condition}</TableCell>
                  <TableCell>
                    <div className="text-xs font-medium">{p.measureName || 'Primary Measure'}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>Base: {p.baseline ?? '—'}</span>
                      <span>→</span>
                      <span>Latest: {p.latest ?? '—'}</span>
                      <span className="text-red-500 flex items-center font-semibold">
                        <TrendingDown className="h-3 w-3 mr-0.5" /> No gain
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.sessionsDone} / {p.plannedSessions}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/therapist/patients/${p.patientId}/progress`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Clinical Review
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
