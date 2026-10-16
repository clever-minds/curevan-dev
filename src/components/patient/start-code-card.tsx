'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2 } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { VISIT_STEPS, statusLabel } from '@/lib/appointment-status';
import { getStartOtp } from '@/lib/repos/appointments';

/** Shown to the patient for confirmed / on the way / arrived bookings. */
export function StartCodeCard({ appointment }: { appointment: Appointment }) {
  const [otp, setOtp] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reveal = async () => {
    setLoading(true);
    setMessage(null);
    const result = await getStartOtp(appointment.id);
    setLoading(false);
    if (result.success && result.otp) setOtp(result.otp);
    else setMessage(result.error || 'The start code is not available yet.');
  };

  const stepIndex = Math.max(0, VISIT_STEPS.findIndex((s) => s.status === appointment.status));

  return (
    <Card className="border-primary/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Session with {appointment.therapist || 'your therapist'}
        </CardTitle>
        <CardDescription>
          {String(appointment.date).slice(0, 10)} at {appointment.time} - {statusLabel(appointment.status)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="flex items-center justify-between gap-1 text-xs">
          {VISIT_STEPS.map((step, i) => (
            <li key={step.status} className={`flex-1 text-center ${i <= stepIndex ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              <div className={`mx-auto mb-1 h-2 w-2 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
              {step.label}
            </li>
          ))}
        </ol>

        {otp ? (
          <div className="text-center">
            <p className="font-mono text-4xl font-bold tracking-[0.4em]" aria-label="Start code">{otp}</p>
            <p className="mt-2 text-sm text-muted-foreground">Share this code only after your therapist arrives.</p>
          </div>
        ) : (
          <div className="text-center">
            <Button onClick={reveal} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Show my start code
            </Button>
            {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
