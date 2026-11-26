'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { DueMeasure } from '@/lib/types';

export type OutcomeEntry = { value: string; couldNotAssess: boolean; reason: string };
export const outcomeKey = (m: Pick<DueMeasure, 'measureId' | 'side' | 'item'>) => `${m.measureId}|${m.side ?? ''}|${m.item ?? ''}`;

/** The "Outcome measures due today" block of the PCR. Every due measure needs a value, or "Could not assess" with a reason. */
export function OutcomeMeasureInput({ due, entries, onChange, disabled }: {
  due: DueMeasure[];
  entries: Record<string, OutcomeEntry>;
  onChange: (key: string, entry: OutcomeEntry) => void;
  disabled?: boolean;
}) {
  if (!due.length) return <p className="text-sm text-muted-foreground">No outcome measures are due at this visit.</p>;
  return (
    <ul className="space-y-4">
      {due.map((m) => {
        const key = outcomeKey(m);
        const e = entries[key] ?? { value: '', couldNotAssess: false, reason: '' };
        const range = m.min !== null || m.max !== null ? `${m.min ?? ''} to ${m.max ?? ''}${m.unit ? ` ${m.unit}` : ''}` : m.unit ?? '';
        return (
          <li key={key} className="rounded-md border p-3 space-y-2" data-testid={`measure-${m.code}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{m.name}{m.side ? ` (${m.side})` : ''}{m.item ? ` - ${m.item}` : ''}</p>
              <p className="text-xs text-muted-foreground">{range}{m.lastValue !== null ? ` | last: ${m.lastValue}` : ''}</p>
            </div>
            {m.instructions && <p className="text-xs text-muted-foreground">{m.instructions}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="number" step="any" inputMode="decimal" className="w-32" aria-label={`${m.name} value`}
                value={e.value} disabled={disabled || e.couldNotAssess}
                min={m.min ?? undefined} max={m.max ?? undefined}
                onChange={(ev) => onChange(key, { ...e, value: ev.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={e.couldNotAssess} disabled={disabled} onCheckedChange={(c) => onChange(key, { ...e, couldNotAssess: c === true, value: c === true ? '' : e.value })} />
                Could not assess
              </label>
              {e.couldNotAssess && (
                <Input className="min-w-48 flex-1" placeholder="Reason (required)" value={e.reason} maxLength={200} disabled={disabled} onChange={(ev) => onChange(key, { ...e, reason: ev.target.value })} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
