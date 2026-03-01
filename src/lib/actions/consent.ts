
'use server';

import { db } from '@/lib/db';
import { getAuth } from 'firebase-admin/auth';
import type { ConsentLog } from '../types';
import { FieldValue } from 'firebase-admin/firestore';
import { getCurrentUser } from '@/lib/auth';

interface LogConsentArgs {
  consentType: 'terms' | 'privacy' | 'medical' | 'marketing';
  version: string;
}

export async function logConsent(args: LogConsentArgs): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentUser();

  if (!session?.uid) {
    return { success: false, error: 'User not authenticated.' };
  }

  const { consentType, version } = args;
  const userId = session.uid;

  try {
    const consentLogRef = db.collection('consentLogs').doc();

    const newLog: Omit<ConsentLog, 'id'> = {
      userId,
      consentType,
      version,
      status: 'granted',
      createdAt: FieldValue.serverTimestamp() as any,
      ipAddress: 'N/A', // IP address should be captured from the request if needed
      userAgent: 'N/A', // User agent should be captured from request headers if needed
    };

    await consentLogRef.set({ ...newLog, id: consentLogRef.id });

    return { success: true };

  } catch (error) {
    console.error('Error logging consent:', error);
    // In a real app, you might want more sophisticated error handling
    return { success: false, error: 'A server error occurred while saving consent.' };
  }
}
