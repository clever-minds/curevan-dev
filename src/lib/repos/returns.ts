
'use server';

import type { Return } from '@/lib/types';
import { db } from '@/lib/db';

export async function listReturns(filters?: any): Promise<Return[]> {
    const snapshot = await db.collection('returns').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Return));
}
