// Deterministic safety rules of the AI assistant (handoff pack P26). They run BEFORE the model, so they never depend on it.

export const DISCLAIMER = 'The AI assistant cannot give medical advice or diagnose. In an emergency dial 108 or 112.';

export const EMERGENCY_MESSAGE = 'This sounds like an emergency. Dial 108 / 112 or go to the nearest hospital now. Our team has been told.';

// chest pain, breathless, unconscious, stroke now, heavy bleeding, suicidal (and their usual wordings)
const RED_FLAGS: RegExp[] = [
  /chest\s*(pain|tightness|pressure)|pain\s+in\s+(my\s+)?chest|heart\s*attack/i,
  /(can'?t|cannot|can not|unable to|hard to|difficulty)\s+(breathe|breathing)|breathless|short(ness)?\s+of\s+breath|gasping/i,
  /unconscious|passed\s*out|not\s+responding|unresponsive|fainted|collapsed/i,
  /stroke\s+(right\s+)?now|having\s+a\s+stroke|face\s+(is\s+)?droop|sudden(ly)?\s+(weak|numb|paraly|can'?t\s+speak|slurred)/i,
  /heavy\s+bleeding|bleeding\s+(a\s+lot|heavily|badly|won'?t\s+stop)|blood\s+won'?t\s+stop|bleeding\s+(a\s+)?lot/i,
  /suicid|kill\s+myself|end\s+my\s+life|want\s+to\s+die|self[-\s]?harm/i,
];

export function detectRedFlag(text: string): boolean {
  const t = String(text ?? '');
  return RED_FLAGS.some((re) => re.test(t));
}

const HUMAN = /\b(human|real\s+person|agent|executive|representative|someone|somebody|operator|customer\s+(care|support))\b.*\b(talk|speak|call|connect|chat|want|need|give|transfer|escalat)|\b(talk|speak|call|connect|chat|transfer)\b.*\b(human|person|agent|someone|somebody|executive|representative)\b|i\s+want\s+(a\s+)?(human|person|agent)|human\s+please|escalate/i;
export const wantsHuman = (text: string) => HUMAN.test(String(text ?? ''));

/** The user said yes to what was just shown (used before anything irreversible, like a cancellation). */
export const isAffirmative = (text: string) => /^\s*(yes|yeah|yep|yup|confirm(ed)?|ok(ay)?|sure|proceed|go ahead|do it|please do|haan|ha|theek hai)\b/i.test(String(text ?? '')) && !/\b(no|not|don'?t|do not|cancel that|stop|wait)\b/i.test(String(text ?? ''));

export type TicketCategory = 'clinical' | 'ecommerce' | 'billing' | 'general';

/** Which team should get a hand-over, from the words of the user. */
export function categoryFor(text: string): TicketCategory {
  const t = String(text ?? '').toLowerCase();
  if (/\b(refund|invoice|bill|billing|charge[ds]?|payment|paid|gst|receipt|razorpay)\b/.test(t)) return 'billing';
  if (/\b(order|ord-|delivery|delivered|courier|shipment|shipping|product|return|parcel|awb|track)\b/.test(t)) return 'ecommerce';
  if (/\b(therapist|session|appointment|booking|physio|pain|treatment|exercise|recovery|report|pcr|otp)\b/.test(t)) return 'clinical';
  return 'general';
}

/** Symptoms to the kind of therapist (a fixed table; no diagnosis). */
export const SPECIALTY_MAP: { match: RegExp; specialty: string; note: string }[] = [
  { match: /knee|back\s*pain|neck\s*pain|shoulder|joint|arthritis|sprain|fracture|post[-\s]?surgery|muscle|sciatica|spine/i, specialty: 'Musculoskeletal physiotherapy', note: 'for pain and movement problems of bones, joints and muscles' },
  { match: /stroke|paraly|hemipleg|parkinson|balance|weakness\s+on\s+one\s+side|neuro/i, specialty: 'Neuro physiotherapy', note: 'for recovery after stroke and other nerve and brain conditions' },
  { match: /stutter|stammer|speech|speak|language|swallow|voice|aphasia/i, specialty: 'Speech therapy', note: 'for speech, language, voice and swallowing' },
  { match: /milestone|child\s+(is\s+)?not|developmental|handwriting|autism|adhd|sensory|fine\s+motor|occupational/i, specialty: 'Occupational therapy', note: 'for child development and daily-living skills' },
];

export function specialtyFor(symptoms: string): { specialty: string; note: string } | null {
  const hit = SPECIALTY_MAP.find((s) => s.match.test(String(symptoms ?? '')));
  return hit ? { specialty: hit.specialty, note: hit.note } : null;
}
