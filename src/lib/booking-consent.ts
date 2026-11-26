// Consent rules of a booking (handoff pack P25): the server decides, the form only collects.
export const ADULT_AGE = 18;     // same number as businessRules.consent.adultAge

/** Age in whole years from a YYYY-MM-DD value; null when it cannot be read. */
export function ageFromDob(dob?: string | null, now: Date = new Date()): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export const isMinor = (dob?: string | null) => { const a = ageFromDob(dob); return a !== null && a < ADULT_AGE; };

type ConsentFields = {
  dob?: string; consent_medical?: boolean; consent_privacy?: boolean;
  guardianName?: string; guardianRelation?: string; guardianPhone?: string; guardianConsent?: boolean;
};

/** The two parts of the booking payload the server checks: what was accepted and, for a patient under 18, the guardian. */
export function consentPayload(d: ConsentFields) {
  return {
    consents: { medical: d.consent_medical === true, privacy: d.consent_privacy === true },
    guardian: isMinor(d.dob) ? { name: d.guardianName, relation: d.guardianRelation, phone: d.guardianPhone, consent: d.guardianConsent === true } : undefined,
  };
}

/** zod refinement: below 18 the guardian's details and consent are needed before the booking can go on. */
export function guardianIssues(d: ConsentFields): { path: string[]; message: string }[] {
  if (!isMinor(d.dob)) return [];
  const out: { path: string[]; message: string }[] = [];
  if (!String(d.guardianName ?? '').trim()) out.push({ path: ['guardianName'], message: "Please enter the parent or guardian's name." });
  if (!String(d.guardianRelation ?? '').trim()) out.push({ path: ['guardianRelation'], message: 'Please enter the relation (for example Mother).' });
  if (String(d.guardianPhone ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').length !== 10) out.push({ path: ['guardianPhone'], message: 'Please enter a 10-digit mobile number.' });
  if (d.guardianConsent !== true) out.push({ path: ['guardianConsent'], message: 'A parent or guardian must consent to this booking.' });
  return out;
}
