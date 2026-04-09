'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { UserProfile } from '@/lib/types';
import api from '@/lib/api/axios';
import { getToken, logoutAction } from "@/lib/auth";

interface AuthContextType {
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Starting Auth Check...");
      try {
        setIsLoading(true);
        let token = await getToken();
        
        // Client-side fallback for IP addresses/testing
        if (!token && typeof window !== 'undefined') {
          token = localStorage.getItem('token');
          console.log("Token from localStorage:", !!token);
        }

        console.log("Token check:", !!token);

        if (!token) {
          console.log("No token found, user not logged in.");
          setUser(null);
          return;
        }

        const res = await api.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log("Auth profile fetched successfully");
        setUser(res.data || null);
      } catch (error) {
        console.log("CheckAuth error:", error);
        setUser(null);
      } finally {
        console.log("Auth check completed, setting isLoading to false");
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
      
      // ✅ Robustly clear the token cookie via Server Action
      await logoutAction();
      
      // ✅ Comprehensive client-side fallback
      // 1. Clear common localStorage keys
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      
      // 2. Clear cookies aggressively for multiple domains
      const domains = [
          window.location.hostname,
          "." + window.location.hostname,
          window.location.hostname.split('.').slice(-2).join('.') // root domain
      ];
      
      domains.forEach(domain => {
          document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
          document.cookie = `token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
      });
      
      // Standard path=/ clear as well
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ✅ Refresh User manually after profile update
  const refreshUser = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data || null);
    } catch (error) {
      console.log("RefreshUser error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
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