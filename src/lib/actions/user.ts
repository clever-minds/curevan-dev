
import { z } from 'zod';
import serverApi from "@/lib/repos/axios.server";
import { getToken, getCurrentUser } from "@/lib/auth";
import { headers } from 'next/headers';
const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export async function changePassword(
  input: ChangePasswordInput
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return { success: false, error: "User not authenticated." };
  }
  try {
    const validatedData = changePasswordSchema.parse(input);
    console.log("validatedData", validatedData);
    // token get karo (jaha se aap store kar rahe ho)
    const token = await getToken();
    const res = await serverApi.post(
      "/api/auth/change-password",
      validatedData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return { success: true };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: error?.response?.data?.message || "Failed to update password"
    };
  }
}
export async function sendPasswordResetEmail(email: string) {
  try {
    console.log("send email", email);
    const token = await getToken();
    const res = await serverApi.post("/api/auth/forgot-password",
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to process request"
    );
  }
}



export async function resetPassword(data: { token: string; newPassword: string }) {
  try {
    const token = await getToken();
    const res = await serverApi.post("/api/auth/reset-password",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to reset password"
    );
  }
}
