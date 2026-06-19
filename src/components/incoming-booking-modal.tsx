"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, MapPin, Calendar, Clock } from "lucide-react";
import api from "@/lib/api/axios";
import { useToast } from "@/hooks/use-toast";

export function IncomingBookingModal() {
  const { incomingBooking, clearIncomingBooking } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (incomingBooking) {
      // Play ringing sound
      if (!audioRef.current) {
        audioRef.current = new Audio("/ringtone.mp3");
        audioRef.current.loop = true;
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay prevented or audio file missing:", error);
        });
      }
    } else {
      // Stop ringing sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [incomingBooking]);

  if (!incomingBooking) return null;

  const handleAccept = async () => {
    if (!incomingBooking.data?.appointmentId) return;
    
    setIsAccepting(true);
    try {
      const response = await api.post(`/api/appointments/accept/${incomingBooking.data.appointmentId}`);
      
      if (response.data.success) {
        toast({
          title: "Booking Accepted!",
          description: "You have successfully accepted the appointment.",
          variant: "default",
        });
      } else {
        toast({
          title: "Could not accept",
          description: response.data.error || "Someone else may have already accepted it.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.response?.data?.error || "An error occurred while accepting the booking.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
      clearIncomingBooking();
    }
  };

  const handleReject = () => {
    clearIncomingBooking();
  };

  return (
    <Dialog open={!!incomingBooking} onOpenChange={(open) => !open && clearIncomingBooking()}>
      <DialogContent className="sm:max-w-md border-4 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300">
        <DialogHeader>
          <div className="flex justify-center mb-4 relative">
             <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150"></div>
             <div className="bg-primary p-4 rounded-full relative z-10">
               <MapPin className="w-8 h-8 text-primary-foreground animate-bounce" />
             </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">New Booking Request!</DialogTitle>
          <DialogDescription className="text-center text-lg mt-2 font-medium text-foreground">
            {incomingBooking.notification?.body || "A new appointment request is available nearby."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg my-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">Please check the details carefully.</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Respond quickly before another therapist accepts it.</span>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-center gap-4 sm:justify-center">
          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10 h-14 text-lg" 
            onClick={handleReject}
            disabled={isAccepting}
          >
            <XCircle className="w-6 h-6 mr-2" />
            Reject
          </Button>
          <Button 
            type="button" 
            size="lg" 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-14 text-lg shadow-lg shadow-green-600/30" 
            onClick={handleAccept}
            disabled={isAccepting}
          >
            <CheckCircle2 className="w-6 h-6 mr-2" />
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
