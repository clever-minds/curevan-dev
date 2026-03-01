
'use server';

import type { Shipment } from '@/lib/types';
import { db } from '@/lib/db';

export async function listShipments(filters?: any): Promise<Shipment[]> {
    const snapshot = await db.collection('shipments').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shipment));
}
