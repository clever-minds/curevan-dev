'use server';

/**
 * Curevan Assistant (handoff pack P26): AI first, a person when needed.
 *  - the model comes from AI_MODEL_ID (no code change to switch it)
 *  - red-flag words and "I want a human" are handled in code BEFORE the model (src/ai/safety.ts)
 *  - the tools call the backend with the user's own token (src/ai/tools.ts); two failed tool attempts hand the chat to a person
 *  - the model sees no phone numbers or addresses, and never diagnoses or prescribes
 */

import { z } from 'zod';
import { ai, AiNotConfiguredError, aiModelId, requireModel } from '@/ai/genkit';
import { categoryFor, detectRedFlag, EMERGENCY_MESSAGE, wantsHuman } from '@/ai/safety';
import { createTools } from '@/ai/tools';
import { escalate, makeHttp, userIdFromToken, type Escalation } from '@/ai/backend';
import { getToken } from '@/lib/auth';

const ChatAssistantInputSchema = z.object({
  query: z.string().describe("The user's question or message."),
  sessionId: z.number().optional(),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

export interface ChatAssistantOutput {
  answer: string;
  emergency?: boolean;
  escalation?: Escalation;
  sessionId?: number;
}

const MAX_QUERY = 1000;
const MAX_HISTORY = 6;

const SYSTEM_PROMPT = `You are Curevan Assistant, a friendly customer care assistant of Curevan (Himaya Care Pvt. Ltd.), a home-therapy and wellness-shop platform in India.
Rules you always follow:
- You do NOT diagnose, prescribe, interpret test results or give medical advice. For anything medical, say that the therapist or a doctor must answer it.
- Use the tools for the user's own orders, bookings, progress, therapist suggestions, returns and cancellations. Never guess facts about them.
- Only the tools may reveal a start code, and only the user's own. Never repeat phone numbers or full addresses.
- To cancel a booking: first call cancelBooking without confirm and tell the user the charge; call it with confirm=true only after the user clearly says yes.
- If a tool says it failed or you cannot help, say so briefly and offer to connect the user to a person.
- Keep answers short and plain. Contact: care@curevan.com, +91 951 444 6292.
About Curevan: a brand of Himaya Care Pvt. Ltd. Services: physiotherapy, nursing care, geriatric care, speech therapy, mental health counselling, dietitian services. "Cure. Anywhere."`;

export async function curevanAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  const query = String(input.query ?? '').trim().slice(0, MAX_QUERY);
  if (!query) return { answer: 'Please type your question.' };

  const token = await getToken();
  const userId = token ? userIdFromToken(token) : null;
  const http = token ? makeHttp(token) : null;
  const history = (input.history ?? []).slice(-MAX_HISTORY);
  let sessionId = input.sessionId;

  const save = async (answer: string, toolCalls?: unknown) => {
    if (!http || !sessionId) return;
    try { await http('POST', `/api/support/chat/sessions/${sessionId}/messages`, { messages: [{ sender: 'user', text: query }, { sender: 'ai', text: answer, toolCalls }] }); } catch { /* the chat works without the log */ }
  };

  if (http && !sessionId) {
    try { sessionId = (await http('POST', '/api/support/chat/sessions', { channel: 'web' }))?.data?.id; } catch { sessionId = undefined; }
  }

  // 1. emergency words: never the model, always the banner text, and a P1 ticket when the user is signed in
  if (detectRedFlag(query)) {
    const escalation = http ? await escalate(http, { reason: 'red_flag', category: 'clinical', sessionId, summary: `The user wrote words that suggest an emergency.\nMessage: "${query.slice(0, 200)}"` }) ?? undefined : undefined;
    await save(EMERGENCY_MESSAGE);
    return { answer: EMERGENCY_MESSAGE, emergency: true, escalation, sessionId };
  }

  // 2. "I want a human": a ticket with a two-line summary and the right team
  if (wantsHuman(query)) {
    if (!http) return { answer: 'Please sign in so that we can connect you to our team, or write to care@curevan.com or call +91 951 444 6292.', sessionId };
    const lastQuestion = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';
    const topic = `${lastQuestion} ${query}`;
    const escalation = await escalate(http, { reason: 'human_requested', category: categoryFor(topic), sessionId, summary: `The user asked for a person.\nLast topic: ${(lastQuestion || query).slice(0, 200)}` });
    const answer = escalation
      ? `I have passed this to our team (ticket #${escalation.ticketId}, priority ${escalation.priority}). ${escalation.callbackMessage ?? 'Someone will contact you soon.'}`
      : 'I could not reach our team right now. Please write to care@curevan.com or call +91 951 444 6292.';
    await save(answer);
    return { answer, escalation: escalation ?? undefined, sessionId };
  }

  // 3. the model, with the tools that run as this user
  let model;
  try { model = requireModel(); } catch (e) {
    if (e instanceof AiNotConfiguredError) return { answer: 'The assistant is not available right now. Please write to care@curevan.com or call +91 951 444 6292.', sessionId };
    throw e;
  }

  const tools = userId && http ? createTools({ http, userId, userMessage: query }) : null;
  const dynamicTools = tools ? [
    ai.dynamicTool({ name: 'trackOrder', description: "Status, courier status and tracking link of one of the user's own orders (order number like ORD-123).", inputSchema: z.object({ orderId: z.string() }) }, async (i: { orderId: string }) => tools.trackOrder(i)),
    ai.dynamicTool({ name: 'appointmentStatus', description: "The user's own bookings and their status, the start code when it is available, and any recommended next session waiting for the user.", inputSchema: z.object({ appointmentId: z.string().optional() }) }, async (i: { appointmentId?: string }) => tools.appointmentStatus(i)),
    ai.dynamicTool({ name: 'myProgress', description: "A plain-language summary of the user's own active treatment plan: goals and the latest change of the recorded measures. No advice.", inputSchema: z.object({}) }, async () => tools.myProgress()),
    ai.dynamicTool({ name: 'findSpecialty', description: 'Which kind of therapist fits the symptoms the user describes; with lat and lng also nearby approved therapists.', inputSchema: z.object({ symptoms: z.string(), lat: z.number().optional(), lng: z.number().optional() }) }, async (i: { symptoms: string; lat?: number; lng?: number }) => tools.findSpecialty(i)),
    ai.dynamicTool({ name: 'requestReturn', description: "Start a return of one of the user's delivered orders (reason: damaged, not working, wrong item, missing part).", inputSchema: z.object({ orderId: z.string(), reason: z.string() }) }, async (i: { orderId: string; reason: string }) => tools.requestReturn(i)),
    ai.dynamicTool({ name: 'cancelBooking', description: "Cancel one of the user's bookings. Call it first WITHOUT confirm to get the charge; call it with confirm=true only after the user clearly said yes.", inputSchema: z.object({ appointmentId: z.string(), confirm: z.boolean().optional() }) }, async (i: { appointmentId: string; confirm?: boolean }) => tools.cancelBooking(i)),
  ] : [];

  let answer = '';
  try {
    const response = await ai.generate({
      model,
      system: SYSTEM_PROMPT + (tools ? '' : '\nThe user is not signed in: you cannot look anything up for them; ask them to sign in for orders and bookings.'),
      messages: [...history.map((m) => ({ role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model', content: [{ text: m.content.slice(0, 600) }] })), { role: 'user' as const, content: [{ text: query }] }],
      tools: dynamicTools,
      config: { temperature: 0.2 },
    });
    answer = response.text || '';
  } catch (e: any) {
    console.error('Assistant model call failed:', e?.message);
    answer = '';
  }

  let escalation: Escalation | undefined;
  if (tools?.shouldHandOver || !answer) {
    // two failed tool attempts, or no answer from the model: a person takes over
    if (http) escalation = (await escalate(http, { reason: 'tool_failures', category: categoryFor(`${history.map((m) => m.content).join(' ')} ${query}`), sessionId, summary: `The assistant could not help (tool failures: ${tools?.failures ?? 0}).\nUser question: ${query.slice(0, 200)}` })) ?? undefined;
    answer = `${answer ? answer + ' ' : ''}I am not able to sort this out myself, so I have passed it to our team${escalation ? ` (ticket #${escalation.ticketId}). ${escalation.callbackMessage ?? 'Someone will contact you soon.'}` : '. Please write to care@curevan.com or call +91 951 444 6292.'}`;
  }

  await save(answer, tools?.trace);
  return { answer, escalation, sessionId };
}

/** Admin AI page: is a model configured, and does it answer? */
export async function aiHealthCheck(): Promise<{ configured: boolean; model: string; ok: boolean; error?: string }> {
  const model = aiModelId();
  if (!model) return { configured: false, model: '', ok: false, error: 'AI_MODEL_ID is not set.' };
  try {
    const r = await ai.generate({ model: requireModel(), prompt: 'Reply with the single word OK.', config: { temperature: 0, maxOutputTokens: 8 } });
    return { configured: true, model, ok: /ok/i.test(r.text || ''), error: r.text ? undefined : 'The model returned no text.' };
  } catch (e: any) {
    return { configured: true, model, ok: false, error: String(e?.message ?? e).slice(0, 200) };
  }
}
