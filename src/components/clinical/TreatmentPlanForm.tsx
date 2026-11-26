'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OutcomeMeasure } from '@/lib/types';
import { createPlan, listMeasures } from '@/lib/repos/clinical';

type GoalRow = { description: string; measureCode: string; baselineValue: string; targetValue: string; targetDate: string };
const emptyGoal = (): GoalRow => ({ description: '', measureCode: '', baselineValue: '', targetValue: '', targetDate: '' });

/** Suggested measures by kind of service (the therapist can change them). */
function defaultsFor(serviceTypeName: string): string[] {
  const n = serviceTypeName.toLowerCase();
  if (n.includes('speech')) return ['COMM_FUNC', 'SPEECH_INT', 'NAMING', 'COMM_CONF'];
  if (n.includes('neuro')) return ['NPRS', 'MMT', 'MAS', 'FMA_UE', 'FMA_LE', 'BBS', '10MWT', 'BI'];
  return ['NPRS', 'PSFS', 'ROM', 'MMT'];
}

export function TreatmentPlanForm({ patientId, serviceTypeId, serviceTypeName = '', appointmentId, trigger, onCreated }: {
  patientId: number; serviceTypeId?: number | null; serviceTypeName?: string; appointmentId?: number; trigger: React.ReactNode; onCreated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<OutcomeMeasure[]>([]);
  const [saving, setSaving] = useState(false);
  const [condition, setCondition] = useState('');
  const [side, setSide] = useState('na');
  const [onset, setOnset] = useState('');
  const [planned, setPlanned] = useState('10');
  const [freq, setFreq] = useState('3');
  const [review, setReview] = useState('5');
  const [days, setDays] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const [goals, setGoals] = useState<GoalRow[]>([emptyGoal()]);

  useEffect(() => {
    if (!open) return;
    listMeasures().then((m) => { setLibrary(m); setChosen(defaultsFor(serviceTypeName).filter((c) => m.some((x) => x.code === c))); });
  }, [open, serviceTypeName]);

  const setGoal = (i: number, patch: Partial<GoalRow>) => setGoals((g) => g.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const toggle = (code: string) => setChosen((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]));

  const save = async () => {
    const usable = goals.filter((g) => g.description.trim());
    if (!condition.trim() || usable.length < 1) {
      toast({ variant: 'destructive', title: 'Please complete the plan', description: 'A condition and at least one goal are needed.' });
      return;
    }
    setSaving(true);
    const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
    const res = await createPlan({
      patientId, serviceTypeId: serviceTypeId ?? undefined, appointmentId, condition: condition.trim(), affectedSide: side, onsetDate: onset || undefined,
      plannedSessions: num(planned), frequencyPerWeek: num(freq), reviewEverySessions: num(review), preferredDays: days.split(',').map((d) => d.trim()).filter(Boolean),
      goals: usable.map((g) => ({ description: g.description.trim(), measureCode: g.measureCode || undefined, baselineValue: num(g.baselineValue), targetValue: num(g.targetValue), targetDate: g.targetDate || undefined })),
      measures: chosen.map((code) => {
        const m = library.find((x) => x.code === code);
        return { code, side: m?.per_side && (side === 'left' || side === 'right') ? side : undefined };
      }),
    });
    setSaving(false);
    if (!res.ok) { toast({ variant: 'destructive', title: 'Plan not saved', description: res.error }); return; }
    toast({ title: 'Treatment plan created' });
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Treatment plan</DialogTitle>
          <DialogDescription>Goals and the measures you will track. Baseline values are recorded in this visit&apos;s report.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">Condition<Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="e.g. Left hemiplegia after stroke" /></label>
          <label className="text-sm">Affected side
            <Select value={side} onValueChange={setSide}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['left', 'right', 'bilateral', 'na'].map((s) => <SelectItem key={s} value={s}>{s === 'na' ? 'Not applicable' : s}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="text-sm">Onset date<Input type="date" value={onset} onChange={(e) => setOnset(e.target.value)} /></label>
          <label className="text-sm">Planned sessions<Input type="number" min={1} value={planned} onChange={(e) => setPlanned(e.target.value)} /></label>
          <label className="text-sm">Sessions per week<Input type="number" min={1} max={7} value={freq} onChange={(e) => setFreq(e.target.value)} /></label>
          <label className="text-sm">Review every N sessions<Input type="number" min={1} value={review} onChange={(e) => setReview(e.target.value)} /></label>
          <label className="text-sm">Preferred days (comma separated)<Input value={days} onChange={(e) => setDays(e.target.value)} placeholder="mon, wed, fri" /></label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Goals (1 to 5)</p>
          {goals.map((g, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <Textarea placeholder="Goal, e.g. Walk 10 m with a quad cane independently in 6 weeks" value={g.description} onChange={(e) => setGoal(i, { description: e.target.value })} maxLength={300} />
              <div className="grid gap-2 sm:grid-cols-4">
                <Select value={g.measureCode || 'none'} onValueChange={(v) => setGoal(i, { measureCode: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Measure" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No measure</SelectItem>{library.map((m) => <SelectItem key={m.code} value={m.code}>{m.name.split(' - ')[0]}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" step="any" placeholder="Baseline" value={g.baselineValue} onChange={(e) => setGoal(i, { baselineValue: e.target.value })} />
                <Input type="number" step="any" placeholder="Target" value={g.targetValue} onChange={(e) => setGoal(i, { targetValue: e.target.value })} />
                <Input type="date" value={g.targetDate} onChange={(e) => setGoal(i, { targetDate: e.target.value })} />
              </div>
              {goals.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setGoals((x) => x.filter((_, j) => j !== i))}><Trash2 className="mr-2 h-4 w-4" />Remove goal</Button>}
            </div>
          ))}
          {goals.length < 5 && <Button type="button" variant="outline" size="sm" onClick={() => setGoals((x) => [...x, emptyGoal()])}><Plus className="mr-2 h-4 w-4" />Add goal</Button>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Measures to track</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {library.map((m) => (
              <label key={m.code} className="flex items-start gap-2 text-sm">
                <Checkbox checked={chosen.includes(m.code)} onCheckedChange={() => toggle(m.code)} />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
