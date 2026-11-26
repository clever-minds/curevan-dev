'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTherapistSlots } from '@/lib/repos/appointments';

export type NextSessionPlan = {
  mode: 'single' | 'series' | 'later' | 'none';
  date?: string; time?: string;
  weekdays?: number[]; occurrences?: number; startDate?: string;
  reason?: string;
};

const DAYS = [['Sun', 0], ['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6]] as const;

/** Why the plan cannot be submitted yet (null = fine). Mirrors the server's rules. */
export function nextPlanProblem(plan: NextSessionPlan, sessionType: string): string | null {
  if (sessionType === 'discharge' && plan.mode !== 'single' && plan.mode !== 'series') return null;
  if (plan.mode === 'none' && sessionType !== 'discharge') return 'next session plan';
  if (plan.mode === 'later' && (plan.reason ?? '').trim().length < 3) return 'reason for "patient will book later"';
  if (plan.mode === 'single' && (!plan.date || !plan.time)) return 'date and time of the next session';
  if (plan.mode === 'series' && (!(plan.weekdays?.length) || !plan.time || !(Number(plan.occurrences) >= 1))) return 'weekdays, time and number of sessions of the series';
  return null;
}

const addDays = (ymd: string, n: number) => { const d = new Date(`${ymd}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const todayIst = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

/** The "Next session plan" block of the PCR: one session, a weekly series, "patient will book later", or "no further sessions". */
export function NextSessionPlanner({ therapistUserId, sessionType, frequencyPerWeek, remainingSessions, value, onChange, disabled }: {
  therapistUserId: number; sessionType: string; frequencyPerWeek?: number | null; remainingSessions?: number | null;
  value: NextSessionPlan; onChange: (p: NextSessionPlan) => void; disabled?: boolean;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const slotDate = value.mode === 'single' ? value.date : value.mode === 'series' ? value.startDate : undefined;

  // prefill: next visit is (7 / sessions per week) days away, or in 2 days when there is no plan
  useEffect(() => {
    if (value.mode === 'single' && !value.date) onChange({ ...value, date: addDays(todayIst(), frequencyPerWeek ? Math.max(1, Math.round(7 / frequencyPerWeek)) : 2) });
    if (value.mode === 'series' && !value.startDate) onChange({ ...value, startDate: addDays(todayIst(), 1), occurrences: value.occurrences ?? Math.min(12, remainingSessions || 6), weekdays: value.weekdays ?? (frequencyPerWeek && frequencyPerWeek >= 3 ? [1, 3, 5] : frequencyPerWeek === 2 ? [2, 5] : [1]) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.mode]);

  // only free times are offered (the server answers with the therapist's real availability, leave and bookings)
  useEffect(() => {
    if (!therapistUserId || !slotDate) { setSlots([]); return; }
    let cancelled = false;
    setLoading(true);
    getTherapistSlots(therapistUserId, slotDate).then((r) => { if (!cancelled) { setSlots(r.slots); setLoading(false); } });
    return () => { cancelled = true; };
  }, [therapistUserId, slotDate]);

  const set = (patch: Partial<NextSessionPlan>) => onChange({ ...value, ...patch });
  const modes: [NextSessionPlan['mode'], string][] = [['single', 'Single next session'], ['series', 'Series'], ['later', 'Patient will book later']];
  if (sessionType === 'discharge') modes.push(['none', 'No further sessions']);

  return (
    <fieldset className="space-y-3" disabled={disabled} data-testid="next-session-planner">
      <legend className="text-sm font-medium">Next session plan</legend>
      <div className="flex flex-wrap gap-3">
        {modes.map(([m, label]) => (
          <label key={m} className="flex items-center gap-2 text-sm">
            <input type="radio" name="next-mode" checked={value.mode === m} onChange={() => onChange({ mode: m })} />
            {label}
          </label>
        ))}
      </div>

      {value.mode === 'single' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Date<Input type="date" value={value.date ?? ''} min={todayIst()} onChange={(e) => set({ date: e.target.value, time: undefined })} /></label>
          <label className="text-sm">Time
            <Select value={value.time ?? ''} onValueChange={(t) => set({ time: t })}>
              <SelectTrigger><SelectValue placeholder={loading ? 'Loading...' : slots.length ? 'Choose a free time' : 'No free times'} /></SelectTrigger>
              <SelectContent>{slots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          {!loading && value.date && slots.length === 0 && <p className="text-xs text-destructive sm:col-span-2">No free times on this date (you may be on leave or fully booked). Pick another day.</p>}
        </div>
      )}

      {value.mode === 'series' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {DAYS.map(([label, n]) => (
              <label key={n} className="flex items-center gap-1 text-sm">
                <Checkbox checked={value.weekdays?.includes(n) ?? false} onCheckedChange={(c) => set({ weekdays: c === true ? [...(value.weekdays ?? []), n] : (value.weekdays ?? []).filter((x) => x !== n) })} />
                {label}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Starting from<Input type="date" value={value.startDate ?? ''} min={todayIst()} onChange={(e) => set({ startDate: e.target.value, time: undefined })} /></label>
            <label className="text-sm">Time
              <Select value={value.time ?? ''} onValueChange={(t) => set({ time: t })}>
                <SelectTrigger><SelectValue placeholder={loading ? 'Loading...' : 'Choose a time'} /></SelectTrigger>
                <SelectContent>{slots.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="text-sm">Sessions (max 12)<Input type="number" min={1} max={12} value={value.occurrences ?? ''} onChange={(e) => set({ occurrences: Number(e.target.value) })} /></label>
          </div>
          <p className="text-xs text-muted-foreground">Times shown are free on the first date; each session is checked again when you submit.</p>
        </div>
      )}

      {value.mode === 'later' && (
        <label className="block text-sm">Reason<Input value={value.reason ?? ''} maxLength={200} placeholder="e.g. Patient will check their calendar" onChange={(e) => set({ reason: e.target.value })} /></label>
      )}
    </fieldset>
  );
}
