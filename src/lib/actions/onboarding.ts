

'use server';

import { db } from '@/lib/db';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import type { Therapist, UserProfile } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

// This schema must match the one in the form component
const therapistOnboardingSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  bio: z.string().optional(),
  serviceRadiusKm: z.coerce.number(),
  line1: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pin: z.string().min(1),
  mobile: z.string(),
  qualification: z.string().min(1),
  registrationNo: z.string().min(1),
  experienceYears: z.coerce.number(),
  hourlyRate: z.coerce.number(),
  membershipPlan: z.enum(['standard', 'premium']),
  availability: z.any(),
  panNumber: z.string(),
  bankAccountNumber: z.string(),
  bankIfscCode: z.string(),
});

/**
 * Creates a new therapist user, user profile, and therapist profile.
 * This is a single, transactional server action for the onboarding form.
 */
export async function createTherapistAction(data: unknown): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const validatedData = therapistOnboardingSchema.parse(data);

    // 1. Create user in Firebase Authentication
    const auth = getAuth();
    const newUserRecord = await auth.createUser({
      email: validatedData.email,
      password: validatedData.password,
      displayName: validatedData.fullName,
      emailVerified: false, // Set to true if you have an email verification flow
    });
    
    const uid = newUserRecord.uid;
    
    // 2. Create documents in Firestore within a transaction/batch write
    const batch = db.batch();

    // 2a. Create the user profile in 'users' collection
    const userProfile: UserProfile = {
      id: 0,
      uid,
      email: validatedData.email,
      name: validatedData.fullName,
      phone: validatedData.mobile,
      role: 'therapist',
      roles: ['therapist'],
      createdAt: FieldValue.serverTimestamp() as any,
    };
    const userRef = db.collection('users').doc(uid);
    batch.set(userRef, userProfile);
    
    // 2b. Create the therapist profile in 'therapistProfiles' collection
    const therapistProfile: Omit<Therapist, 'rating' | 'reviews'> = {
        id: uid,
        name: validatedData.fullName,
        bio: validatedData.bio || '',
        specialty: validatedData.qualification.split(',')[0], // Use first qualification as specialty
        address: {
            id:0,
            line1: validatedData.line1,
            city: validatedData.city,
            state: validatedData.state,
            pin: validatedData.pin,
            country: 'India',
        },
        position: { lat: 22.3072, lng: 73.1812 }, // Default to Vadodara
        image: 'https://placehold.co/100x100.png', // Placeholder image
        experience: validatedData.experienceYears,
        qualifications: validatedData.qualification.split(',').map(q => q.trim()),
        serviceTypes: ['Physiotherapy'], // Default
        isProfilePublic: false, // Set to false by default, requires admin approval
        hourlyRate: validatedData.hourlyRate,
        membershipPlan: validatedData.membershipPlan,
        availability: validatedData.availability,
        tax: {
            pan: validatedData.panNumber,
            panVerified: false,
        }
    };
    const therapistRef = db.collection('therapistProfiles').doc(uid);
    batch.set(therapistRef, therapistProfile);

    // Commit the batch
    await batch.commit();

    console.log(`Successfully created new therapist with UID: ${uid}`);
    return { success: true, userId: uid };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation failed:', error.errors);
      return { success: false, error: "Validation failed on the server." };
    }
    
    console.error('Error creating therapist:', error);
    // Provide a more user-friendly error message
    const errorMessage = (error as any).code === 'auth/email-already-exists'
      ? 'An account with this email already exists.'
      : 'An unexpected error occurred during registration.';
      
    return { success: false, error: errorMessage };
  }
}
