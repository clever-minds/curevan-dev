// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { callWindowOpen } from '@/components/communication/CallButton';

const cfg = { windowHoursBefore: 2, windowHoursAfter: 1, slotMinutes: 60 };
const at = (iso: string) => Date.parse(iso);

describe('calling window (P27): 2 h before the slot to 1 h after it ended', () => {
  const date = '2026-10-20', time = '10:00';          // slot 10:00-11:00 India time
  it.each([
    ['07:59 closed', '2026-10-20T07:59:00+05:30', false],
    ['08:00 open', '2026-10-20T08:00:00+05:30', true],
    ['10:30 open', '2026-10-20T10:30:00+05:30', true],
    ['12:00 open (1 h after the end)', '2026-10-20T12:00:00+05:30', true],
    ['12:01 closed', '2026-10-20T12:01:00+05:30', false],
  ])('%s', (_n, iso, open) => expect(callWindowOpen(date, time, cfg, at(iso))).toBe(open));
  it('an unreadable date is closed', () => expect(callWindowOpen(null, '10:00', cfg, Date.now())).toBe(false));
});
