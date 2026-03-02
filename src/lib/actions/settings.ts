import serverApi from "@/lib/repos/axios.server";
import { z } from "zod";
import { getCurrentUser } from "../auth";
//import { revalidatePath } from "next/cache";

const settingsSchema = z.object({
  payoutDay: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  maxDiscountPercent: z.coerce.number().min(0).max(100),
  premiumServiceFeeRate: z.coerce.number().min(0).max(1),
  timeZone: z.string(),
  currency: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

/**
 * Updates the global platform settings via backend API.
 * Function name unchanged: updatePlatformSettings
 */
export async function updatePlatformSettings(
  settingsData: SettingsFormValues
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes("admin.super")) {
    return { success: false, error: "Permission denied." };
  }

  try {
    // Validate input
    const validatedData = settingsSchema.parse(settingsData);

    // Call backend API to update settings
    const { data: response } = await serverApi.post(
      "/api/platform-settings/update",
      {
        settings: validatedData,
        actorId: user.uid, // pass current user for audit logging
      },
      {
        headers: { withCredentials: true }, // maintain session/cookie
      }
    );

    if (response?.success) {
      console.log("Platform settings updated successfully via API.");
      // Revalidate paths that use these settings
     // revalidatePath("/dashboard/admin/settings");
      return { success: true };
    } else {
      return { success: false, error: response?.error || "Failed to update platform settings." };
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed. Please check the data format." };
    }
    console.error("Error updating platform settings via API:", error?.response || error?.message);
    return { success: false, error: "An unexpected server error occurred." };
  }
}