"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, MapPin, Calendar, Clock, User, Activity } from "lucide-react";
import api from "@/lib/api/axios";
import { useToast } from "@/hooks/use-toast";

export function IncomingBookingModal() {
  const { user, incomingBooking, clearIncomingBooking } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (incomingBooking) {
      // Web Audio API Beep Synthesizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        
        const playBeep = () => {
          if (ctx.state === 'suspended') ctx.resume();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        };

        playBeep(); // Play first beep immediately
        intervalRef.current = setInterval(playBeep, 1000); // Repeat every second
      } catch (err) {
        console.warn("Web Audio API not supported or blocked:", err);
      }
    } else {
      // Stop ringing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.suspend();
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.suspend();
      }
    };
  }, [incomingBooking]);

  if (!incomingBooking) return null;

  const handleAccept = async () => {
    if (!incomingBooking.data?.appointmentId) return;
    
    setIsAccepting(true);
    try {
      const response = await api.post(`/api/appointments/accept/${incomingBooking.data.appointmentId}`, {
        therapistId: user?.id,
        therapistName: user?.name,
        therapistPhone: user?.phone
      });
      
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

  const data = incomingBooking.data || {};

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
            Respond quickly before another therapist accepts it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg my-4 flex flex-col gap-3 items-center text-center">
          <div className="flex items-center gap-2 justify-center w-full">
            <Clock className="w-6 h-6 text-primary" />
            <span className="font-bold text-2xl">{data.time || "Time not specified"}</span>
          </div>
          <div className="flex items-center gap-2 justify-center text-muted-foreground mt-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium text-lg">{data.date || "Date not specified"}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Patient details and address will be revealed after you accept the request.
          </p>
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
