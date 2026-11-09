import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { getToken, setToken } from '../api/client';
import { loginApi, getMeApi, changePasswordApi } from '../api/authApi';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check stored JWT session on startup
  const initAuth = useCallback(async () => {
    try {
      const storedToken = await getToken();
      if (storedToken) {
        setAuthToken(storedToken);
        const meRes = await getMeApi();
        if (meRes.success && meRes.user) {
          setUser(meRes.user);
        } else {
          await setToken(null);
          setAuthToken(null);
          setUser(null);
        }
      }
    } catch {
      await setToken(null);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi(identifier, password);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await setToken(null);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await changePasswordApi(currentPassword, newPassword);
  };

  const refreshUser = async () => {
    try {
      const res = await getMeApi();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  const isOwner = user?.role === 'owner';
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isOwner,
        login,
        logout,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
