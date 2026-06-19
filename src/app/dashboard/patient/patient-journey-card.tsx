'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Appointment } from "@/lib/types";
import { Clock, User, MapPin, CheckCircle, Navigation, PlayCircle, Map, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PatientJourneyCard({ session }: { session: Appointment }) {
  const currentStatus = session.status || 'Pending';
  
  const isPending = currentStatus === 'Pending' || currentStatus === 'Searching Therapist';
  const isAssigned = currentStatus === 'Assigned' || currentStatus === 'Accepted' || currentStatus === 'Confirmed';
  const isNavigating = currentStatus === 'Navigating' || currentStatus === 'On The Way';
  const isArrived = currentStatus === 'Arrived';
  const isInProgress = currentStatus === 'In Progress' || currentStatus === 'Session Started';
  const isCompleted = currentStatus === 'Completed';

  // We don't render the card if it's completed or cancelled. We only show active journey.
  if (isCompleted || currentStatus === 'Cancelled') return null;

  return (
    <Card className="border-purple-200 bg-purple-50/50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600 animate-pulse" />
            Active Session Tracker
          </span>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            {currentStatus}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isPending && "We are currently assigning a therapist to your booking."}
          {isAssigned && "A therapist has been assigned and will start their journey to your location shortly."}
          {isNavigating && "Your therapist is on the way to your location!"}
          {isArrived && "Your therapist has arrived. Please prepare for the session."}
          {isInProgress && "Your session is currently in progress."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{session.therapist || 'Assigning...'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Session Location</span>
                </div>
            </div>
            
            {/* Visual Progress Bar or Status Indicator */}
            <div className="w-full sm:w-1/2 flex items-center justify-between relative pt-6 px-4">
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-1 bg-gray-200 rounded-full z-0"></div>
              <div className={`absolute top-1/2 -translate-y-1/2 left-4 h-1 bg-purple-600 rounded-full z-0 transition-all duration-500`} style={{
                width: isPending ? '0%' : isAssigned ? '25%' : isNavigating ? '50%' : isArrived ? '75%' : isInProgress ? '100%' : '0%'
              }}></div>
              
              <div className={`relative z-10 w-4 h-4 rounded-full ${isAssigned || isNavigating || isArrived || isInProgress ? 'bg-purple-600' : 'bg-gray-300'}`} title="Assigned"></div>
              <div className={`relative z-10 w-4 h-4 rounded-full ${isNavigating || isArrived || isInProgress ? 'bg-purple-600' : 'bg-gray-300'}`} title="On The Way"></div>
              <div className={`relative z-10 w-4 h-4 rounded-full ${isArrived || isInProgress ? 'bg-purple-600' : 'bg-gray-300'}`} title="Arrived"></div>
              <div className={`relative z-10 w-4 h-4 rounded-full ${isInProgress ? 'bg-purple-600' : 'bg-gray-300'}`} title="Started"></div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
