
'use server';

import { db } from '@/lib/db';
import type { PayoutItem, PayoutBatch } from '../types';
import { getSafeDate } from '../utils';

export async function addPayoutItem(item: Omit<PayoutItem, 'id'>): Promise<PayoutItem> {
    const payoutItemsCol = db.collection('payoutItems');
    const docRef = await payoutItemsCol.add(item);
    return { ...item, id: docRef.id } as PayoutItem;
}

export async function getPayoutItemBySourceId(sourceId: string): Promise<PayoutItem | null> {
    const snapshot = await db.collection('payoutItems').where("sourceId", "==", sourceId).limit(1).get();
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    const data = doc.data()
    return { 
        id: doc.id, 
        ...data,
        createdAt: getSafeDate(data.createdAt)?.toISOString() || '',
        weekStart: getSafeDate(data.weekStart)?.toISOString() || '',
    } as PayoutItem;
}

export async function listPayoutItems(filters?: any): Promise<PayoutItem[]> {
    let query: FirebaseFirestore.Query = db.collection('payoutItems');
    if (filters?.therapistId) {
        query = query.where('therapistId', '==', filters.therapistId);
    }
    if (filters?.payoutStatus) { // Filter by payout item state
        query = query.where('state', '==', filters.payoutStatus);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            createdAt: getSafeDate(data.createdAt)?.toISOString() || '',
            weekStart: getSafeDate(data.weekStart)?.toISOString() || '',
        } as PayoutItem
    });
}

export async function listPayoutBatches(filters?: any): Promise<PayoutBatch[]> {
    let query: FirebaseFirestore.Query = db.collection('payoutBatches');

    if (filters?.therapistId) {
        query = query.where('therapistId', '==', filters.therapistId);
    }
    
    if (filters?.payoutStatus) {
        query = query.where('status', '==', filters.payoutStatus);
    }
    
    // Note: Firestore requires an index for inequality filters on different fields.
    // This part of the query might need a composite index in production.
    if (filters?.dateRange?.from) {
        query = query.where('payoutDate', '>=', filters.dateRange.from);
    }
    if (filters?.dateRange?.to) {
        query = query.where('payoutDate', '<=', filters.dateRange.to);
    }
    
    const snapshot = await query.orderBy('payoutDate', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            payoutDate: getSafeDate(data.payoutDate)?.toISOString() || '',
            weekStart: getSafeDate(data.weekStart)?.toISOString() || '',
            weekEnd: getSafeDate(data.weekEnd)?.toISOString() || '',
        } as PayoutBatch;
    });
}
