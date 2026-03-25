import serverApi from "@/lib/repos/axios.server";
import type { UserProfile } from "../types";
import { getToken } from '@/lib/auth';



/**
 * Fetch Users List
 */
// export async function listUsers(
//   filters?: { role?: string }
// ): Promise<UserProfile[]> {
//   try {
//     console.log("Fetching users with filters:", filters);
//     // const token = getToken();
//     // if (!token) return null;

//     const { data } = await serverApi.get("/api/users/list", {
//       params: filters,
//       // headers: {
//       //   Authorization: `Bearer ${token}`,
//       // },
//       withCredentials: true,
//     });

//     const usersArray: UserProfile[] = (data.data || []).map((user: any) => ({
//       uid: user.uid,
//       name: user.name || "",
//       email: user.email || "",
//       role: user.role || "",
//       createdAt: user.createdAt || null, // already ISO from backend
//     }));

//     return usersArray;

//   } catch (error: any) {
//     console.error("USERS FETCH ERROR:", error?.message);
//     return null;
//   }
// }
export async function listUsers(
  filters?: { role?: string }
): Promise<UserProfile[]> {  // :white_check_mark: no more | null
  try {
    console.log("Fetching users with filters:", filters);

    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get("/api/users/list", {
      params: filters,
      withCredentials: true,
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    const usersArray: UserProfile[] = (data.data || []).map((user: any) => ({
      id: user.id,
      uid: user.uid,
      name: user.name || "",
      email: user.email || "",
      role_name: user.role || "",
      roles: user.roles || [],
      createdAt: user.createdAt || null,
    }));

    return usersArray;

  } catch (error: any) {
    console.error("USERS FETCH ERROR:", error?.message);
    return []; // :white_check_mark: return empty array instead of null
  }
}



export async function listTeamManagementUsers(
  filters?: { role?: string }
): Promise<UserProfile[]> {  // :white_check_mark: no more | null
  try {
    console.log("Fetching users with filters:", filters);

    const token =await getToken();
     if (!token) {
        throw new Error('Token missing, please login again');
      }
    const { data } = await serverApi.get("/api/users/list-team-management-users", {
      params: filters,
      headers: { 
        Authorization: `Bearer ${token}`,
       },
    });

    const usersArray: UserProfile[] = (data.data || []).map((user: any) => ({
      id: user.id,
      uid: user.uid,
      name: user.name || "",
      email: user.email || "",
      role_name: user.role || "",
      roles: user.roles || [],
      createdAt: user.createdAt || null,
    }));

    return usersArray;

  } catch (error: any) {
    console.error("USERS FETCH ERROR:", error?.message);
    return []; // :white_check_mark: return empty array instead of null
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

    const token = await getToken();
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
      roles: user.roles || [],
      createdAt: user.createdAt || null,
      push_opt_in: user.push_opt_in ?? false,
      email_opt_in: user.email_opt_in ?? false,
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
        // headers: {
        //          Authorization: `Bearer ${token}`,
        //       // },
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
    const token = await getToken();
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



export async function updateUserProfile(data: any): Promise<boolean> {
  console.log("Updating user profile with data:", data);
  try {
    const token = await getToken();
    if (!token) return false;

    await serverApi.put(`/api/auth/update-profile`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return true;

  } catch (error: any) {
    console.error("USER UPDATE ERROR:", error?.message);
    return false;
  }
}
export async function updateChangeRequest(data: any): Promise<boolean> {
  console.log("Updating user profile with data:", data);
  try {
    const token = await getToken();
    if (!token) return false;

    await serverApi.post(`/api/auth/change-profile-request`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return true;

  } catch (error: any) {
    console.error("USER UPDATE ERROR:", error?.message);
    return false;
  }
}