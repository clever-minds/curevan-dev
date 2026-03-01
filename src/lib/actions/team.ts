
'use server';

import { db } from '@/lib/db';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { getCurrentUser } from '../auth';
import { addAuditLog } from '../repos/logs';

const inviteAdminSchema = z.object({
  email: z.string().email(),
  roles: z.array(z.string()).min(1),
});

const updateRolesSchema = z.object({
  uid: z.string().min(1),
  roles: z.array(z.string()),
});

/**
 * Creates a new user with a temporary password and sets their custom claims and Firestore roles.
 * @param email The email of the new admin user.
 * @param roles The roles to assign to the new user.
 */
export async function inviteAdminUser(email: string, roles: string[]): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.roles?.includes('admin.super')) {
    return { success: false, error: 'Permission denied.' };
  }

  try {
    const validated = inviteAdminSchema.parse({ email, roles });

    const auth = getAuth();
    
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(validatedData.email);
      if (existingUser) {
        return { success: false, error: 'A user with this email already exists.' };
      }
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw unexpected errors
        }
        // If user not found, we can proceed.
    }

    // Create a new user
    const newUserRecord = await auth.createUser({
      email: validatedData.email,
      // A strong, random password should be generated and sent via a secure channel or a password reset link.
      password: `temp-${Math.random().toString(36).slice(-8)}`,
      displayName: `New Admin (${validatedData.email.split('@')[0]})`,
      emailVerified: false, 
    });

    const uid = newUserRecord.uid;

    // Set custom claims for backend security rule enforcement
    await auth.setCustomUserClaims(uid, { roles: validatedData.roles });

    // Create the user profile in Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      uid,
      email: validatedData.email,
      name: `New Admin (${validatedData.email.split('@')[0]})`,
      role: 'admin',
      roles: validatedData.roles,
      createdAt: new Date().toISOString(),
    });

    await addAuditLog({
      actorId: currentUser.uid,
      action: 'admin.invited',
      entityType: 'user',
      entityId: uid,
      details: { invitedEmail: validatedData.email, assignedRoles: validatedData.roles },
    });

    // TODO: Implement sending a "welcome" or "set your password" email.
    
    return { success: true };
  } catch (error: any) {
    console.error('Error inviting admin user:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}

/**
 * Updates a user's roles in both Firebase Auth (custom claims) and Firestore.
 * @param uid The UID of the user to update.
 * @param roles The new array of roles.
 */
export async function updateUserRoles(uid: string, roles: string[]): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.roles?.includes('admin.super')) {
    return { success: false, error: 'Permission denied.' };
  }

  try {
    const validated = updateRolesSchema.parse({ uid, roles });
    const auth = getAuth();
    
    // Update custom claims
    await auth.setCustomUserClaims(validated.uid, { roles: validated.roles });

    // Update Firestore document
    const userRef = db.collection('users').doc(validated.uid);
    await userRef.update({ roles: validated.roles });

    await addAuditLog({
      actorId: currentUser.uid,
      action: 'user.roles.updated',
      entityType: 'user',
      entityId: validated.uid,
      details: { newRoles: validated.roles },
    });

    return { success: true };
  } catch (error: any) {
    console.error(`Error updating roles for UID ${uid}:`, error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
