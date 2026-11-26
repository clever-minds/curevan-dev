'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import type { Appointment } from "@/lib/types";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { verifyStartOtp } from "@/lib/repos/appointments";

const OTP_LENGTH = 4;

interface OtpDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

/** The therapist types the 4-digit code the patient shows at the door. The server checks it. */
export function OtpDialog({ appointment, onClose, onSuccess }: OtpDialogProps) {
    const { toast } = useToast();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [locked, setLocked] = useState(false);

    const handleVerify = async () => {
        if (!appointment) return;
        setIsLoading(true);
        const result = await verifyStartOtp(appointment.id, otp);
        setIsLoading(false);
        setOtp('');

        if (result.success) {
            toast({
                title: "Verification successful",
                description: `Your session with ${appointment.patientName} has started.`,
            });
            onSuccess({ ...appointment, status: 'in_progress', sessionStartedAt: new Date().toISOString() });
            return;
        }
        if (result.locked) setLocked(true);
        toast({
            variant: 'destructive',
            title: result.locked ? "Booking locked" : "Verification failed",
            description: result.locked
                ? "Too many wrong codes. Support has been told - please wait for them to contact you."
                : `${result.error || 'The code is incorrect.'}${typeof result.attemptsLeft === 'number' ? ` ${result.attemptsLeft} attempt(s) left.` : ''}`,
        });
    };

    return (
        <Dialog open={!!appointment} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Patient verification</DialogTitle>
                <DialogDescription>
                    Ask <strong>{appointment?.patientName}</strong> for the {OTP_LENGTH}-digit start code shown in their Curevan app, then enter it here.
                </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center py-4">
                    <InputOTP maxLength={OTP_LENGTH} value={otp} onChange={(value) => setOtp(value.replace(/\D/g, ''))} disabled={locked}>
                        <InputOTPGroup>
                            {Array.from({ length: OTP_LENGTH }, (_, i) => <InputOTPSlot key={i} index={i} />)}
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleVerify} disabled={otp.length < OTP_LENGTH || isLoading || locked}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & start
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
