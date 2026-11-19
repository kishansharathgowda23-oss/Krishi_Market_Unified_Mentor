import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../services/api';
import type { AuthUser, Customer, Farmer } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  profile: Farmer | Customer | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  registerCustomer: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredDistrict?: string;
  }) => Promise<AuthUser>;
  registerFarmer: (payload: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    farmName: string;
    farmLocation: string;
    district: string;
    state: string;
    cropTypes: string;
    farmingMethod: string;
    farmDescription: string;
    profileImage?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  setProfile: React.Dispatch<React.SetStateAction<Farmer | Customer | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Farmer | Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(getStoredToken()));

  const refreshAuth = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
      setProfile(res.profile);
    } catch {
      setStoredToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
    return res.user;
  }, []);

  const registerCustomer = useCallback(
    async (payload: Parameters<typeof api.registerCustomer>[0]) => {
      const res = await api.registerCustomer(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res.user;
    },
    []
  );

  const registerFarmer = useCallback(
    async (payload: Parameters<typeof api.registerFarmer>[0]) => {
      const res = await api.registerFarmer(payload);
      setStoredToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshAuth,
        login,
        registerCustomer,
        registerFarmer,
        logout,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
