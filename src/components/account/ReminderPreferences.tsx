'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getReminderPrefs, saveReminderPrefs, type ReminderPrefs } from '@/lib/repos/clinical';

/** Which reminders the user wants (24 h and 2 h before a session, a daily home-exercise nudge at 6 pm). */
export function ReminderPreferences() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  useEffect(() => { getReminderPrefs().then(setPrefs); }, []);
  if (!prefs) return null;

  const set = async (patch: Partial<ReminderPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if (!(await saveReminderPrefs(next))) toast({ variant: 'destructive', title: 'Could not save', description: 'Please try again.' });
  };

  const rows: [keyof ReminderPrefs, string, string][] = [
    ['r24h', 'Reminder 24 hours before a session', 'A notification the day before.'],
    ['r2h', 'Reminder 2 hours before a session', 'Your start code becomes visible around then.'],
    ['hep_daily', 'Daily home-exercise reminder (6 pm)', 'Only while you have an active treatment plan.'],
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Reminders</CardTitle><CardDescription>Choose what we remind you about. Therapists always get their morning agenda and a reminder before each session.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {rows.map(([key, label, hint]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>
            <Switch checked={prefs[key]} aria-label={label} onCheckedChange={(v) => set({ [key]: v })} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
