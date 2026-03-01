

import type { UserProfile } from '@/lib/types';
import { listAppointmentsForUser } from '@/lib/repos/appointments';
import { getUserById as repoGetUserById, addUserProfile } from '@/lib/repos/users';

/**
 * Creates a new user profile document in the `users` collection.
 * This is typically called after a user signs up via Firebase Authentication.
 */
export async function createUserProfile(profileData: Omit<UserProfile, 'createdAt'>) {
    console.log(`[SERVICE] Creating user profile for uid: ${profileData.uid}`);
    await addUserProfile(profileData);
    return;
}

/**
 * Fetches a user's profile from the `users` collection.
 */
export async function getUserProfile(uid: number): Promise<UserProfile | null> {
    return await repoGetUserById(uid);
}

/**
 * Fetches appointments for a specific user based on their role.
 * Implements role-based access control.
 */
export async function getAppointmentsForUser(
  userId: string,
  role: 'patient' | 'therapist'
): Promise<any[]> {
   return await listAppointmentsForUser(userId, role);
}
