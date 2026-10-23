import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LastVisitCard } from '@/components/clinical/LastVisitCard';

describe('last visit report in the new PCR', () => {
  const visit = {
    appointmentId: 7, date: '2026-10-19', therapistName: 'Dr Tara', linked: true,
    assessment: '<p>Reduced knee flexion</p>', treatmentProvided: 'Manual therapy', planOfCare: 'Twice weekly', hep: 'Straight leg raises',
    bp: '120/80', hr: '78', functionalScore: 6, functionalMeasure: 'Range of motion', painVas: 4,
  };
  it('shows the report, with HTML stripped, and says it is the visit being continued', () => {
    render(<LastVisitCard visit={visit} />);
    expect(screen.getByTestId('last-visit-card').textContent).toContain('Reduced knee flexion');
    expect(screen.getByTestId('last-visit-card').textContent).not.toContain('<p>');
    expect(screen.getByText(/the visit this follow-up continues/)).toBeTruthy();
    expect(screen.getByText(/Function 6\/10 \(Range of motion\), Pain 4\/10/)).toBeTruthy();
  });
  it('leaves out what was not recorded and says so when it is only the latest report', () => {
    render(<LastVisitCard visit={{ appointmentId: 1, linked: false, assessment: 'x' }} />);
    expect(screen.queryByText(/Vitals/)).toBeNull();
    expect(screen.queryByText(/Scores/)).toBeNull();
    expect(screen.getByText(/latest locked report for this patient/)).toBeTruthy();
  });
});
