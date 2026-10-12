'use client';

import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/money/price';
import { 
  Banknote, 
  QrCode, 
  Building, 
  CreditCard, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import serverApi from '@/lib/repos/axios.server';
import { getToken } from '@/lib/auth';
import { addAuditLog } from '@/lib/repos/logs';

export interface ManualPaymentDialogProps {
  sourceId: number;
  grossAmount?: number;
  netAmount?: number;
  patientName?: string;
  therapistName?: string;
  trigger?: React.ReactNode;
  onPaymentSuccess?: (paymentInfo: {
    method: string;
    referenceNo: string;
    paidAt: string;
    notes: string;
  }) => void;
}

export function ManualPaymentDialog({
  sourceId,
  grossAmount,
  netAmount,
  patientName,
  therapistName,
  trigger,
  onPaymentSuccess,
}: ManualPaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [method, setMethod] = React.useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('cash');
  const [referenceNo, setReferenceNo] = React.useState('');
  const [collectorName, setCollectorName] = React.useState('');
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = React.useState('');
  const { toast } = useToast();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId) return;

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again to record payment.',
          variant: 'destructive',
        });
        return;
      }

      const generatedPaymentId = referenceNo.trim() 
        ? `${method.toUpperCase()}_${referenceNo.trim()}`
        : `${method.toUpperCase()}_${Date.now()}`;

      // 1. Confirm appointment payment via backend endpoint
      const { data: res } = await serverApi.post(
        `/api/appointments/${sourceId}/pay`,
        {
          paymentId: generatedPaymentId,
          gateway: `manual_${method}`,
          collector: collectorName || 'Admin Desk',
          paymentDate,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 2. Add an audit log entry for accounting
      try {
        await addAuditLog({
          actorId: 'admin',
          action: 'payment.manual_confirmed',
          targetCollection: 'appointments',
          targetId: String(sourceId),
          timestamp: new Date(),
          metadata: {
            method,
            referenceNo: referenceNo.trim(),
            collectorName,
            paymentDate,
            grossAmount,
            netAmount,
            notes,
          },
        });
      } catch (logErr) {
        console.warn('Audit log recording failed, proceeding anyway:', logErr);
      }

      toast({
        title: 'Payment Recorded Successfully',
        description: `Booking #${sourceId} marked as Paid via ${method.toUpperCase()}.`,
      });

      setOpen(false);

      if (onPaymentSuccess) {
        onPaymentSuccess({
          method,
          referenceNo: referenceNo.trim(),
          paidAt: paymentDate,
          notes,
        });
      }
    } catch (err: any) {
      console.error('Failed to record manual payment:', err);
      toast({
        title: 'Recording Failed',
        description: err?.response?.data?.error || err?.message || 'Could not record payment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mark Paid</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleConfirm}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Banknote className="h-5 w-5 text-emerald-600" />
              Record Manual Payment
            </DialogTitle>
            <DialogDescription>
              Mark Booking #{sourceId} as paid using cash, offline UPI, or bank transfer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Booking Summary Box */}
            <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Booking ID:</span>
                <span className="font-mono font-semibold">#{sourceId}</span>
              </div>
              {patientName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-medium">{patientName}</span>
                </div>
              )}
              {therapistName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Therapist:</span>
                  <span className="font-medium">{therapistName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary">
                  {grossAmount ? <Price amount={grossAmount} showDecimals /> : '₹0.00'}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select
                value={method}
                onValueChange={(val: any) => setMethod(val)}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      <span>Cash (Clinic / Home Visit)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-purple-600" />
                      <span>Offline UPI (GPay / PhonePe / QR)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span>Direct Bank Transfer (NEFT / IMPS)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cheque">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      <span>Cheque / Demand Draft</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number / UTR */}
            <div className="space-y-1.5">
              <Label htmlFor="ref-no">
                Reference / UTR / Txn No.
                {method !== 'cash' && <span className="text-muted-foreground text-xs ml-1">(Recommended)</span>}
              </Label>
              <Input
                id="ref-no"
                placeholder={
                  method === 'cash' 
                    ? 'e.g. Receipt #104 (optional)' 
                    : method === 'upi'
                    ? 'e.g. 12-digit UPI UTR / Txn ID'
                    : 'e.g. Bank NEFT reference'
                }
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>

            {/* Collected By & Date in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="collector">Received By</Label>
                <Input
                  id="collector"
                  placeholder="e.g. Receptionist / Self"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment-date">Payment Date *</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Remarks / Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Remarks / Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes regarding the manual payment..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm & Mark Paid</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
