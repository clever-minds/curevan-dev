
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import { setCookie, deleteCookie } from 'cookies-next';
import api from '@/lib/api/axios';
import { getToken } from '@/lib/auth';

interface AuthContextType {
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const checkAuth = async () => {
          console.log("CheckAuth started 2"); // ✅ ye print ho raha hai ya nahi

    try {
      // 1️⃣ Instant UI load
        setIsLoading(true);
      // 2️⃣ Backend verification
      const res = await api.get('/api/auth/me', {
        withCredentials: true,
      });
      console.log("Auth check response:", res.data);

      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.log("CheckAuth started error",error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  checkAuth();
}, []);


  const login = async (userData: UserProfile) => {
          console.log("CheckAuth started 1"); // ✅ ye print ho raha hai ya nahi

  const res = await api.get('/api/auth/me', {
    withCredentials: true
  });
        console.log("Auth check response:", res.data);

    setUser(res.data);
  };

   const logout = async () => {
    await api.post("/api/auth/logout", {}, {
      withCredentials: true
    });
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
