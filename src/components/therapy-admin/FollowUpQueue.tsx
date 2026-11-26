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
import { useToast } from '@/hooks/use-toast';
import { CalendarX, Phone, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getOverdueFollowUps, closeTreatmentPlan } from '@/lib/repos/therapyAdmin';

export function FollowUpQueue() {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [closingId, setClosingId] = React.useState<number | null>(null);

  const loadData = React.useCallback(() => {
    setLoading(true);
    getOverdueFollowUps()
      .then(setPlans)
      .catch((err) => console.error('Failed to load overdue followups:', err))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClosePlan = async (planId: number) => {
    setClosingId(planId);
    try {
      await closeTreatmentPlan(planId, 'Discharged from overdue follow-up queue');
      toast({
        title: 'Plan Discharged',
        description: `Treatment plan #${planId} has been marked discharged.`,
      });
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to close plan.',
      });
    } finally {
      setClosingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          <CalendarX className="h-5 w-5 text-amber-500" /> Overdue Follow-ups Queue
        </CardTitle>
        <CardDescription>
          Active patient plans where no next session has been booked within the expected frequency window.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading follow-ups...</div>
        ) : plans.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No patients currently overdue for a follow-up booking.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Primary Therapist</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Last Session</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.planId}>
                  <TableCell>
                    <div className="font-semibold text-sm">{p.patientName}</div>
                    {p.patientPhone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {p.patientPhone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">Dr. {p.therapistName || 'Assigned'}</TableCell>
                  <TableCell className="text-xs">{p.condition || 'General Rehab'}</TableCell>
                  <TableCell className="text-xs">
                    {p.lastSessionDate ? new Date(p.lastSessionDate).toLocaleDateString() : 'None'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-xs">
                      {p.daysOverdue ? `${p.daysOverdue} days` : 'Overdue'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/therapist/patients/${p.patientId}/progress`}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Plan
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={closingId === p.planId}
                      onClick={() => handleClosePlan(p.planId)}
                    >
                      Close Plan
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
