'use server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import type { UserProfile } from '@/lib/types'
import { getUserById } from "@/lib/repos/users";
import serverApi from "@/lib/repos/axios.server";
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    // ✅ Remove 'await'
    const cookieStore = await cookies() // synchronous
    const token = cookieStore.get('token')?.value
    console.error('token token:', token)

    if (!token) return null
console.log( " process.env.JWT_SECRET!",process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
    if (!decoded?.id) return null
    console.log('Decoded user profile:', decoded.id)
    const userProfile = await getUserById(decoded.id)
    console.log('Decoded user profile:', userProfile)
    return userProfile || null
  } catch (error) {
    console.error('Invalid or expired token:', error)
    return null
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
