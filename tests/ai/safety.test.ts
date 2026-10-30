// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { categoryFor, detectRedFlag, isAffirmative, specialtyFor, wantsHuman } from '@/ai/safety';

describe('red-flag words (P26 step 5)', () => {
  it.each([
    'I have chest pain and it is spreading',
    'my father cannot breathe',
    "he's unconscious",
    'I think I am having a stroke right now',
    'heavy bleeding after the fall',
    'I want to kill myself',
    'she is breathless and sweating',
    'there is bleeding a lot',
  ])('flags: %s', (text) => expect(detectRedFlag(text)).toBe(true));

  it.each([
    'Where is my order ORD-123?',
    'I want to book a physiotherapy session for my knee',
    'my back pain has improved',
    'cancel my booking please',
    'what are your charges',
  ])('does not flag: %s', (text) => expect(detectRedFlag(text)).toBe(false));
});

describe('asking for a person', () => {
  it.each(['I want a human', 'let me talk to a real person', 'connect me to an agent', 'human please', 'I want to speak to someone', 'escalate this'])('yes: %s', (t) => expect(wantsHuman(t)).toBe(true));
  it.each(['where is my order', 'the person who came was great', 'book a session'])('no: %s', (t) => expect(wantsHuman(t)).toBe(false));
});

describe('a clear yes', () => {
  it.each(['yes', 'Yes, cancel it', 'confirm', 'ok go ahead', 'sure'])('affirmative: %s', (t) => expect(isAffirmative(t)).toBe(true));
  it.each(['no', 'not yet', "don't cancel", 'what is the charge?', 'wait, how much?', 'yes but no', ''])('not affirmative: %s', (t) => expect(isAffirmative(t)).toBe(false));
});

describe('which team gets a hand-over', () => {
  it('billing, e-commerce, clinical, general', () => {
    expect(categoryFor('I was charged twice, need a refund')).toBe('billing');
    expect(categoryFor('my order has not been delivered')).toBe('ecommerce');
    expect(categoryFor('my therapist session is tomorrow')).toBe('clinical');
    expect(categoryFor('hello there')).toBe('general');
  });
});

describe('symptoms to the kind of therapist (a fixed table)', () => {
  it('maps the four groups of the pack', () => {
    expect(specialtyFor('knee pain when climbing stairs')?.specialty).toBe('Musculoskeletal physiotherapy');
    expect(specialtyFor('severe back pain')?.specialty).toBe('Musculoskeletal physiotherapy');
    expect(specialtyFor('my mother had a stroke and has paralysis')?.specialty).toBe('Neuro physiotherapy');
    expect(specialtyFor('my son has a stutter')?.specialty).toBe('Speech therapy');
    expect(specialtyFor('speech delay in my daughter')?.specialty).toBe('Speech therapy');
    expect(specialtyFor('child milestones are late')?.specialty).toBe('Occupational therapy');
  });
  it('says nothing for something it does not know, and never diagnoses', () => {
    expect(specialtyFor('purple elephants')).toBeNull();
    expect(JSON.stringify(specialtyFor('knee pain'))).not.toMatch(/diagnos(is|ed) (is|as)/i);
  });
});
