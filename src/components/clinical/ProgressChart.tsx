'use client';

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PlanMeasureProgress } from '@/lib/types';

/** Plain-language one-liner shown under each chart ("Gait speed improved from 0.3 to 0.6 m/s"). */
export function measureCaption(m: PlanMeasureProgress): string {
  if (m.baseline === null || m.latest === null || m.series.length < 2) return `${m.name}: first result recorded.`;
  const better = m.higherIsBetter ? m.latest > m.baseline : m.latest < m.baseline;
  const worse = m.higherIsBetter ? m.latest < m.baseline : m.latest > m.baseline;
  const verb = better ? 'improved' : worse ? 'got worse' : 'stayed the same';
  const unit = m.unit ? ` ${m.unit}` : '';
  return `${m.name} ${verb}${better || worse ? ` from ${m.baseline} to ${m.latest}${unit}` : ` at ${m.latest}${unit}`}.`;
}

/** One line chart per measure: x = session number (or date), dashed line = the goal's target, separate left/right lines for per-side measures. */
export function ProgressChart({ measure }: { measure: PlanMeasureProgress }) {
  const sides = measure.perSide ? Array.from(new Set(measure.series.map((s) => s.side || 'value'))) : ['value'];
  const keys = measure.series.map((s, i) => s.sessionNumber ?? i + 1);
  const xs = Array.from(new Set(keys)).sort((a, b) => a - b);
  const data = xs.map((x) => {
    const row: Record<string, number | null> = { x };
    for (const side of sides) {
      const hit = measure.series.find((s, i) => (s.sessionNumber ?? i + 1) === x && (measure.perSide ? (s.side || 'value') === side : true));
      row[side] = hit ? hit.value : null;
    }
    return row;
  });
  const colors: Record<string, string> = { value: '#7c3aed', left: '#7c3aed', right: '#0d9488' };

  return (
    <figure className="space-y-2" data-testid={`chart-${measure.code}`}>
      <figcaption className="text-sm font-medium">{measure.name}{measure.side ? ` (${measure.side})` : ''}{measure.item ? ` - ${measure.item}` : ''}</figcaption>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" tick={{ fontSize: 11 }} label={{ value: 'Session', position: 'insideBottom', offset: -2, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
            <Tooltip />
            {sides.length > 1 && <Legend />}
            {measure.target !== null && <ReferenceLine y={measure.target} stroke="#16a34a" strokeDasharray="6 4" label={{ value: 'Target', fontSize: 11, fill: '#16a34a' }} />}
            {sides.map((side) => (
              <Line key={side} type="monotone" dataKey={side} name={side === 'value' ? measure.name : side} stroke={colors[side] ?? '#7c3aed'} strokeWidth={2} dot connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">{measureCaption(measure)}</p>
    </figure>
  );
}
