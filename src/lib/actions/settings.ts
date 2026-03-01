
'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { getCurrentUser } from '../auth';
import { revalidatePath } from 'next/cache';
import { addAuditLog } from '../repos/logs';

const settingsSchema = z.object({
  payoutDay: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
  maxDiscountPercent: z.coerce.number().min(0).max(100),
  premiumServiceFeeRate: z.coerce.number().min(0).max(1),
  timeZone: z.string(),
  currency: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

/**
 * Updates the global platform settings document in Firestore.
 * This is a protected action, only callable by Super Admins.
 * @param settingsData - The new settings data from the form.
 */
export async function updatePlatformSettings(settingsData: SettingsFormValues): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('admin.super')) {
    return { success: false, error: 'Permission denied.' };
  }

  try {
    const validatedData = settingsSchema.parse(settingsData);
    
    // The settings are stored in a single document for easy retrieval
    const settingsRef = db.collection('platformSettings').doc('globalConfig');
    
    await settingsRef.set(validatedData, { merge: true });

    await addAuditLog({
        actorId: user.uid,
        action: 'platform.settings.updated',
        entityType: 'platformSettings',
        entityId: 'globalConfig',
        details: validatedData,
    })

    console.log('Platform settings updated successfully.');

    // Revalidate the path to ensure any components using these settings get the new data
    revalidatePath('/dashboard/admin/settings');

    return { success: true };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed. Please check the data format." };
    }
    console.error('Error updating platform settings:', error);
    return { success: false, error: 'An unexpected server error occurred.' };
  }
}
