import api from "./axios";
import type { UserProfile } from '../types';
import { getToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL;

// 🔐 LOGIN (Firebase jaisa)
export async function signInWithEmailAndPassword(
  email: string,
  password: string
) {
  console.log();
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    credentials: "include",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
console.log(res);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return {
    user: {
      id: data.id,
      token: data.token
    }
  };
}

export async function getUserProfile(
  token: string
) {
  const res = await fetch(`${API}/api/auth/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Profile fetch failed');
  }

  return data;
}
export const getUserProfiledata = async () => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error("Token missing, please login again");
    }

    const res = await api.get("/api/auth/me", {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;

  } catch (error) {
    throw new Error("Unauthorized");
  }
};

export async function createUserWithEmailAndPassword(
  data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: string;
    roles?: string[];
  }
) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || 'Registration failed');
  }

  return result;
}

export async function loginWithOTP(data: {
  phoneNumber: string;
  otp?: string;
  verifyOtp?: boolean;
}) {
  try {
    const res = await api.post(`/api/auth/login-with-mobile`, data, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.data;

  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Login failed"
    );
  }
}
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('Token missing, please login again');
    }

    const res = await api.get('/api/auth/me', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data.user;

  } catch (error) {
    return null; // not logged in
  }
}