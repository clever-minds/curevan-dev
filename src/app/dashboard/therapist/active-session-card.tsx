
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/lib/types";
import { Clock, User, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SosButton } from "@/components/sos-button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

export function ActiveSessionCard({ session, onEndSession }: { session: Appointment; onEndSession: () => void; }) {
  const { toast } = useToast();
  const [timer, setTimer] = useState(75 * 60); // 75 minutes in seconds

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

  const handleCompleteSession = () => {
    toast({
        title: 'Session Complete',
        description: `You have successfully checked out from your session with ${session.patientName}.`,
    });
    onEndSession();
  }

  return (
    <Card className="border-primary/50 bg-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Session</span>
          <div className="flex items-center gap-2 text-lg font-bold text-primary">
            <Clock className="w-5 h-5" />
            <span>{formatTime(timer)}</span>
          </div>
        </CardTitle>
        <CardDescription>
          This is your currently active session. Your safety is our priority.
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
            <div className="flex w-full sm:w-auto items-center gap-4">
                 <Button onClick={handleCompleteSession} variant="outline" className="flex-1 sm:flex-none">
                    <CheckCircle className="mr-2" />
                    Complete Session
                </Button>
                <SosButton session={session} />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
