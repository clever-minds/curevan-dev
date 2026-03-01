import api from "./axios";
import type { UserProfile } from '../types';

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
      uid: data.uid,
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
  const res = await fetch("http://localhost:5000/api/auth/me", {
    credentials: "include"
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
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
  const res = await fetch(`${API}/api/auth/login-with-mobile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
     credentials: "include", 
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || 'Login failed');
  }

  return result;
}
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const res = await api.get('/api/auth/me', {
      withCredentials: true,
    });
    return res.data.user;
  } catch (error) {
    return null; // not logged in
  }
}
