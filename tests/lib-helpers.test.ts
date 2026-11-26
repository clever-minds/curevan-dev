// @vitest-environment node
// Unit tests of the real helpers the pages rely on (no copies of the logic).
import { describe, expect, it } from 'vitest';
import { resolveMyDashboardHref } from '@/lib/resolveDashboard';
import { ageFromDob, consentPayload, guardianIssues, isMinor } from '@/lib/booking-consent';
import { hasPaidInvoice, isDelivered, isInShipment, orderStatusClass, orderStatusLabel, RETURN_REASONS } from '@/lib/order-status';
import { isCancelled, slotStartMs, statusLabel } from '@/lib/appointment-status';

describe('where each role lands after sign-in (P21)', () => {
  it.each([
    [['admin.super'], '/dashboard/admin/my-dashboard'],
    [['admin.ecom'], '/dashboard/ecom-admin/my-dashboard'],
    [['admin.therapy'], '/dashboard/therapy-admin/my-dashboard'],
    [['therapist'], '/dashboard/therapist/my-dashboard'],
    [['patient'], '/dashboard/patient/my-dashboard'],
    [[], '/dashboard/patient/my-dashboard'],
    [null, '/dashboard/patient/my-dashboard'],
    [['admin'], '/dashboard/account'],              // the generic word says nothing about which admin: the account page, never the patient home
    [['admin.super', 'therapist'], '/dashboard/admin/my-dashboard'],
  ])('%j -> %s', (roles, href) => expect(resolveMyDashboardHref(roles as any)).toBe(href));
});

describe('minors and the guardian (P25)', () => {
  const now = new Date('2026-10-18T12:00:00Z');
  it('computes whole years', () => {
    expect(ageFromDob('2014-10-18', now)).toBe(12);
    expect(ageFromDob('2014-10-19', now)).toBe(11);
    expect(ageFromDob('2008-10-18', now)).toBe(18);
    expect(ageFromDob('', now)).toBeNull();
    expect(ageFromDob('not a date', now)).toBeNull();
  });
  it('requires name, relation, a 10-digit phone and the consent for a patient under 18', () => {
    const base = { dob: `${new Date().getFullYear() - 10}-01-01` };
    expect(isMinor(base.dob)).toBe(true);
    expect(guardianIssues(base).map((i) => i.path[0]).sort()).toEqual(['guardianConsent', 'guardianName', 'guardianPhone', 'guardianRelation']);
    expect(guardianIssues({ ...base, guardianName: 'A', guardianRelation: 'Mother', guardianPhone: '+91 98100 00001', guardianConsent: true })).toEqual([]);
    expect(guardianIssues({ ...base, guardianName: 'A', guardianRelation: 'Mother', guardianPhone: '123', guardianConsent: true }).map((i) => i.path[0])).toEqual(['guardianPhone']);
  });
  it('asks nothing of an adult and sends the guardian only for a minor', () => {
    expect(guardianIssues({ dob: '1990-05-05' })).toEqual([]);
    expect(consentPayload({ dob: '1990-05-05', consent_medical: true, consent_privacy: true }).guardian).toBeUndefined();
    const kid = consentPayload({ dob: `${new Date().getFullYear() - 8}-01-01`, consent_medical: true, consent_privacy: true, guardianName: 'A', guardianRelation: 'Father', guardianPhone: '9810000001', guardianConsent: true });
    expect(kid.consents).toEqual({ medical: true, privacy: true });
    expect(kid.guardian).toEqual({ name: 'A', relation: 'Father', phone: '9810000001', consent: true });
  });
});

describe('order statuses (P19): old capitalised and new courier codes', () => {
  it('labels and colours both spellings', () => {
    expect(orderStatusLabel('Shipped')).toBe('Shipped');
    expect(orderStatusLabel('in_transit')).toBe('In transit');
    expect(orderStatusLabel('out_for_delivery')).toBe('Out for delivery');
    expect(orderStatusLabel('Return Approved')).toBe('Return approved');
    expect(orderStatusClass('delivered')).toBe(orderStatusClass('Delivered'));
    expect(orderStatusClass('cancelled')).toContain('red');
  });
  it('knows who is delivered, in shipment and has an invoice', () => {
    expect(isDelivered('delivered')).toBe(true);
    expect(isDelivered('Delivered')).toBe(true);
    expect(isDelivered('in_transit')).toBe(false);
    expect(isInShipment('picked_up')).toBe(true);
    expect(isInShipment('Placed')).toBe(false);
    expect(hasPaidInvoice('Paid')).toBe(true);
    expect(hasPaidInvoice('pending_payment')).toBe(false);
  });
  it('the return reasons are the four of the pack and photos are needed for damaged and defective', () => {
    expect(RETURN_REASONS.map((r) => r.code)).toEqual(['damaged', 'defective', 'wrong_item', 'missing_part']);
    expect(RETURN_REASONS.filter((r) => r.photo).map((r) => r.code)).toEqual(['damaged', 'defective']);
  });
});

describe('booking status words and slot times', () => {
  it('has a label for every code the backend sends', () => {
    for (const s of ['confirmed', 'therapist_on_the_way', 'arrived', 'in_progress', 'pcr_pending', 'completed', 'accepted_unpaid', 'proposed']) expect(statusLabel(s)).not.toBe(s);
    expect(isCancelled('cancelled_by_patient')).toBe(true);
    expect(isCancelled('confirmed')).toBe(false);
  });
  it('reads the slot start in India time', () => {
    expect(slotStartMs('2026-10-20', '10:00')).toBe(Date.parse('2026-10-20T10:00:00+05:30'));
    expect(slotStartMs(null, '10:00')).toBeNull();
  });
});
