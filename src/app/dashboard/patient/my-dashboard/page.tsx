'use client';

import * as React from 'react';
import Link from 'next/link';
import { Hourglass, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { ActiveBookingCard } from '@/components/patient/ActiveBookingCard';
import { ActiveCarePackCard } from '@/components/patient/ActiveCarePackCard';
import { ConfirmNextSessionCard } from '@/components/patient/ConfirmNextSessionCard';
import { ProgressSummary } from '@/components/patient/ProgressSummary';
import { QuickActions } from '@/components/patient/QuickActions';
import { RecentOrders } from '@/components/patient/RecentOrders';
import { RecentRecords } from '@/components/patient/RecentRecords';
import { getPatientDashboard, type PatientDashboard } from '@/lib/repos/patientDashboard';
import { getMyCarePacks, type CarePack } from '@/lib/repos/carePacks';

const REFRESH_MS = 30_000;

/** "Confirm within 5 h 20 min" for the earliest hold that is running out. */
function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);
  const left = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(left)) return null;
  if (left <= 0) return <p className="flex items-center gap-2 text-sm text-destructive"><Hourglass className="h-4 w-4" />The hold on this slot has ended.</p>;
  const h = Math.floor(left / 3_600_000), m = Math.floor((left % 3_600_000) / 60_000);
  return <p className="flex items-center gap-2 text-sm font-medium" data-testid="hold-countdown"><Hourglass className="h-4 w-4" />Confirm within {h > 0 ? `${h} h ` : ''}{m} min to keep your slot.</p>;
}

/** The patient's home: next booking, next session, recovery, records, orders, quick actions. */
export default function PatientHomePage() {
  const { user } = useAuth();
  const [data, setData] = React.useState<PatientDashboard | null | undefined>(undefined);
  const [activeCarePack, setActiveCarePack] = React.useState<CarePack | null>(null);

  const load = React.useCallback(async () => {
    const [dash, packs] = await Promise.all([
      getPatientDashboard(),
      getMyCarePacks().catch(() => []),
    ]);
    setData(dash);
    const active = packs.find((p) => p.status === 'active' && (p.sessions_total - p.sessions_used) > 0) || null;
    setActiveCarePack(active);
  }, []);

  React.useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [user, load]);

  if (!user || data === undefined) return <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;

  const firstName = (user.name || '').split(' ')[0];
  const holdEnds = data?.proposals.map((p) => p.holdExpiresAt).filter((x): x is string => !!x).sort()[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">{firstName ? `Hello, ${firstName}` : 'Welcome'}</h1>
          <p className="text-muted-foreground text-sm">Your care at a glance.</p>
        </div>
        <Button asChild variant="ghost" size="sm"><Link href="/dashboard/account"><Settings className="mr-2 h-4 w-4" />Account settings</Link></Button>
      </div>

      {data === null ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Your dashboard could not be loaded. Please refresh in a moment.</CardContent></Card>
      ) : (
        <>
          {data.proposals.length > 0 ? (
            <section aria-label="Next session" className="space-y-2">
              {holdEnds && <HoldCountdown expiresAt={holdEnds} />}
              <ConfirmNextSessionCard />
            </section>
          ) : data.recovery?.followUpOverdue ? (
            <Card className="border-amber-300" data-testid="book-next">
              <CardHeader><CardTitle className="text-base">Book your next session</CardTitle><CardDescription>It has been a while since your last session. Keep your recovery on track.</CardDescription></CardHeader>
              <CardContent><Button asChild><Link href={data.lastTherapist ? `/booking/${data.lastTherapist.therapistId}` : '/book'}>Book now</Link></Button></CardContent>
            </Card>
          ) : null}

          {activeCarePack && <ActiveCarePackCard carePack={activeCarePack} />}

          {data.activeBooking && <ActiveBookingCard booking={data.activeBooking} />}

          {data.isNew && (
            <Card data-testid="first-session">
              <CardHeader><CardTitle>Book your first session</CardTitle><CardDescription>Qualified therapists come to your home. Choose a service and a time that suits you.</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-2"><Button asChild><Link href="/book">Book a session</Link></Button><Button asChild variant="outline"><Link href="/therapists">Find a therapist</Link></Button></CardContent>
            </Card>
          )}

          {data.recovery && <ProgressSummary recovery={data.recovery} quickScores={data.quickScores} />}

          <div className="grid gap-4 md:grid-cols-2">
            <RecentRecords records={data.records} />
            <RecentOrders orders={data.orders} />
          </div>

          <QuickActions lastTherapist={data.lastTherapist} />
        </>
      )}
    </div>
  );
}
