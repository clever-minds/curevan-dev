
'use server';

import { db } from '@/lib/db';
import type { Notification } from '../types';
import { getCurrentUser } from '../auth';

export async function listNotifications(): Promise<Notification[]> {
    const user = await getCurrentUser();
    if (!user) {
        console.warn("Attempted to list notifications without a logged-in user.");
        return [];
    }

    const snapshot = await db.collection('notifications')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();
        
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to ISO string if necessary
            createdAt: data.createdAt.toDate().toISOString(),
        } as Notification;
    });
}
