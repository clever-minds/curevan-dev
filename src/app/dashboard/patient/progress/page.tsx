'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ProgressChart } from '@/components/clinical/ProgressChart';
import { GoalProgressList } from '@/components/clinical/GoalProgressList';
import { ProgressReportCard } from '@/components/clinical/ProgressReportCard';
import type { CaregiverLink, PlanProgress, ProgressReportRow, TreatmentPlanSummary } from '@/lib/types';
import { addCaregiver, getPlanProgress, listCaregivers, listPlanReports, listPlans, revokeCaregiver } from '@/lib/repos/clinical';

export default function PatientProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<TreatmentPlanSummary[]>([]);
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [family, setFamily] = useState<CaregiverLink[]>([]);
  const [mobile, setMobile] = useState('');
  const [relation, setRelation] = useState('');
  const [consent, setConsent] = useState(false);

  const isPatient = user?.role === 'patient';

  const load = useCallback(async () => {
    setLoading(true);
    const ps = await listPlans();
    setPlans(ps);
    const current = ps.find((p) => p.status === 'active') ?? ps[0];
    if (current) {
      const [prog, reps] = await Promise.all([getPlanProgress(current.id), listPlanReports(current.id)]);
      setProgress(prog);
      setReports(reps);
    }
    if (isPatient) setFamily(await listCaregivers());
    setLoading(false);
  }, [isPatient]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const share = async () => {
    const res = await addCaregiver({ mobile, relation: relation || undefined, consentAccepted: consent });
    if (!res.ok) { toast({ variant: 'destructive', title: 'Could not share', description: res.error }); return; }
    toast({ title: 'Shared', description: 'They can open your progress after signing in with an OTP sent to their mobile number.' });
    setMobile(''); setRelation(''); setConsent(false);
    setFamily(await listCaregivers());
  };

  const remove = async (id: number) => {
    if (await revokeCaregiver(id)) { toast({ title: 'Access removed' }); setFamily(await listCaregivers()); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-48 w-full" /></div>;

  const active = family.filter((f) => !f.revokedAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">My Progress</h1>
        <p className="text-muted-foreground">How your recovery is going, goal by goal.</p>
      </div>

      {!progress ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Your therapist will set up your treatment plan at your first assessment. Your progress will show here.</CardContent></Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {progress.plan.condition}
                <Badge variant="secondary">{progress.plan.status === 'discharged' ? 'Completed' : progress.plan.status.replace('_', ' ')}</Badge>
              </CardTitle>
              <CardDescription>
                {progress.sessionsDone} of {progress.plannedSessions ?? '-'} sessions done
                {progress.adherence.ratio !== null ? ` | attendance ${Math.round(progress.adherence.ratio * 100)}%` : ''}
                {progress.plan.review_every_sessions ? ` | review every ${progress.plan.review_every_sessions} sessions` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent><GoalProgressList goals={progress.goals} /></CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {progress.measures.filter((m) => m.series.length > 0).map((m) => (
              <Card key={m.planMeasureId}><CardContent className="pt-6"><ProgressChart measure={m} /></CardContent></Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Reports</CardTitle><CardDescription>Progress reports after each review and your discharge summary.</CardDescription></CardHeader>
            <CardContent><ProgressReportCard reports={reports} /></CardContent>
          </Card>
        </>
      )}

      {isPatient && (
        <Card>
          <CardHeader><CardTitle>Share with a family member</CardTitle><CardDescription>One person can follow your progress (read-only). They sign in with an OTP sent to their mobile number. You can stop sharing at any time.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {active.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{f.relation || 'Family member'} {f.phone} - {f.activatedAt ? 'signed in' : 'waiting for their first sign-in'}</span>
                <Button size="sm" variant="outline" onClick={() => remove(f.id)}>Stop sharing</Button>
              </div>
            ))}
            {active.length === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input inputMode="numeric" maxLength={10} placeholder="Mobile number (10 digits)" aria-label="Family member mobile number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
                <Input placeholder="Relation (e.g. Son)" aria-label="Relation" value={relation} onChange={(e) => setRelation(e.target.value)} maxLength={40} />
                <label className="flex items-start gap-2 text-sm sm:col-span-2">
                  <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} />
                  I agree to share my treatment progress with this person.
                </label>
                <Button onClick={share} disabled={!consent || mobile.length !== 10} className="sm:col-span-2 sm:w-fit">Share</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
