'use server';

import serverApi from "@/lib/repos/axios.server";
import type { SupportTicket } from '@/lib/types';

/**
 * Fetches support tickets via backend API.
 * @param filters Optional filters like { status: 'open' }
 */
export async function listSupportTickets(filters?: any): Promise<SupportTicket[]> {
  try {
    const { data } = await serverApi.get('/api/support-tickets/list', {
      params: filters,
      headers: { withCredentials: true },
    });
    return data?.tickets ?? [];
  } catch (error: any) {
    console.error("Error fetching support tickets via API:", error?.response || error?.message);
    return [];
  }
}

/**
 * Updates a support ticket via backend API.
 * @param ticketId ID of the ticket to update
 * @param data Partial fields to update
 */
export async function updateSupportTicket(ticketId: string, data: Partial<SupportTicket>): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: response } = await serverApi.post(
      `/api/support-tickets/update/${ticketId}`,
      data,
      { headers: { withCredentials: true } }
    );

    return { success: response?.success ?? false, error: response?.error };
  } catch (error: any) {
    console.error("Error updating support ticket via API:", error?.response || error?.message);
    return { success: false, error: 'Failed to update ticket via API.' };
  }
}