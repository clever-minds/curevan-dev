'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import useRazorpay from '@/hooks/use-razorpay';
import { startAppointmentPayment, verifyBookingPayment } from '@/lib/actions/booking';
import { getTherapistSlots } from '@/lib/repos/appointments';
import { changeFollowUpTime, confirmFollowUp, declineFollowUp, listMyFollowUps, type FollowUpRow } from '@/lib/repos/clinical';
import { AddToCalendarButton } from '@/components/calendar/AddToCalendarButton';

const when = (d: string, t: string) => `${new Date(`${d}T${t}:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} at ${t}`;
const open = (s: FollowUpRow) => ['proposed', 'changed'].includes(s.status) && s.apptStatus === 'proposed';

/** Sessions the therapist recommended: confirm and pay, confirm the whole series, choose another time, or decline. */
export function ConfirmNextSessionCard() {
  const { toast } = useToast();
  const { openPayment } = useRazorpay();
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [changing, setChanging] = useState<{ id: number; date: string; slots: string[]; time: string } | null>(null);

  const load = useCallback(async () => setRows((await listMyFollowUps()).filter((r) => ['proposed', 'changed', 'confirmed'].includes(r.status) && ['proposed', 'accepted_unpaid'].includes(r.apptStatus))), []);
  useEffect(() => { load(); }, [load]);

  const pay = async (appointmentId: number, label: string) => {
    const started = await startAppointmentPayment(appointmentId);
    if (!started.success || !started.razorpayOrderId || !started.amountPaise) { toast({ variant: 'destructive', title: 'Payment', description: started.error || 'Could not start the payment.' }); return; }
    openPayment({
      amount: started.amountPaise, currency: 'INR', receipt: `appt-${appointmentId}`, orderId: started.razorpayOrderId, keyId: started.keyId,
      productName: 'Curevan home session', productDescription: label, prefill: {},
      onSuccess: async (resp) => {
        const verified = await verifyBookingPayment({ razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature });
        if (verified.success) { toast({ title: 'Session confirmed' }); load(); }
        else toast({ variant: 'destructive', title: 'Payment not confirmed', description: verified.error });
      },
      onFailure: (err) => toast({ variant: 'destructive', title: 'Payment failed', description: err.reason || 'Please try again.' }),
    });
  };

  const confirmAndPay = async (s: FollowUpRow) => {
    setBusy(s.id);
    const res = await confirmFollowUp(s.id);
    if (!res.ok || !res.appointmentId) { setBusy(null); toast({ variant: 'destructive', title: 'Could not confirm', description: res.error }); return; }
    await pay(res.appointmentId, `Session on ${when(s.date, s.time)}`);
    setBusy(null);
  };

  const confirmAll = async (s: FollowUpRow) => {
    setBusy(s.id);
    const res = await confirmFollowUp(s.id, true);
    setBusy(null);
    if (!res.ok) { toast({ variant: 'destructive', title: 'Could not confirm', description: res.error }); return; }
    toast({ title: 'Sessions confirmed', description: 'Pay for each session before it takes place (use Pay now).' });
    load();
  };

  const decline = async (s: FollowUpRow) => {
    setBusy(s.id);
    const res = await declineFollowUp(s.id);
    setBusy(null);
    if (!res.ok) toast({ variant: 'destructive', title: 'Could not decline', description: res.error });
    load();
  };

  const startChange = async (s: FollowUpRow) => setChanging({ id: s.id, date: s.date, slots: [], time: '' });
  const pickDate = async (s: FollowUpRow, date: string) => {
    setChanging((c) => (c ? { ...c, date, time: '', slots: [] } : c));
    const r = await getTherapistSlots(s.therapistId, date);
    setChanging((c) => (c ? { ...c, slots: r.slots } : c));
  };
  const saveChange = async () => {
    if (!changing || !changing.time) return;
    const res = await changeFollowUpTime(changing.id, changing.date, changing.time);
    if (!res.ok) { toast({ variant: 'destructive', title: 'Could not change the time', description: res.error }); return; }
    setChanging(null);
    toast({ title: 'Time changed' });
    load();
  };

  if (!rows.length) return null;
  const bySeries = new Map<string, FollowUpRow[]>();
  for (const r of rows) bySeries.set(r.seriesId ? `s${r.seriesId}` : `i${r.id}`, [...(bySeries.get(r.seriesId ? `s${r.seriesId}` : `i${r.id}`) ?? []), r]);

  return (
    <div className="space-y-4" data-testid="next-session-cards">
      {[...bySeries.values()].map((group) => {
        const proposed = group.filter(open);
        return (
          <Card key={group[0].id} className="border-sky-300">
            <CardHeader>
              <CardTitle className="text-base">{group.length > 1 ? `Your therapist recommends ${group.length} sessions` : 'Your therapist recommends your next session'}</CardTitle>
              <CardDescription>Confirm to keep {group.length > 1 ? 'these slots' : 'this slot'}. Slots not confirmed in time are released.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {group.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                    <span>{when(s.date, s.time)} <Badge variant="secondary" className="ml-2">{s.apptStatus === 'accepted_unpaid' ? 'Confirmed - pay before the session' : 'Waiting for you'}</Badge></span>
                    <span className="flex flex-wrap gap-2">
                      {s.apptStatus === 'accepted_unpaid' && <Button size="sm" disabled={busy === s.id} onClick={() => pay(s.appointmentId, `Session on ${when(s.date, s.time)}`)}>Pay now</Button>}
                      {open(s) && group.length === 1 && <Button size="sm" disabled={busy === s.id} onClick={() => confirmAndPay(s)}>Confirm &amp; pay</Button>}
                      {open(s) && <Button size="sm" variant="outline" onClick={() => startChange(s)}>Choose another time</Button>}
                      {open(s) && <Button size="sm" variant="ghost" disabled={busy === s.id} onClick={() => decline(s)}>Decline</Button>}
                      <AddToCalendarButton appointmentId={s.appointmentId} date={s.date} time={s.time} withName={s.therapistName} />
                    </span>
                    {changing?.id === s.id && (
                      <div className="flex w-full flex-wrap items-center gap-2 pt-2">
                        <Input type="date" className="w-44" value={changing.date} onChange={(e) => pickDate(s, e.target.value)} />
                        <Select value={changing.time} onValueChange={(t) => setChanging((c) => (c ? { ...c, time: t } : c))}>
                          <SelectTrigger className="w-36"><SelectValue placeholder="Free time" /></SelectTrigger>
                          <SelectContent>{changing.slots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button size="sm" disabled={!changing.time} onClick={saveChange}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setChanging(null)}>Cancel</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {group.length > 1 && proposed.length > 0 && <Button disabled={busy === proposed[0].id} onClick={() => confirmAll(proposed[0])}>Confirm all {proposed.length} sessions</Button>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
