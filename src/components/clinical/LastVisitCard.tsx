import { format } from 'date-fns';

export type LastVisit = {
  appointmentId: number; date?: string; time?: string; therapistName?: string; therapyType?: string; linked?: boolean;
  chiefComplaint?: string; assessment?: string; diagnosis?: string; treatmentProvided?: string; planOfCare?: string;
  bp?: string; hr?: string; rr?: string; temp?: string; functionalScore?: number | null; functionalMeasure?: string; painVas?: number | null; hep?: string;
};

const text = (v?: string | null) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** The report of the visit this one follows, read-only, at the top of the new PCR. */
export function LastVisitCard({ visit }: { visit: LastVisit }) {
  const when = visit.date ? format(new Date(visit.date), 'dd MMM yyyy') : '';
  const rows: Array<[string, string]> = [
    ['Chief complaint', text(visit.chiefComplaint)], ['Assessment', text(visit.assessment)], ['Diagnosis', text(visit.diagnosis)],
    ['Treatment given', text(visit.treatmentProvided)], ['Plan of care', text(visit.planOfCare)], ['Home exercises', text(visit.hep)],
    ['Vitals', [visit.bp && `BP ${visit.bp}`, visit.hr && `HR ${visit.hr}`, visit.rr && `RR ${visit.rr}`, visit.temp && `Temp ${visit.temp}`].filter(Boolean).join(', ')],
    ['Scores', [visit.functionalScore != null && `Function ${visit.functionalScore}/10${visit.functionalMeasure ? ` (${visit.functionalMeasure})` : ''}`, visit.painVas != null && `Pain ${visit.painVas}/10`].filter(Boolean).join(', ')],
  ];
  return (
    <details open className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm" data-testid="last-visit-card">
      <summary className="cursor-pointer font-medium">
        Last visit report{when ? ` · ${when}` : ''}{visit.therapistName ? ` · ${visit.therapistName}` : ''}
        <span className="ml-2 text-xs font-normal text-muted-foreground">{visit.linked ? 'the visit this follow-up continues' : 'latest locked report for this patient'}</span>
      </summary>
      <div className="mt-3 space-y-1">
        {rows.filter(([, v]) => v).map(([k, v]) => <p key={k}><span className="text-muted-foreground">{k}: </span>{v}</p>)}
      </div>
    </details>
  );
}
