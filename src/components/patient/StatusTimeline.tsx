'use client';

/** Booked > Therapist assigned > On the way > Arrived > In session > Report ready. */
export const TIMELINE_STEPS = ['Booked', 'Therapist assigned', 'On the way', 'Arrived', 'In session', 'Report ready'] as const;

/** Index of the last step reached for a booking status. */
export function timelineIndex(status: string): number {
  switch (status) {
    case 'pending_payment': case 'searching_therapist': return 0;
    case 'accepted_unpaid': case 'confirmed': return 1;
    case 'therapist_on_the_way': return 2;
    case 'arrived': return 3;
    case 'in_progress': case 'pcr_pending': return 4;
    case 'completed': return 5;
    default: return 0;
  }
}

export function StatusTimeline({ status }: { status: string }) {
  const at = timelineIndex(status);
  return (
    <ol className="grid grid-cols-6 gap-1 text-center text-[11px] leading-tight" aria-label="Booking progress">
      {TIMELINE_STEPS.map((label, i) => (
        <li key={label} className={i <= at ? 'font-semibold text-primary' : 'text-muted-foreground'} aria-current={i === at ? 'step' : undefined}>
          <div className={`mx-auto mb-1 h-2.5 w-2.5 rounded-full ${i <= at ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
          {label}
        </li>
      ))}
    </ol>
  );
}
