// src/lib/server/auth.ts
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import type { UserProfile } from '@/lib/types'
import { getUserById } from './repos/users'

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieStore = await cookies() 
    const token = cookieStore.get('token')?.value

    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }

    if (!decoded?.id) return null

    const userProfile = await getUserById(decoded.id)
    return userProfile || null
  } catch (error) {
    console.error('Invalid or expired token:', error)
    return null
  }
}