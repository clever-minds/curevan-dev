
'use client';

import { Button } from "./ui/button";
import { PhoneOutgoing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/lib/types";

export function SosButton({ session }: { session: Appointment }) {
    const { toast } = useToast();
    
    const handleSosClick = () => {
        // In a real app, this would:
        // 1. Get current GPS location.
        // 2. Send a high-priority request to the backend.
        // 3. The backend would trigger Cloud Functions for SMS/Push alerts.
        console.log("SOS TRIGGERED FOR SESSION:", session.id);
        
        toast({
            variant: 'destructive',
            title: 'EMERGENCY ALERT SENT',
            description: 'Your SOS has been sent to the admin team with your location.',
            duration: 3000,
        });
    }

    return (
        <Button 
            onClick={handleSosClick} 
            variant="destructive" 
            className="w-full sm:w-auto h-12 text-lg font-bold flex-1 sm:flex-none animate-pulse"
        >
            <PhoneOutgoing className="mr-2" />
            SOS
        </Button>
    )
}
