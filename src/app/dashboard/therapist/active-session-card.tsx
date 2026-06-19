
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/lib/types";
import { Clock, User, MapPin, CheckCircle, Navigation, PlayCircle, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/sos-button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export function ActiveSessionCard({ session, onEndSession, onStatusUpdate, onVerifyRequest }: { session: Appointment; onEndSession: () => void; onStatusUpdate: (id: number, status: Appointment['status']) => void; onVerifyRequest: (session: Appointment) => void; }) {
  const { toast } = useToast();
  const [timer, setTimer] = useState(75 * 60); // 75 minutes in seconds
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
        // Simulate missed check-in alert
        toast({
            variant: 'destructive',
            title: 'ALERT: Missed Check-In',
            description: `A "Missed Check-In" alert has been sent to admins for your session with ${session.patientName}.`,
        });
    }
  }, [timer, session.patientName, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleUpdateStatus = async (newStatus: Appointment['status']) => {
      setLoading(true);
      await onStatusUpdate(session.id, newStatus);
      setLoading(false);
  }

  const handleCompleteSession = async () => {
    await handleUpdateStatus('Completed');
    toast({
        title: 'Session Complete',
        description: `You have successfully checked out from your session with ${session.patientName}.`,
    });
    onEndSession();
  }

  // Determine what controls to show based on status
  const currentStatus = session.status || 'Accepted';
  const isNavigating = currentStatus === 'Navigating' || currentStatus === 'On The Way';
  const isArrived = currentStatus === 'Arrived';
  const isInProgress = currentStatus === 'In Progress' || currentStatus === 'Session Started';
  const isPendingOrAssigned = currentStatus === 'Pending' || currentStatus === 'Assigned' || currentStatus === 'Accepted' || currentStatus === 'Confirmed';

  return (
    <Card className="border-primary/50 bg-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{isInProgress ? "Active Session" : "Upcoming Session Journey"}</span>
          {isInProgress && (
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                <Clock className="w-5 h-5" />
                <span>{formatTime(timer)}</span>
              </div>
          )}
        </CardTitle>
        <CardDescription>
          {isPendingOrAssigned && "You have an upcoming session. Start your journey when ready."}
          {isNavigating && "You are currently navigating to the patient's location."}
          {isArrived && "You have arrived. Please start the session with the patient."}
          {isInProgress && "This is your currently active session. Your safety is our priority."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{session.patientName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Fake Address, 123 Wellness St.</span>
                </div>
            </div>
            <div className="flex flex-wrap w-full sm:w-auto items-center gap-2">
                {isPendingOrAssigned && (
                    <Button onClick={() => handleUpdateStatus('On The Way')} disabled={loading} variant="default" className="flex-1 sm:flex-none">
                        <Navigation className="mr-2" />
                        Start Navigation
                    </Button>
                )}
                {isNavigating && (
                    <Button onClick={() => handleUpdateStatus('Arrived')} disabled={loading} variant="default" className="flex-1 sm:flex-none">
                        <Map className="mr-2" />
                        Reach Destination
                    </Button>
                )}
                {isArrived && (
                    <Button onClick={() => onVerifyRequest(session)} disabled={loading} variant="default" className="flex-1 sm:flex-none">
                        <PlayCircle className="mr-2" />
                        Start Session
                    </Button>
                )}
                {isInProgress && (
                    <Button onClick={handleCompleteSession} disabled={loading} variant="outline" className="flex-1 sm:flex-none">
                        <CheckCircle className="mr-2" />
                        Complete Session
                    </Button>
                )}
                <SosButton session={session} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
