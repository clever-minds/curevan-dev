import serverApi from "@/lib/repos/axios.server";
import { z } from "zod";
import { getCurrentUser } from "../auth";

const inviteAdminSchema = z.object({
  email: z.string().email(),
  roles: z.array(z.string()).min(1),
});

const updateRolesSchema = z.object({
  uid: z.string().min(1),
  roles: z.array(z.string()),
});

/**
 * Invites a new admin user via backend API.
 * Function name unchanged: inviteAdminUser
 */
export async function inviteAdminUser(
  email: string,
  roles: string[]
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.roles?.includes("admin.super")) {
    return { success: false, error: "Permission denied." };
  }

  try {
    const validated = inviteAdminSchema.parse({ email, roles });

    const { data: response } = await serverApi.post(
      "/api/admin/invite",
      {
        email: validated.email,
        roles: validated.roles,
        actorId: currentUser.uid, // For audit logging
      },
      {
        headers: { withCredentials: true },
      }
    );

    if (response?.success) {
      console.log("Admin user invited successfully via API:", validated.email);
      return { success: true };
    } else {
      return { success: false, error: response?.error || "Failed to invite admin user." };
    }
  } catch (error: any) {
    console.error("Error inviting admin user via API:", error?.response || error?.message);
    return { success: false, error: error?.message || "An unexpected error occurred." };
  }
}

/**
 * Updates a user's roles via backend API.
 * Function name unchanged: updateUserRoles
 */
export async function updateUserRoles(
  uid: string,
  roles: string[]
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.roles?.includes("admin.super")) {
    return { success: false, error: "Permission denied." };
  }

  try {
    const validated = updateRolesSchema.parse({ uid, roles });

    const { data: response } = await serverApi.post(
      "/api/admin/update-roles",
      {
        uid: validated.uid,
        roles: validated.roles,
        actorId: currentUser.uid, // For audit logging
      },
      {
        headers: { withCredentials: true },
      }
    );

    if (response?.success) {
      console.log(`Roles updated successfully for UID ${uid} via API.`);
      return { success: true };
    } else {
      return { success: false, error: response?.error || "Failed to update user roles." };
    }
  } catch (error: any) {
    console.error(`Error updating roles for UID ${uid} via API:`, error?.response || error?.message);
    return { success: false, error: error?.message || "An unexpected error occurred." };
  }
}