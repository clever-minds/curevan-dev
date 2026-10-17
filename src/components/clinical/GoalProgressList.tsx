'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { PlanGoalProgress } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  in_progress: 'In progress', achieved: 'Achieved', partially_achieved: 'Partly achieved', not_achieved: 'Not achieved', revised: 'Revised',
};

export function GoalProgressList({ goals }: { goals: PlanGoalProgress[] }) {
  if (!goals.length) return <p className="text-sm text-muted-foreground">No goals have been set yet.</p>;
  return (
    <ul className="space-y-4">
      {goals.map((g) => {
        const pct = g.percentTowardTarget === null ? null : Math.max(0, Math.min(100, g.percentTowardTarget));
        return (
          <li key={g.id} className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{g.description}</p>
              <Badge variant={g.status === 'achieved' ? 'default' : 'secondary'}>{STATUS_LABEL[g.status] ?? g.status}</Badge>
            </div>
            {pct !== null ? (
              <>
                <Progress value={pct} aria-label={`Progress toward goal: ${g.description}`} />
                <p className="text-xs text-muted-foreground">{Math.round(g.percentTowardTarget ?? 0)}% of the way to the target{g.measureName ? ` (${g.measureName})` : ''}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No measurement linked to this goal yet.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
