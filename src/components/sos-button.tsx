
'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import { PhoneOutgoing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/lib/types";
import { raiseSosAction } from "@/lib/actions/sos";

export function SosButton({ session }: { session: Appointment }) {
    const { toast } = useToast();
    const [sending, setSending] = useState(false);

    // best effort: the alert is sent even if the location is blocked or slow
    const getLocation = () => new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(undefined);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(undefined),
            { enableHighAccuracy: true, timeout: 4000, maximumAge: 30000 }
        );
    });

    const handleSosClick = async () => {
        if (sending) return;
        setSending(true);
        const location = await getLocation();
        const result = await raiseSosAction({ bookingId: String(session.id), location, type: 'sos' });
        setSending(false);

        // success is only shown when the backend really saved the alert
        if (result.success) {
            toast({
                variant: 'destructive',
                title: 'EMERGENCY ALERT SENT',
                description: location
                    ? 'Your SOS has been sent to the admin team with your location.'
                    : 'Your SOS has been sent to the admin team (location was not available).',
                duration: 5000,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'SOS NOT SENT',
                description: (result.error || 'Could not reach the server.') + ' Please call the emergency number now.',
                duration: 10000,
            });
        }
    }

    return (
        <Button
            onClick={handleSosClick}
            variant="destructive"
            disabled={sending}
            className="w-full sm:w-auto h-12 text-lg font-bold flex-1 sm:flex-none animate-pulse"
        >
            <PhoneOutgoing className="mr-2" />
            SOS
        </Button>
    )
}
