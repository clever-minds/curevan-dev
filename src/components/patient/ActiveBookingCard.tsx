'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusTimeline } from '@/components/patient/StatusTimeline';
import { statusLabel } from '@/lib/appointment-status';
import { imageUrl } from '@/lib/image';
import { getStartOtp } from '@/lib/repos/appointments';
import type { DashboardBooking } from '@/lib/repos/patientDashboard';

const when = (d: string, t: string) => `${new Date(`${d}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}, ${t}`;

/** The next live booking: therapist, slot, progress and (only when the server says it is time) the 4-digit start code. */
export function ActiveBookingCard({ booking }: { booking: DashboardBooking }) {
  const [otp, setOtp] = React.useState<string | null>(null);
  const [state, setState] = React.useState<'idle' | 'loading' | 'error'>('idle');

  React.useEffect(() => {
    if (!booking.otpAvailable) { setOtp(null); return; }
    let live = true;
    setState('loading');
    getStartOtp(booking.id).then((res) => {
      if (!live) return;
      if (res.success && res.otp) { setOtp(res.otp); setState('idle'); } else setState('error');
    });
    return () => { live = false; };
  }, [booking.id, booking.otpAvailable]);

  return (
    <Card className="border-primary/40" data-testid="active-booking">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <Avatar className="h-12 w-12">
            <AvatarImage src={booking.therapistPhoto ? imageUrl(booking.therapistPhoto) : undefined} alt={booking.therapistName ?? 'Therapist'} />
            <AvatarFallback>{(booking.therapistName ?? 'T').slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate">{booking.therapistName ?? 'Therapist to be assigned'}</p>
            <p className="truncate text-sm font-normal text-muted-foreground">{booking.qualification || booking.therapyType || 'Home therapy session'}</p>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0">{statusLabel(booking.status)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4" />{when(booking.date, booking.time)}</p>
        <StatusTimeline status={booking.status} />
        {booking.otpAvailable && (
          <div className="rounded-md bg-muted p-4 text-center" data-testid="start-code">
            {otp ? (
              <>
                <p className="font-mono text-4xl font-bold tracking-[0.4em]" aria-label="Start code">{otp}</p>
                <p className="mt-2 text-sm text-muted-foreground">Share this code only after your therapist arrives.</p>
              </>
            ) : state === 'loading' ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : <p className="text-sm text-muted-foreground">The start code is not available right now.</p>}
          </div>
        )}
        <Link href="/dashboard/bookings" className="text-sm text-primary underline">All my bookings</Link>
      </CardContent>
    </Card>
  );
}
