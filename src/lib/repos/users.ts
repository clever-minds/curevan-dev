import serverApi from "@/lib/repos/axios.server";
import type { UserProfile } from "../types";
import { getToken } from "@/lib/auth";

/**
 * Fetch Users List
 */
// export async function listUsers(
//   filters?: { role?: string }
// ): Promise<UserProfile[]> {
//   try {
//     console.log("Fetching users with filters:", filters);
//     // const token = getToken();
//     // if (!token) return null;

//     const { data } = await serverApi.get("/api/users/list", {
//       params: filters,
//       // headers: {
//       //   Authorization: `Bearer ${token}`,
//       // },
//       withCredentials: true,
//     });

//     const usersArray: UserProfile[] = (data.data || []).map((user: any) => ({
//       uid: user.uid,
//       name: user.name || "",
//       email: user.email || "",
//       role: user.role || "",
//       createdAt: user.createdAt || null, // already ISO from backend
//     }));

//     return usersArray;

//   } catch (error: any) {
//     console.error("USERS FETCH ERROR:", error?.message);
//     return null;
//   }
// }
export async function listUsers(
  filters?: { role?: string }
): Promise<UserProfile[]> {  // ✅ no more | null
  try {
    console.log("Fetching users with filters:", filters);

    const { data } = await serverApi.get("/api/users/list", {
      params: filters,
      withCredentials: true,
    });

    const usersArray: UserProfile[] = (data.data || []).map((user: any) => ({
      id: user.id,
      uid: user.uid,
      name: user.name || "",
      email: user.email || "",
      role_name: user.role || "",
      roles: user.roles || [] ,
      createdAt: user.createdAt || null,
    }));

    return usersArray;

  } catch (error: any) {
    console.error("USERS FETCH ERROR:", error?.message);
    return []; // ✅ return empty array instead of null
  }
}

/**
 * Fetch Single User
 */
export async function getUserById(
  id: string
): Promise<UserProfile | null> {
  try {
    if (!id) return null;

    const token = getToken();
    if (!token) return null;

    const { data } = await serverApi.get(`/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = data.data;
    if (!user) return null;

    return {
      id: user.id,
      uid: user.uid,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      createdAt: user.createdAt || null,
    };

  } catch (error: any) {
    console.error("USER FETCH ERROR:", error?.message);
    return null;
  }
}

/**
 * Create or Update User
 */
export async function saveUserProfile(
  payload: Omit<UserProfile, "createdAt">
): Promise<UserProfile | null> {
  try {
    const token = getToken();
    if (!token) return null;

    const { data } = await serverApi.post(
      "/api/users/save",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data.data || null;

  } catch (error: any) {
    console.error("USER SAVE ERROR:", error?.message);
    return null;
  }
}

/**
 * Delete User
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const token = getToken();
    if (!token) return false;

    await serverApi.delete(`/api/users/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return true;

  } catch (error: any) {
    console.error("USER DELETE ERROR:", error?.message);
    return false;
  }
}
