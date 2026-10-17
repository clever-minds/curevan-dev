'use client';

import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadAppointmentIcs } from '@/lib/repos/clinical';
import { slotStartMs } from '@/lib/appointment-status';

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** "Download .ics" and a Google Calendar link. The text carries no diagnosis or clinical notes. */
export function AddToCalendarButton({ appointmentId, date, time, withName }: { appointmentId: number; date: string; time: string; withName?: string }) {
  const { toast } = useToast();
  const start = slotStartMs(date, time);

  const download = async () => {
    const blob = await downloadAppointmentIcs(appointmentId);
    if (!blob) { toast({ variant: 'destructive', title: 'Could not download', description: 'The calendar file is not available right now.' }); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `curevan-session-${appointmentId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const google = start
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Curevan home session')}&dates=${stamp(start)}/${stamp(start + 3600000)}&details=${encodeURIComponent(withName ? `Curevan home session with ${withName}` : 'Curevan home session')}`
    : null;

  return (
    <span className="inline-flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={download}><CalendarPlus className="mr-2 h-4 w-4" />Download .ics</Button>
      {google && <Button asChild size="sm" variant="outline"><a href={google} target="_blank" rel="noopener noreferrer">Google Calendar</a></Button>}
    </span>
  );
}
