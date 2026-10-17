// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---- fakes: the signed-in user's token, the backend API, and the model --------------------------------
const state = { token: 'x.' + Buffer.from(JSON.stringify({ id: 7 })).toString('base64url') + '.y' as string | null, backendCalls: [] as any[], generateCalls: [] as any[], generate: (async (): Promise<any> => ({ text: 'Hello from the model' })) as (args: any) => Promise<any>, routes: {} as Record<string, any> };

vi.mock('@/lib/auth', () => ({ getToken: async () => state.token }));
vi.mock('@/lib/repos/axios.server', () => ({
  default: {
    request: async ({ method, url, data }: any) => {
      state.backendCalls.push({ method, url, data });
      const hit = state.routes[`${method} ${url}`] ?? (url.startsWith('/api/support/chat/sessions/') ? { success: true } : undefined);
      if (hit === undefined) throw Object.assign(new Error('Not found'), { response: { data: { error: 'Not found' } } });
      if (hit instanceof Error) throw hit;
      return { data: hit };
    },
  },
}));
vi.mock('@/ai/genkit', () => ({
  aiModelId: () => process.env.AI_MODEL_ID ?? '',
  AiNotConfiguredError: class AiNotConfiguredError extends Error {},
  requireModel: () => { if (!process.env.AI_MODEL_ID) { const E = (vi as any).AiNotConfiguredErrorRef; throw new E(); } return { name: process.env.AI_MODEL_ID }; },
  ai: {
    dynamicTool: (def: any, fn: any) => ({ def, fn }),
    generate: async (args: any) => { state.generateCalls.push(args); return state.generate(args); },
  },
}));

import { curevanAssistant, aiHealthCheck } from '@/ai/flows/chat-assistant';
import * as genkitMock from '@/ai/genkit';
(vi as any).AiNotConfiguredErrorRef = (genkitMock as any).AiNotConfiguredError;

const ESCALATE_OK = { data: { ticketId: 41, priority: 'P3', category: 'ecommerce', supportOpen: true, callbackMessage: null } };

beforeEach(() => {
  state.token = 'x.' + Buffer.from(JSON.stringify({ id: 7 })).toString('base64url') + '.y';
  state.backendCalls = []; state.generateCalls = []; state.generate = async () => ({ text: 'Hello from the model' });
  state.routes = { 'POST /api/support/chat/sessions': { data: { id: 5 } }, 'POST /api/support/escalate': ESCALATE_OK };
  process.env.AI_MODEL_ID = 'test-model-1';
});

const escalations = () => state.backendCalls.filter((c) => c.url === '/api/support/escalate');

describe('red flag (P26 step 5)', () => {
  it('shows the emergency text, makes a P1-style clinical escalation and does not call the model', async () => {
    state.routes['POST /api/support/escalate'] = { data: { ticketId: 50, priority: 'P1', category: 'clinical', callbackMessage: null } };
    const out = await curevanAssistant({ query: 'I have chest pain and cannot breathe' });
    expect(out.emergency).toBe(true);
    expect(out.answer).toMatch(/108/);
    expect(out.escalation?.priority).toBe('P1');
    expect(state.generateCalls).toHaveLength(0);
    expect(escalations()[0].data).toMatchObject({ reason: 'red_flag', category: 'clinical', sessionId: 5 });
  });
  it('shows the banner text even for a visitor who is not signed in (no ticket possible)', async () => {
    state.token = null;
    const out = await curevanAssistant({ query: 'he is unconscious' });
    expect(out.emergency).toBe(true);
    expect(out.escalation).toBeUndefined();
    expect(state.backendCalls).toHaveLength(0);
  });
});

describe('"I want a human" (P26 step 4)', () => {
  it('creates a ticket with the category from the topic and a two-line summary, and tells the user', async () => {
    state.routes['POST /api/support/escalate'] = { data: { ticketId: 41, priority: 'P3', category: 'ecommerce', callbackMessage: 'We will call you back by 09:30.' } };
    const out = await curevanAssistant({ query: 'I want a human', history: [{ role: 'user', content: 'my order ORD-5 never came' }] });
    expect(out.answer).toMatch(/ticket #41/);
    expect(out.answer).toMatch(/09:30/);
    const call = escalations()[0].data;
    expect(call).toMatchObject({ reason: 'human_requested', category: 'ecommerce' });
    expect(call.summary.split('\n')).toHaveLength(2);
    expect(call.summary).toMatch(/ORD-5/);
    expect(state.generateCalls).toHaveLength(0);
  });
  it('a visitor who is not signed in is told how to reach the team', async () => {
    state.token = null;
    const out = await curevanAssistant({ query: 'let me talk to a person' });
    expect(out.answer).toMatch(/sign in/i);
  });
  it('if the ticket cannot be made the user still gets the contact details', async () => {
    state.routes['POST /api/support/escalate'] = new Error('down');
    const out = await curevanAssistant({ query: 'I want a human' });
    expect(out.answer).toMatch(/care@curevan\.com/);
  });
});

describe('the model path', () => {
  it('uses the model from AI_MODEL_ID and passes the six tools, the history and a system prompt that forbids diagnosis', async () => {
    const out = await curevanAssistant({ query: 'Where is my order?', history: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] });
    expect(out.answer).toBe('Hello from the model');
    const args = state.generateCalls[0];
    expect(args.model).toEqual({ name: 'test-model-1' });
    expect(args.tools.map((t: any) => t.def.name).sort()).toEqual(['appointmentStatus', 'cancelBooking', 'findSpecialty', 'myProgress', 'requestReturn', 'trackOrder']);
    expect(args.system).toMatch(/do NOT diagnose/i);
    expect(args.messages.map((m: any) => m.role)).toEqual(['user', 'model', 'user']);
    expect(out.sessionId).toBe(5);
  });
  it('changing AI_MODEL_ID changes the model with no code change', async () => {
    process.env.AI_MODEL_ID = 'another-model-2';
    await curevanAssistant({ query: 'hello' });
    expect(state.generateCalls[0].model).toEqual({ name: 'another-model-2' });
  });
  it('with no AI_MODEL_ID the assistant says it is unavailable instead of failing', async () => {
    process.env.AI_MODEL_ID = '';
    const out = await curevanAssistant({ query: 'hello' });
    expect(out.answer).toMatch(/not available/i);
    expect(state.generateCalls).toHaveLength(0);
  });
  it('a visitor who is not signed in gets no tools', async () => {
    state.token = null;
    await curevanAssistant({ query: 'what services do you offer' });
    expect(state.generateCalls[0].tools).toEqual([]);
    expect(state.generateCalls[0].system).toMatch(/not signed in/i);
  });
  it('the system prompt carries no phone number or address of the user', async () => {
    await curevanAssistant({ query: 'hello' });
    expect(JSON.stringify(state.generateCalls[0].messages)).not.toMatch(/\d{10}/);
  });
  it('two failed tool attempts hand the chat to a person with a ticket', async () => {
    state.routes['GET /api/orders/my-orders'] = new Error('boom');
    state.routes['GET /api/clinical/plans'] = new Error('boom');
    state.routes['POST /api/support/escalate'] = { data: { ticketId: 61, priority: 'P3', category: 'ecommerce', callbackMessage: null } };
    state.generate = async (args: any) => {
      const byName = (n: string) => args.tools.find((t: any) => t.def.name === n);
      await byName('trackOrder').fn({ orderId: 'ORD-1' });
      await byName('myProgress').fn({});
      return { text: 'I could not look that up.' };
    };
    const out = await curevanAssistant({ query: 'where is ORD-1 and how is my progress' });
    expect(out.escalation?.ticketId).toBe(61);
    expect(out.answer).toMatch(/ticket #61/);
    expect(escalations()[0].data.reason).toBe('tool_failures');
  });
  it('one failed attempt does not hand over', async () => {
    state.routes['GET /api/orders/my-orders'] = new Error('boom');
    state.generate = async (args: any) => { await args.tools.find((t: any) => t.def.name === 'trackOrder').fn({ orderId: 'ORD-1' }); return { text: 'Sorry, try again later.' }; };
    const out = await curevanAssistant({ query: 'where is ORD-1' });
    expect(out.escalation).toBeUndefined();
    expect(escalations()).toHaveLength(0);
  });
  it('a model error or an empty answer hands over instead of leaving the user hanging', async () => {
    state.generate = async () => { throw new Error('quota'); };
    const out = await curevanAssistant({ query: 'tell me about physio' });
    expect(out.escalation).toBeDefined();
    expect(out.answer).toMatch(/passed it to our team/);
  });
  it('the chat is saved to the session (the user message and the answer, with the tool trace)', async () => {
    await curevanAssistant({ query: 'hello' });
    const saved = state.backendCalls.find((c) => c.url === '/api/support/chat/sessions/5/messages');
    expect(saved.data.messages.map((m: any) => m.sender)).toEqual(['user', 'ai']);
  });
  it('an empty message is not sent to the model', async () => {
    expect((await curevanAssistant({ query: '   ' })).answer).toMatch(/type your question/i);
    expect(state.generateCalls).toHaveLength(0);
  });
});

describe('admin health check', () => {
  it('is not configured without AI_MODEL_ID, and ok when the model answers', async () => {
    process.env.AI_MODEL_ID = '';
    expect(await aiHealthCheck()).toMatchObject({ configured: false, ok: false });
    process.env.AI_MODEL_ID = 'test-model-1';
    state.generate = async () => ({ text: 'OK' });
    expect(await aiHealthCheck()).toMatchObject({ configured: true, model: 'test-model-1', ok: true });
    state.generate = async () => { throw new Error('API key not valid'); };
    expect(await aiHealthCheck()).toMatchObject({ configured: true, ok: false, error: expect.stringMatching(/API key/) });
  });
});
