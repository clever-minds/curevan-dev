

'use server';

import type { SupportTicket } from '@/lib/types';
import { db } from '@/lib/db';
import { getSafeDate } from '../utils';
import { FieldValue } from 'firebase-admin/firestore';

export async function listSupportTickets(filters?: any): Promise<SupportTicket[]> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('supportTickets');

    if (filters?.status) {
        query = query.where('status', '==', filters.status);
    }
    
    // Sort on the server if no filter is applied
    if (!filters || Object.keys(filters).length === 0) {
        query = query.orderBy('updatedAt', 'desc');
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
        return [];
    }
    
    const tickets = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: getSafeDate(data.createdAt)?.toISOString() || new Date().toISOString(),
            updatedAt: getSafeDate(data.updatedAt)?.toISOString() || new Date().toISOString(),
        } as SupportTicket;
    });

    // If a filter was applied, we sort here because Firestore requires an index for composite queries.
    if (filters && Object.keys(filters).length > 0) {
        tickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return tickets;
}

export async function updateSupportTicket(ticketId: string, data: Partial<SupportTicket>): Promise<{ success: boolean; error?: string }> {
    try {
        const ticketRef = db.collection('supportTickets').doc(ticketId);
        await ticketRef.update({
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating support ticket:", error);
        return { success: false, error: 'Failed to update ticket in database.' };
    }
}
