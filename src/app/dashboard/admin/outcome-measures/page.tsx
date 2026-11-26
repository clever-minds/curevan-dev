'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { OutcomeMeasure } from '@/lib/types';
import { createMeasure, listMeasures, setMeasureActive } from '@/lib/repos/clinical';

const SCALES = ['numeric', 'ordinal', 'percent', 'time_seconds', 'speed_mps', 'degrees'];
const FREQS = [['every_session', 'Every session'], ['review', 'At reviews'], ['baseline_discharge', 'Baseline and discharge']];

/** The measure library. Licensed scales (FIM, WAB, Oswestry...) are added here by an admin once the owner has confirmed the licence. */
export default function OutcomeMeasuresPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<OutcomeMeasure[]>([]);
  const [form, setForm] = useState({ code: '', name: '', scaleType: 'numeric', minValue: '', maxValue: '', unit: '', frequency: 'review', licenceNote: '', instructions: '' });

  const load = useCallback(async () => setRows(await listMeasures(true)), []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (m: OutcomeMeasure, active: boolean) => {
    if (!(await setMeasureActive(m.id, active))) { toast({ variant: 'destructive', title: 'Could not change the measure' }); return; }
    load();
  };

  const add = async () => {
    const num = (v: string) => (v === '' ? undefined : Number(v));
    const res = await createMeasure({ ...form, minValue: num(form.minValue), maxValue: num(form.maxValue) });
    if (!res.ok) { toast({ variant: 'destructive', title: 'Not added', description: res.error }); return; }
    toast({ title: 'Measure added' });
    setForm({ ...form, code: '', name: '', licenceNote: '', instructions: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight font-headline">Outcome Measures</h1><p className="text-muted-foreground">The standard scales therapists can track. Switch off a scale to stop new plans from using it.</p></div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Range</TableHead><TableHead>When</TableHead><TableHead>Licence</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.min_value ?? ''} to {m.max_value ?? ''} {m.unit ?? ''}</TableCell>
                  <TableCell>{String(m.frequency).replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.licence_note}</TableCell>
                  <TableCell><Switch checked={m.active} aria-label={`${m.code} active`} onCheckedChange={(v) => toggle(m, v)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add a measure</CardTitle><CardDescription>The licence note is required: say who owns the scale and why it is free to use.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="CODE" aria-label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={20} />
          <Input className="sm:col-span-2" placeholder="Name" aria-label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select value={form.scaleType} onValueChange={(v) => setForm({ ...form, scaleType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SCALES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select>
          <Input type="number" step="any" placeholder="Min" aria-label="Minimum" value={form.minValue} onChange={(e) => setForm({ ...form, minValue: e.target.value })} />
          <Input type="number" step="any" placeholder="Max" aria-label="Maximum" value={form.maxValue} onChange={(e) => setForm({ ...form, maxValue: e.target.value })} />
          <Input placeholder="Unit" aria-label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FREQS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
          <Input className="sm:col-span-3" placeholder="Licence note (required)" aria-label="Licence note" value={form.licenceNote} onChange={(e) => setForm({ ...form, licenceNote: e.target.value })} />
          <Input className="sm:col-span-3" placeholder="How to score it (instructions)" aria-label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
          <Button onClick={add} disabled={!form.code || !form.name || !form.licenceNote.trim()} className="sm:w-fit">Add measure</Button>
        </CardContent>
      </Card>
    </div>
  );
}
