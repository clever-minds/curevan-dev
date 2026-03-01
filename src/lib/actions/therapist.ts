'use client';

import { z } from 'zod';
import { getCurrentUser } from '@/lib/api/auth';
//import { therapistOnboardingSchema } from '@/app/auth/therapist-signup/therapist-onboarding-form';

import { therapistOnboardingSchema } from '@/app/auth/therapist-signup/therapist-onboarding-form';

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
  experienceYears: z.number(),
  panNumber: z.string(),
  hourlyRate: z.number(),
  membershipPlan: z.string(),
  availability: z.any(),
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  pin: z.string(),
  image: z.any().optional(),
});

/**
 * Creates therapist via Node.js backend API
 */
export async function createTherapistAction(
  data: unknown
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // ✅ Use separate schema instead of .omit()
    const validatedData = createTherapistSchema.parse(data);
      console.log('Create therapist validated data:', validatedData);

    const response = await fetch(`${API_BASE}/api/therapists/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
      cache: 'no-store',
    });
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Failed to create therapist.',
      };
    }

    return {
      success: true,
      userId: result.userId,
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
  data: OnboardingData
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
  const current = await getCurrentUser();

if (!current || current.roles?.[0] !== 'therapist') {
    return { success: false, error: 'Permission denied.' };
  }
    // Update ke liye original schema safe hai
    const validatedData = therapistOnboardingSchema.parse(data);
    console.log("validatedData",validatedData)
    const response = await fetch(
      `${API_BASE}/api/therapists/profile/${current.id}`,
      {
        method: 'Put',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: current.uid,
          ...validatedData,
        }),
        cache: 'no-store',
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Failed to submit update request.',
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
    return { success: false, error: 'Unexpected server error.'+error };
  }
}
