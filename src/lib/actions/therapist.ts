'use client';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/api/auth';
import { therapistOnboardingSchema } from '@/app/auth/therapist-signup/therapist-onboarding-form';
import { getToken } from '../auth';

type OnboardingData = z.infer<typeof therapistOnboardingSchema>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Create Schema (separate from refine schema)
 * This avoids .omit() issue on ZodEffects
 */
const createTherapistSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string(),
  mobile: z.string(),
  bio: z.string().optional(),
  qualification: z.string(),
  experience_years: z.coerce.number(),
  panNumber: z.string(),
  hourlyRate: z.number(),
  membershipPlan: z.string(),
  availability: z.any(),
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  pin: z.string(),
  image: z.any().optional(),
  // Missing fields added:
  registrationNo: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  specialty: z.any().optional(),
  lat: z.any().optional(),
  lng: z.any().optional(),
  fullAddress: z.string().optional(),
});

/**
 * Creates therapist via Node.js backend API
 */
export async function createTherapistAction(
  data: unknown
): Promise<{ success: boolean; error?: string; userId?: string; uid?: string }> {
  try {
    // ✅ Use separate schema instead of .omit()
    const validatedData = createTherapistSchema.parse(data);
    console.log('Create therapist validated data:', validatedData);

    const response = await fetch(`${API_BASE}/api/therapists/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getToken()}`,
      },
      body: JSON.stringify({
        role: 'therapist',
        data: {
          ...validatedData,
          experience: validatedData.experience_years,
          registration_no: (validatedData as any).registrationNo,
          bank_account_number: (validatedData as any).bankAccountNumber,
          bank_ifsc_code: (validatedData as any).bankIfscCode,
          availability: validatedData.availability,
        }
      }),
      cache: 'no-store',
    });
    const result = await response.json();

    if (!response.ok || result.success === false) {
      return {
        success: false,
        error: result.message || result.error || 'Failed to create therapist.',
      };
    }

    return {
      success: true,
      userId: result.userId,
      uid: result.uid || result.userId, // Ensure we get the UID
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed on the server.' };
    }

    console.error('Create therapist error:', error);
    return { success: false, error: 'Unexpected error occurred.' };
  }
}

/**
 * Sends profile update request to Node.js backend
 */
export async function requestProfileUpdate(
  data: OnboardingData,
  explicitUserId?: string
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    let userId = explicitUserId;
    if (!userId) {
      const current = await getCurrentUser();
      if (!current || current.roles?.[0] !== 'therapist') {
        return { success: false, error: 'Permission denied.' };
      }
      userId = current.uid || (current as any).id;
    }

    // Update ke liye original schema safe hai
    const validatedData = therapistOnboardingSchema.parse(data);
    console.log("validatedData", validatedData)
    const response = await fetch(
      // `${API_BASE}/api/therapists/profile/${current.id}`
      `${API_BASE}/api/auth/change-profile-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          section: 'Therapist Profile',
          role: 'therapist',
          data: {
            ...validatedData,
            experience: validatedData.experience_years,
            registration_no: (validatedData as any).registrationNo,
            bank_account_number: (validatedData as any).bankAccountNumber,
            bank_ifsc_code: (validatedData as any).bankIfscCode,
            availability: validatedData.availability,
          }
        }),
        cache: 'no-store',
      }
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {
      return {
        success: false,
        error: result.message || result.error || 'Failed to submit update request.',
      };
    }

    return {
      success: true,
      requestId: result.requestId,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed.' };
    }

    console.error('Profile update error:', error);
    return { success: false, error: 'Unexpected server error.' + error };
  }
}
