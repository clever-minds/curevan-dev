
'use server';

import { db } from '@/lib/db';
import type { AuditLog } from '../types';

export async function addAuditLog(log: Omit<AuditLog, 'id'>) {
    const auditLogsCol = db.collection('auditLogs');
    const docRef = await auditLogsCol.add(log);
    return { ...log, id: docRef.id };
}
