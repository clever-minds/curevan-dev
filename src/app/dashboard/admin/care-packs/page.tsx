'use client';

import * as React from 'react';
import { Package, RefreshCw, AlertTriangle, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminGetAllPacks, adminRefundCarePack, type CarePack } from '@/lib/repos/carePacks';

export default function AdminCarePacksPage() {
  const { toast } = useToast();
  const [packs, setPacks] = React.useState<CarePack[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedPack, setSelectedPack] = React.useState<CarePack | null>(null);
  const [refundReason, setRefundReason] = React.useState('');
  const [processingRefund, setProcessingRefund] = React.useState(false);

  const loadPacks = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminGetAllPacks();
      setPacks(data);
    } catch (err) {
      console.error('Failed to load admin care packs:', err);
      toast({ title: 'Error', description: 'Could not load care packs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const handleRefundSubmit = async () => {
    if (!selectedPack) return;
    setProcessingRefund(true);
    try {
      const res = await adminRefundCarePack(selectedPack.id, refundReason || 'Admin approved refund');
      toast({
        title: 'Refund Processed',
        description: res.message || 'Refund successfully issued through Razorpay',
      });
      setSelectedPack(null);
      setRefundReason('');
      await loadPacks();
    } catch (err) {
      toast({
        title: 'Refund Failed',
        description: err instanceof Error ? err.message : 'Please check Razorpay logs',
        variant: 'destructive',
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const filteredPacks = packs.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.patient_name || '').toLowerCase().includes(q) ||
      (p.patient_email || '').toLowerCase().includes(q) ||
      (p.plan_name || '').toLowerCase().includes(q) ||
      (p.therapist_name || '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Care Pack Operations
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor active session bundles, patient usage, and process pro-rata refunds for unused sessions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPacks} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name, email, plan, or pack ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No care packages found matching your criteria.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border bg-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground border-b">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Therapist</th>
                <th className="py-3 px-4 text-center">Usage</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPacks.map((pack) => {
                const remaining = pack.sessions_total - pack.sessions_used;
                const canRefund = pack.status === 'active' && remaining > 0 && Boolean(pack.razorpay_payment_id);

                return (
                  <tr key={pack.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-medium">#{pack.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{pack.patient_name || 'Patient'}</div>
                      <div className="text-xs text-muted-foreground">{pack.patient_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{pack.plan_name}</div>
                      <div className="text-xs text-muted-foreground">₹{Number(pack.price_paid).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {pack.therapist_name || <span className="italic">Any Therapist</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-primary">{pack.sessions_used}</span>
                      <span className="text-muted-foreground"> / {pack.sessions_total}</span>
                      <div className="text-xs text-muted-foreground">({remaining} left)</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(pack.expires_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          pack.status === 'active'
                            ? 'default'
                            : pack.status === 'exhausted'
                            ? 'secondary'
                            : pack.status === 'refunded'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="capitalize"
                      >
                        {pack.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canRefund && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setSelectedPack(pack)}
                        >
                          Refund Unused
                        </Button>
                      )}
                      {pack.status === 'refunded' && (
                        <span className="text-xs text-muted-foreground">
                          Refunded ₹{Number(pack.refunded_amount || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pro-Rata Refund Confirmation Modal */}
      {selectedPack && (
        <Dialog open={Boolean(selectedPack)} onOpenChange={(open) => !open && setSelectedPack(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Pro-Rata Refund
              </DialogTitle>
              <DialogDescription>
                Process a refund for the unused sessions of Care Pack #{selectedPack.id} ({selectedPack.plan_name}).
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const unused = selectedPack.sessions_total - selectedPack.sessions_used;
              const singlePrice = Number(selectedPack.price_paid) / selectedPack.sessions_total;
              const gross = singlePrice * unused;
              const fee = gross * 0.1; // 10% fee
              const net = Math.round((gross - fee) * 100) / 100;

              return (
                <div className="space-y-4 py-2 text-sm">
                  <div className="rounded-lg bg-muted p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unused Sessions:</span>
                      <span className="font-semibold">{unused} of {selectedPack.sessions_total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per-session value:</span>
                      <span>₹{Math.round(singlePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross value:</span>
                      <span>₹{Math.round(gross)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Admin processing fee (10%):</span>
                      <span>-₹{Math.round(fee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t pt-1.5 text-foreground">
                      <span>Net Razorpay Refund:</span>
                      <span className="text-primary font-mono font-bold">₹{net.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Reason for Refund:
                    </label>
                    <Input
                      placeholder="e.g., Medical relocation / Patient requested cancellation"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    />
                  </div>
                </div>
              );
            })()}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setSelectedPack(null)} disabled={processingRefund}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRefundSubmit}
                disabled={processingRefund}
              >
                {processingRefund ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing Refund...
                  </>
                ) : (
                  'Confirm & Refund via Razorpay'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
