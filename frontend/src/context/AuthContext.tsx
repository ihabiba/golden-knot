import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { login as apiLogin } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken() {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredToken);

  const login = async (email: string, password: string, rememberMe = true) => {
    const { data } = await apiLogin(email, password);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', data.access);
    storage.setItem('refresh_token', data.refresh);
    setAccessToken(data.access);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, logout, isAuthenticated: !!accessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
