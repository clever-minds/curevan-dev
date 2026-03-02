import serverApi from "@/lib/repos/axios.server";
import { z } from "zod";
import type { Therapist, UserProfile } from "../types";

// Validation schema (same as original)
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
  membershipPlan: z.enum(["standard", "premium"]),
  availability: z.any(),
  panNumber: z.string(),
  bankAccountNumber: z.string(),
  bankIfscCode: z.string(),
});

export async function createTherapistAction(
  data: unknown
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // 1️⃣ Validate input
    const validatedData = therapistOnboardingSchema.parse(data);

    // 2️⃣ Call backend API
    const { data: response } = await serverApi.post(
      "/api/therapist/create",
      validatedData,
      {
        headers: {
          withCredentials: true, // keep session/cookies like cart/consent
        },
      }
    );

    // 3️⃣ Return API result
    if (response?.success) {
      return { success: true, userId: response.userId };
    } else {
      return { success: false, error: response?.error || "Failed to create therapist" };
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("Validation failed:", error.errors);
      return { success: false, error: "Validation failed on the server." };
    }

    console.error("Error creating therapist via API:", error?.response || error?.message);
    return { success: false, error: "Something went wrong while creating therapist." };
  }
}
