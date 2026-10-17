'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/lib/types";
import { Clock, User, MapPin, CheckCircle, Navigation, PlayCircle, Map, FileText, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/sos-button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicConfig } from "@/lib/repos/appointments";
import { mapsDirectionsUrl, slotStartMs } from "@/lib/appointment-status";

type Result = boolean | { success: boolean; error?: string } | void;

export function ActiveSessionCard({ session, onEndSession, onStatusUpdate, onVerifyRequest }: {
  session: Appointment;
  onEndSession: () => void;
  onStatusUpdate: (id: number, status: Appointment['status']) => Promise<Result> | Result;
  onVerifyRequest: (session: Appointment) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [config, setConfig] = useState({ timerMinutes: 60, travelFromMinutesBefore: 45 });

  useEffect(() => { getPublicConfig().then(setConfig); }, []);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const status = session.status;
  const isConfirmed = status === 'confirmed';
  const isNavigating = status === 'therapist_on_the_way';
  const isArrived = status === 'arrived';
  const isInProgress = status === 'in_progress';
  const isPcrPending = status === 'pcr_pending';

  // the timer counts down from the moment the start code was verified
  const startedMs = session.sessionStartedAt ? new Date(session.sessionStartedAt).getTime() : null;
  const remaining = startedMs ? config.timerMinutes * 60 - Math.floor((now - startedMs) / 1000) : config.timerMinutes * 60;
  const formatTime = (seconds: number) => {
    const abs = Math.abs(seconds);
    const mm = Math.floor(abs / 60).toString().padStart(2, '0');
    const ss = (abs % 60).toString().padStart(2, '0');
    return `${seconds < 0 ? '+' : ''}${mm}:${ss}`;
  };

  // "Start travel" opens 45 minutes before the slot
  const slotMs = slotStartMs(session.date, session.time);
  const travelOpensMs = slotMs ? slotMs - config.travelFromMinutesBefore * 60000 : null;
  const canTravel = travelOpensMs === null || now >= travelOpensMs;
  const minutesToTravel = travelOpensMs ? Math.max(0, Math.ceil((travelOpensMs - now) / 60000)) : 0;

  const detail = session.serviceAddressDetail;
  const mapsUrl = mapsDirectionsUrl(detail);
  const addressText = detail ? [detail.fullAddress, detail.city, detail.state, detail.pincode].filter(Boolean).join(', ') : null;

  const run = async (newStatus: Appointment['status'], after?: () => void) => {
    setLoading(true);
    const result = await onStatusUpdate(session.id, newStatus);
    setLoading(false);
    const ok = result === undefined ? true : typeof result === 'boolean' ? result : result.success;
    if (!ok) {
      toast({
        variant: 'destructive',
        title: 'Could not update the booking',
        description: typeof result === 'object' && result?.error ? result.error : 'Please try again.',
      });
      return false;
    }
    after?.();
    return true;
  };

  const handleStartTravel = async () => {
    // open the tab inside the click itself: browsers block a window opened after a network call
    const tab = mapsUrl ? window.open('', '_blank') : null;
    if (tab) tab.opener = null;
    const ok = await run('therapist_on_the_way');
    if (tab) { if (ok && mapsUrl) tab.location.href = mapsUrl; else tab.close(); }
  };

  const handleCompleteSession = () => run('pcr_pending', () => {
    toast({ title: 'Session complete', description: 'Submit the PCR to finish this session and unlock your payout.' });
    onEndSession();
  });

  return (
    <Card className="border-primary/50 bg-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isInProgress ? "Active Session" : "Upcoming Session Journey"}</span>
          {isInProgress && (
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <Clock className="w-5 h-5" />
                <span>{formatTime(remaining)}</span>
              </div>
          )}
        </CardTitle>
        <CardDescription>
          {isConfirmed && (canTravel ? "Your session is coming up. Start travelling when you are ready." : `You can start travelling in ${minutesToTravel} minute(s).`)}
          {isNavigating && "You are on your way to the patient's location."}
          {isArrived && "You have arrived. Ask the patient for their start code to begin."}
          {isInProgress && (remaining < 0 ? "The booked time is over. Please wrap up the session." : "This is your currently active session. Your safety is our priority.")}
          {isPcrPending && "Submit the PCR to finish this session and unlock your payout."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{session.patientName}</span>
                    <Link href={`/dashboard/therapist/patients/${session.patientId}/progress`} className="inline-flex items-center gap-1 text-xs text-primary underline"><LineChart className="w-3 h-3" />Progress</Link>
                </div>
                <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {addressText || "The full address is shown 2 hours before the session."}
                    </span>
                </div>
            </div>
            <div className="flex flex-wrap w-full sm:w-auto items-center gap-2">
                {isConfirmed && (
                    <Button onClick={handleStartTravel} disabled={loading || !canTravel} variant="default" className="flex-1 sm:flex-none">
                        <Navigation className="mr-2" />
                        Start travel
                    </Button>
                )}
                {isNavigating && mapsUrl && (
                    <Button asChild variant="outline" className="flex-1 sm:flex-none">
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"><Map className="mr-2" />Open Maps</a>
                    </Button>
                )}
                {isNavigating && (
                    <Button onClick={() => run('arrived')} disabled={loading} variant="default" className="flex-1 sm:flex-none">
                        <Map className="mr-2" />
                        I have arrived
                    </Button>
                )}
                {isArrived && (
                    <Button onClick={() => onVerifyRequest(session)} disabled={loading} variant="default" className="flex-1 sm:flex-none">
                        <PlayCircle className="mr-2" />
                        Start session
                    </Button>
                )}
                {isInProgress && (
                    <Button onClick={handleCompleteSession} disabled={loading} variant="outline" className="flex-1 sm:flex-none">
                        <CheckCircle className="mr-2" />
                        Complete session
                    </Button>
                )}
                {isPcrPending && (
                    <Button asChild variant="default" className="flex-1 sm:flex-none">
                        <Link href={`/pcr/${session.id}`}><FileText className="mr-2" />Submit PCR</Link>
                    </Button>
                )}
                <SosButton session={session} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
