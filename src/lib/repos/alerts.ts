
'use server';

import { db } from '@/lib/db';
import type { SOSAlert } from '../types';
import { getSafeDate } from '../utils';
import { addAuditLog } from './logs';
import { getCurrentUser } from '../auth';
import { FieldValue } from 'firebase-admin/firestore';

export async function listSosAlerts(): Promise<SOSAlert[]> {
    const snapshot = await db.collection('sosAlerts').orderBy('timestamp', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: getSafeDate(data.timestamp)?.toISOString() || new Date().toISOString(),
            resolvedAt: getSafeDate(data.resolvedAt)?.toISOString(),
        } as SOSAlert;
    });
}

export async function resolveSosAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser();
    if (!user || (!user.roles?.includes('admin.super') && !user.roles?.includes('admin.therapy'))) {
        return { success: false, error: 'Permission denied.' };
    }

    const alertRef = db.collection('sosAlerts').doc(alertId);
    try {
        await alertRef.update({
            status: 'resolved',
            resolvedAt: FieldValue.serverTimestamp(),
            resolvedBy: user.uid,
        });

        await addAuditLog({
            actorId: user.uid,
            action: 'sos.alert.resolved',
            entityType: 'sosAlert',
            entityId: alertId,
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to resolve SOS alert:", error);
        return { success: false, error: 'Failed to update alert status in the database.' };
    }
}
