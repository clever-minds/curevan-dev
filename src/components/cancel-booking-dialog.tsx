'use client';

import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Appointment } from '@/lib/types';
import { cancelWithPolicy, getCancelQuote, type CancelQuote } from '@/lib/repos/appointments';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const BAND_TEXT: Record<string, string> = {
  free: 'Free cancellation - you are more than the free-cancellation time away.',
  grace: 'Free cancellation - you booked only a few minutes ago.',
  therapist_late: 'Free cancellation - your therapist is running more than 30 minutes late.',
  partial: 'A part of the fee is kept because the session is close.',
  late: 'The session is very close, so the full fee is kept.',
  therapist: 'The patient receives a full refund.',
  admin: 'The patient receives a full refund.',
};

/** Shows the exact cancellation charge (from the server) before anything is cancelled. */
export function CancelBookingDialog({ appointment, role, trigger, onCancelled }: {
  appointment: Appointment;
  role: 'patient' | 'therapist' | 'admin';
  trigger: ReactNode;
  onCancelled?: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<CancelQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const needsReason = role !== 'patient';

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next) return;
    setQuote(null);
    setProblem(null);
    setReason('');
    setLoading(true);
    const res = await getCancelQuote(appointment.id);
    setLoading(false);
    if (res.quote) setQuote(res.quote);
    else setProblem(res.error || 'Could not work out the cancellation charge.');
  };

  const confirm = async () => {
    if (!quote) return;
    setSubmitting(true);
    const res = await cancelWithPolicy(appointment.id, {
      reason: reason.trim() || undefined,
      acceptedChargeInr: role === 'patient' ? quote.chargeInr : undefined,
    });
    setSubmitting(false);
    if (res.success) {
      toast({
        title: 'Appointment cancelled',
        description: res.quote && res.quote.refundInr > 0 ? `${inr(res.quote.refundInr)} will be refunded to the original payment method.` : undefined,
      });
      setOpen(false);
      onCancelled?.();
      return;
    }
    if (res.quote) {                       // the clock moved the charge: show the new number, do not cancel
      setQuote(res.quote);
      setProblem('The cancellation charge changed while you were reading. Please check the new amount.');
      return;
    }
    setProblem(res.error || 'Could not cancel the booking.');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel booking #{appointment.id}?</DialogTitle>
          <DialogDescription>
            {role === 'patient' ? 'Please check the charge below before you confirm.' : 'The patient will be told and refunded in full.'}
          </DialogDescription>
        </DialogHeader>

        {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>}

        {quote && (
          <div className="space-y-3 rounded-md border p-4 text-sm">
            <p>{BAND_TEXT[quote.band] ?? ''}</p>
            {quote.paid ? (
              <dl className="grid grid-cols-2 gap-y-1">
                <dt className="text-muted-foreground">Amount paid</dt><dd className="text-right">{inr(quote.amountInr)}</dd>
                <dt className="text-muted-foreground">Cancellation charge</dt><dd className="text-right font-semibold">{inr(quote.chargeInr)}</dd>
                <dt className="text-muted-foreground">Refund to you</dt><dd className="text-right font-semibold">{inr(quote.refundInr)}</dd>
              </dl>
            ) : (
              <p className="font-medium">Nothing has been paid for this booking, so there is nothing to charge or refund.</p>
            )}
          </div>
        )}

        {quote && (
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor={`cancel-reason-${appointment.id}`}>
              Reason {needsReason ? '(required)' : '(optional)'}
            </label>
            <Textarea id={`cancel-reason-${appointment.id}`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell us why" maxLength={500} />
          </div>
        )}

        {problem && <p className="text-sm text-destructive">{problem}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Keep booking</Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={!quote || submitting || (needsReason && reason.trim().length < 3)}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {quote && quote.paid && quote.chargeInr > 0 ? `Cancel (${inr(quote.chargeInr)} kept)` : 'Cancel booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
