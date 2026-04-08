'use server'
import { cookies } from 'next/headers'
import type { UserProfile } from '@/lib/types'
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('No auth token found in cookies');
      return null;
    }

    // Call the backend /me endpoint directly with the token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always get fresh data
    });

    if (!response.ok) {
      console.error('Failed to fetch user from backend:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.success === false || !data.data) {
      console.error('Backend returned success:false or missing data:', data);
      return null;
    }

    const user = data.data;
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
    } as UserProfile;

  } catch (error) {
    console.error('Error in getCurrentUser server action:', error);
    return null;
  }
}



export async function getToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()      // Next.js server-side cookies
    const token = cookieStore.get('token')?.value
    console.log('Fetching token:', token)

    return token || null
  } catch (error) {
    console.error('Error fetching token:', error)
    return null
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
  } catch (error) {
    console.error('Error in logoutAction:', error);
  }
}
