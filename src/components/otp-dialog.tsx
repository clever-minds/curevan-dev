
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

interface OtpDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

export function OtpDialog({ appointment, onClose, onSuccess }: OtpDialogProps) {
    const { toast } = useToast();
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = () => {
        // In a real app, this would be an API call to your server
        // to verify the OTP against the booking.
        setIsLoading(true);
        console.log(`Verifying OTP ${otp} for appointment ${appointment?.id}`);
        
        // Simulate API call
        setTimeout(() => {
            if (otp === '123456') { // Mock success OTP
                toast({
                    title: "Verification Successful!",
                    description: `You can now start the session with ${appointment?.patientName}.`
                });
                if(appointment) {
                    onSuccess(appointment);
                }
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Verification Failed",
                    description: "The OTP you entered is incorrect. Please try again."
                });
            }
            setIsLoading(false);
            setOtp('');
        }, 1000);
    }
    
    return (
        <Dialog open={!!appointment} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Patient Verification</DialogTitle>
                <DialogDescription>
                    To start the session, please enter the 6-digit verification code provided by the patient, <strong>{appointment?.patientName}</strong>. For demo, use 123456.
                </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center py-4">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleVerify} disabled={otp.length < 6 || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Start
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
