import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, tokenStorage } from '@/lib/api';
import type { User } from '@/types';

// ─── Context Types ────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session from stored token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) return;

        const response = await api.get<any>('/auth/me');
        const userData = response?.data?.user ?? (response?.data && typeof response.data === 'object' && '_id' in response.data ? response.data : undefined) ?? response?.user;
        if (userData) {
          setUser(userData);
        } else {
          await tokenStorage.clearTokens();
        }
      } catch {
        // Token invalid or expired — clear silently
        await tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<any>('/auth/login', { email, password }, { skipAuth: true });
    const accessToken = response?.data?.accessToken || response?.accessToken;
    const refreshToken = response?.data?.refreshToken || response?.refreshToken;
    const userData = response?.data?.user || (response?.data && typeof response.data === 'object' && '_id' in response.data ? response.data : undefined) || response?.user;

    if (accessToken) await tokenStorage.setAccessToken(accessToken);
    if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);
    if (userData) setUser(userData);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    const response = await api.post<any>(
      '/auth/register',
      { name, email, password, ...(phone ? { phone } : {}) },
      { skipAuth: true },
    );
    const accessToken = response?.data?.accessToken || response?.accessToken;
    const refreshToken = response?.data?.refreshToken || response?.refreshToken;
    const userData = response?.data?.user || (response?.data && typeof response.data === 'object' && '_id' in response.data ? response.data : undefined) || response?.user;

    if (accessToken) await tokenStorage.setAccessToken(accessToken);
    if (refreshToken) await tokenStorage.setRefreshToken(refreshToken);
    if (userData) setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore logout errors
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
