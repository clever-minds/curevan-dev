'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { getMyPatientsProgress } from '@/lib/repos/therapyAdmin';

interface PatientProgressItem {
  planId: number;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  condition: string;
  sessionsDone: number;
  plannedSessions: number;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  isReviewDue: boolean;
  primaryGoalMeasure: string | null;
  primaryGoalTrend: 'improving' | 'worsening' | 'no change';
  unconfirmedProposals: number;
  followUpOverdue: boolean;
}

export function MyPatientsProgress() {
  const [items, setItems] = React.useState<PatientProgressItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getMyPatientsProgress()
      .then((data) => setItems(data || []))
      .catch((err) => console.error('Failed to load my patients progress:', err))
      .finally(() => setLoading(false));
  }, []);

  const renderTrendIcon = (trend: string) => {
    if (trend === 'improving') {
      return (
        <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="mr-1 h-3.5 w-3.5" /> Improving
        </span>
      );
    }
    if (trend === 'worsening') {
      return (
        <span className="flex items-center text-xs font-medium text-red-600 dark:text-red-400">
          <TrendingDown className="mr-1 h-3.5 w-3.5" /> Worsening
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs font-medium text-muted-foreground">
        <Minus className="mr-1 h-3.5 w-3.5" /> Stable
      </span>
    );
  };

  return (
    <Card className="avoid-break">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> My Active Patients & Recovery
          </CardTitle>
          <CardDescription>
            Active treatment plans, outcome measure progress, and follow-up status.
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {items.length} Active {items.length === 1 ? 'Plan' : 'Plans'}
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active treatment plans assigned to you at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const progressPct = item.plannedSessions > 0
                ? Math.min(100, Math.round((item.sessionsDone / item.plannedSessions) * 100))
                : 0;

              return (
                <div key={item.planId} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-base">{item.patientName}</span>
                      <span className="text-xs text-muted-foreground">({item.condition})</span>
                      {item.isReviewDue && (
                        <Badge variant="destructive" className="text-xs">
                          Review Due
                        </Badge>
                      )}
                      {item.followUpOverdue && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Overdue Follow-up
                        </Badge>
                      )}
                      {item.unconfirmedProposals > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" /> {item.unconfirmedProposals} Proposed
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground pt-1">
                      <div>
                        Sessions: <span className="font-medium text-foreground">{item.sessionsDone}</span> / {item.plannedSessions}
                      </div>
                      {item.lastReviewDate && (
                        <div>
                          Last Review: {new Date(item.lastReviewDate).toLocaleDateString()}
                        </div>
                      )}
                      {item.primaryGoalMeasure && (
                        <div className="flex items-center gap-1.5">
                          <span>{item.primaryGoalMeasure}:</span>
                          {renderTrendIcon(item.primaryGoalTrend)}
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xs pt-1">
                      <Progress value={progressPct} className="h-1.5" />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/therapist/patients/${item.patientId}/progress`}>
                        View Progress <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
