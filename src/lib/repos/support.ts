// 'use server';

import serverApi from "@/lib/repos/axios.server";
import type { SupportTicket, ApiResponse } from '@/lib/types';
import { getToken } from "../auth";

/**
 * Creates a new support ticket.
 * @param data Ticket data { topic, subject, message, bookingId, orderId, priority }
 */
export async function createSupportTicket(data: {
  topic: string;
  subject: string;
  message: string;
  bookingId?: string;
  orderId?: string;
  priority?: string;
}): Promise<ApiResponse<{ id: number; number: string }>> {
  const token = await getToken();
  try {
    const { data: response } = await serverApi.post('/api/support/tickets', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error: any) {
    console.error("Error creating support ticket via API:", error?.response?.data || error?.message);
    return { success: false, message: error?.response?.data?.message || 'Failed to create support ticket.' };
  }
}

/**
 * Fetches support tickets via backend API.
 * @param filters Optional filters like { status: 'open' }
 */
export async function listSupportTickets(filters?: any): Promise<SupportTicket[]> {
  const token = await getToken();
  try {
    const params: any = {};
    if (filters) {
      if (filters.supportStatus) params.status = filters.supportStatus;
      if (filters.supportTopic) params.topic = filters.supportTopic;
      if (filters.search) params.search = filters.search;

      if (filters.dateRange?.from) params.startDate = filters.dateRange.from.toISOString();
      if (filters.dateRange?.to) params.endDate = filters.dateRange.to.toISOString();

      // Fallback for direct params
      if (!params.status && filters.status) params.status = filters.status;
      if (!params.topic && filters.topic) params.topic = filters.topic;
    }

    console.log("Fetching support tickets with params:", JSON.stringify(params, null, 2));

    const { data } = await serverApi.get('/api/support/tickets', {
      params,
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Raw support tickets API response (keys):", Object.keys(data || {}));
    if (data?.data) console.log("data.data length:", Array.isArray(data.data) ? data.data.length : 'not an array');
    if (data?.tickets) console.log("data.tickets length:", Array.isArray(data.tickets) ? data.tickets.length : 'not an array');

    // Flexible response mapping: check for common wrappers or raw array
    const ticketsData = data?.data || data?.tickets || (Array.isArray(data) ? data : []);
    console.log("Final ticketsData determined:", ticketsData.length, "items");

    return ticketsData.map((t: any) => ({
      ...t,
      id: t.id?.toString() || Math.random().toString(),
      userId: t.user_id?.toString() || t.userId?.toString() || '',
      createdAt: t.created_at || t.createdAt,
      updatedAt: t.updated_at || t.updatedAt,
      bookingId: t.booking_id || t.item_id || t.bookingId,
      orderId: t.order_id || t.orderId,
      message: t.message || t.description || t.support_description || t.text,
    }));
  } catch (error: any) {
    console.error("Error fetching support tickets via API:", error?.response?.data || error?.message);
    return [];
  }
}

/**
 * Fetches a single support ticket by ID or Number.
 * @param id Ticket ID or Number
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
  const token = await getToken();
  try {
    const { data } = await serverApi.get(`/api/support/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = data?.data;
    if (result && result.ticket) {
      const t = result.ticket;
      const rawMessages = result.messages || result.replies || t.messages || [];

      return {
        ...t,
        id: t.id?.toString() || ticketId,
        userId: t.user_id?.toString() || t.userId?.toString() || '',
        createdAt: t.created_at || t.createdAt,
        updatedAt: t.updated_at || t.updatedAt,
        bookingId: t.booking_id || t.item_id || t.bookingId,
        orderId: t.order_id || t.orderId,
        message: t.message || t.description || t.support_description || t.text,
        messages: Array.isArray(rawMessages) ? rawMessages.map((m: any) => {
          const senderBy = String(m.sender_id || m.userId || m.by) === String(t.user_id || t.userId) ? 'user' : 'admin';
          return {
            by: senderBy,
            at: m.created_at || m.at || m.updatedAt || m.timestamp,
            text: m.message || m.text || m.description || m.content
          };
        }) : []
      };
    }
    return result ?? null;
  } catch (error: any) {
    console.error("Error fetching support ticket via API:", error?.response?.data || error?.message);
    return null;
  }
}

/**
 * Replies to a support ticket.
 * @param data { ticketId, message }
 */
export async function replyToSupportTicket(data: { ticketId: number; message: string; sender_type: string }): Promise<ApiResponse> {
  const token = await getToken();
  try {
    const { data: response } = await serverApi.post('/api/support/tickets/reply', {
      ticket_id: data.ticketId,
      message: data.message,
      sender_type: data.sender_type
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error: any) {
    console.error("Error replying to support ticket via API:", error?.response?.data || error?.message);
    return { success: false, message: error?.response?.data?.message || 'Failed to send reply.' };
  }
}

/**
 * Closes a support ticket.
 * @param ticketId Ticket ID
 */
export async function closeSupportTicket(ticketId: number): Promise<ApiResponse> {
  const token = await getToken();
  try {
    const { data: response } = await serverApi.post(`/api/support/tickets/${ticketId}/close`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error: any) {
    console.error("Error closing support ticket via API:", error?.response?.data || error?.message);
    return { success: false, message: error?.response?.data?.message || 'Failed to close ticket.' };
  }
}

/**
 * Submits a contact us form to the public endpoint.
 * @param data { name, email, subject, message }
 */
export async function submitContactUs(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ApiResponse> {
  try {
    const { data: response } = await serverApi.post('/api/support/contact-us', data);
    return response;
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || 'Failed to send message.';
    const status = error?.response?.status ? ` (Status: ${error.response.status})` : '';
    console.error("Error submitting contact-us via API:", error?.response?.data || error?.message);
    return { success: false, message: `${errorMsg}${status}` };
  }
}