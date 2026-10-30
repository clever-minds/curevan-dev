'use client';

import * as React from 'react';
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
import { Activity, CheckCircle, Target, TrendingUp, Users } from 'lucide-react';
import { getOutcomeSummary } from '@/lib/repos/therapyAdmin';

export function OutcomeSummary() {
  const [summary, setSummary] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getOutcomeSummary()
      .then(setSummary)
      .catch((err) => console.error('Failed to load outcome summary:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Clinical Outcome Summary (Last 90 Days)
          </CardTitle>
          <CardDescription>Aggregated metrics across discharged treatment plans.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading outcome statistics...
          </div>
        </CardContent>
      </Card>
    );
  }

  const s = summary || {};
  const conditionMeasures = s.conditionMeasures || [];

  return (
    <Card className="avoid-break">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Clinical Outcome Summary (Last 90 Days)
        </CardTitle>
        <CardDescription>
          Real outcome metrics computed across discharged treatment plans. Minimum 5 plans per condition group.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top 4 KPI blocks */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Discharged Plans</span>
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{s.dischargedPlansCount ?? 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Last 90 days total</p>
          </div>

          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Goals Fully Achieved</span>
              <Target className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {s.percentGoalsAchieved ?? 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {s.goalsAchieved ?? 0} of {s.goalsTotal ?? 0} total goals
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Partially Achieved</span>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {s.percentGoalsPartiallyAchieved ?? 0}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {s.goalsPartiallyAchieved ?? 0} goals partially met
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Median Sessions</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{s.medianSessionsToDischarge ?? 0}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sessions to plan discharge</p>
          </div>
        </div>

        {/* Measure changes by condition */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold tracking-tight">Average Functional Gain by Condition (n ≥ 5)</h4>
          {conditionMeasures.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/50 text-xs text-muted-foreground text-center">
              Fewer than 5 discharged plans recorded per condition in this window. Minimum sample threshold not yet reached.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition</TableHead>
                  <TableHead>Outcome Measure</TableHead>
                  <TableHead>Discharged Plans (n)</TableHead>
                  <TableHead className="text-right">Average Gain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conditionMeasures.map((cm: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-sm">{cm.condition}</TableCell>
                    <TableCell className="text-xs">
                      {cm.measureName} ({cm.measureCode})
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {cm.planCount} plans
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                      +{cm.avgChange} {cm.unit || 'pts'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
