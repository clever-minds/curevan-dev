'use client';

import * as React from 'react';
import { Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { slotStartMs } from '@/lib/appointment-status';
import { getCallConfig, type CallConfig } from '@/lib/repos/publicConfig';
import { maskCall } from '@/lib/repos/communication';

const CALLABLE = ['confirmed', 'therapist_on_the_way', 'arrived', 'in_progress'];

/** Is `now` inside the calling window of a booking: from `before` hours ahead of the slot to `after` hours after it ended. */
export function callWindowOpen(date: unknown, time: string | null | undefined, cfg: Pick<CallConfig, 'windowHoursBefore' | 'windowHoursAfter' | 'slotMinutes'>, now = Date.now()) {
  const start = slotStartMs(date, time);
  if (start === null) return false;
  return now >= start - cfg.windowHoursBefore * 3600_000 && now <= start + cfg.slotMinutes * 60_000 + cfg.windowHoursAfter * 3600_000;
}

/**
 * "Call" between the patient and the therapist. The call goes through the virtual number: this component never receives a phone number.
 * Hidden until the feature is live; enabled only inside the window (tooltip tells when it opens).
 */
export function CallButton({ appointmentId, date, time, status, label = 'Call' }: { appointmentId: number; date: unknown; time?: string | null; status: string; label?: string }) {
  const { toast } = useToast();
  const [cfg, setCfg] = React.useState<CallConfig | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { getCallConfig().then(setCfg); }, []);
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t); }, []);

  if (!cfg?.enabled || !CALLABLE.includes(status)) return null;
  const open = callWindowOpen(date, time, cfg, now);

  const start = async () => {
    setBusy(true);
    const res = await maskCall(appointmentId);
    setBusy(false);
    toast(res.ok ? { title: 'Calling', description: res.message } : { variant: 'destructive', title: 'Call not started', description: res.message });
  };

  const button = (
    <Button variant="outline" onClick={start} disabled={!open || busy} data-testid="call-button" aria-disabled={!open}>
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}{label}
    </Button>
  );
  if (open) return button;
  return (
    <TooltipProvider><Tooltip>
      <TooltipTrigger asChild><span tabIndex={0}>{button}</span></TooltipTrigger>
      <TooltipContent>Calling opens {cfg.windowHoursBefore} hours before your appointment</TooltipContent>
    </Tooltip></TooltipProvider>
  );
}
