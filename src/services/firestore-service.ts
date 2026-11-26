

import type { UserProfile } from '@/lib/types';
import { listAppointmentsForUser } from '@/lib/repos/appointments';
import { getUserById as repoGetUserById } from '@/lib/repos/users';

/**
 * Fetches a user's profile from the `users` collection.
 */
export async function getUserProfile(token: string): Promise<UserProfile | null> {
    return await repoGetUserById(token);
}

/**
 * Fetches appointments for a specific user based on their role.
 * Implements role-based access control.
 */
export async function getAppointmentsForUser(
  userId: number,
  role: 'patient' | 'therapist'
): Promise<any[]> {
   return await listAppointmentsForUser(userId, role);
}
