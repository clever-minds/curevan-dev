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
  formData: FormData
): Promise<{ success: boolean; error?: string; userId?: string; uid?: string }> {
  try {
    const dataString = formData.get('data') as string;
    if (!dataString) throw new Error('Missing JSON payload');
    
    const parsedData = JSON.parse(dataString);
    const validatedData = createTherapistSchema.parse(parsedData);
    console.log('Create therapist validated data:', validatedData);

    const payloadFormData = new FormData();
    payloadFormData.append('role', 'therapist');
    payloadFormData.append('data', JSON.stringify({
      ...validatedData,
      experience: validatedData.experience_years,
      registration_no: (validatedData as any).registrationNo,
      bank_account_number: (validatedData as any).bankAccountNumber,
      bank_ifsc_code: (validatedData as any).bankIfscCode,
      availability: validatedData.availability,
    }));

    // Forward the files
    if (formData.get('image')) payloadFormData.append('image', formData.get('image')!);
    if (formData.get('kycIdProof')) payloadFormData.append('kycIdProof', formData.get('kycIdProof')!);
    if (formData.get('kycLicense')) payloadFormData.append('kycLicense', formData.get('kycLicense')!);
    if (formData.get('kycBankProof')) payloadFormData.append('kycBankProof', formData.get('kycBankProof')!);

    const response = await fetch(`${API_BASE}/api/therapists/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
      body: payloadFormData,
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
  formData: FormData,
  explicitUserId?: string
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  try {
    const dataString = formData.get('data') as string;
    if (!dataString) throw new Error('Missing JSON payload');
    
    const parsedData = JSON.parse(dataString);
    let userId = explicitUserId || formData.get('uid') as string;
    
    if (!userId) {
      const current = await getCurrentUser();
      if (!current || current.roles?.[0] !== 'therapist') {
        return { success: false, error: 'Permission denied.' };
      }
      userId = current.uid || (current as any).id;
    }

    // Update ke liye original schema safe hai
    const validatedData = therapistOnboardingSchema.parse(parsedData);
    console.log("validatedData", validatedData)

    const payloadFormData = new FormData();
    payloadFormData.append('userId', userId);
    payloadFormData.append('section', 'Therapist Profile');
    payloadFormData.append('role', 'therapist');
    payloadFormData.append('data', JSON.stringify({
      ...validatedData,
      experience: validatedData.experience_years,
      registration_no: (validatedData as any).registrationNo,
      bank_account_number: (validatedData as any).bankAccountNumber,
      bank_ifsc_code: (validatedData as any).bankIfscCode,
      availability: validatedData.availability,
    }));

    // Forward the files
    if (formData.get('image')) payloadFormData.append('image', formData.get('image')!);
    if (formData.get('kycIdProof')) payloadFormData.append('kycIdProof', formData.get('kycIdProof')!);
    if (formData.get('kycLicense')) payloadFormData.append('kycLicense', formData.get('kycLicense')!);
    if (formData.get('kycBankProof')) payloadFormData.append('kycBankProof', formData.get('kycBankProof')!);

    const response = await fetch(
      `${API_BASE}/api/auth/change-profile-request`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
        credentials: 'include',
        body: payloadFormData,
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
