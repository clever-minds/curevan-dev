'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import api from '@/lib/api/axios';
import { getToken } from "@/lib/auth";

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

  // ✅ Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();

        if (!token) {
          throw new Error('Token missing, please login again');
        }
        const res = await api.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // /api/me returns user directly
        setUser(res.data || null);
      } catch (error) {
        console.log("CheckAuth error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ Login: simply set the user passed from SigninForm
  const login = (userData: UserProfile) => {
    setUser(userData);
  };

  // ✅ Logout
  const logout = async () => {
    try {
      const token = await getToken();
      await api.post("/api/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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