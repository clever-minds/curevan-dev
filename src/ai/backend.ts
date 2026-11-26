// Server-side bridge from the AI assistant to the backend API. Every call carries the signed-in user's own token.
import serverApi from '@/lib/repos/axios.server';
import type { Http } from '@/ai/tools';
import type { TicketCategory } from '@/ai/safety';

export function makeHttp(token: string): Http {
  return async (method, path, body) => {
    const { data } = await serverApi.request({ method, url: path, data: body, headers: { Authorization: `Bearer ${token}` } });
    return data;
  };
}

/** The user id inside the JWT. The token is verified by the backend on every call; this only tells the tools which id to ask for. */
export function userIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.id === 'number' ? payload.id : null;
  } catch { return null; }
}

export interface Escalation { ticketId: number; priority: string; category: string; callbackMessage: string | null }

/** Hand the chat over to a person: a ticket with a short summary and a priority; the backend tells the right team. */
export async function escalate(http: Http, args: { reason: 'human_requested' | 'tool_failures' | 'red_flag'; category: TicketCategory; summary: string; sessionId?: number }): Promise<Escalation | null> {
  try {
    const res = await http('POST', '/api/support/escalate', args);
    const d = res?.data;
    return d ? { ticketId: d.ticketId, priority: d.priority, category: d.category, callbackMessage: d.callbackMessage ?? null } : null;
  } catch { return null; }
}
