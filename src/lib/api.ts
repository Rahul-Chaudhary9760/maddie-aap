import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Config ───────────────────────────────────────────────────────────────────
// EXPO_PUBLIC_API_URL takes precedence (from .env).
// Defaults to deployed backend on Render (https://maddie-sv65.onrender.com/api/v1) for seamless testing on physical devices, simulators, and web.
const DEFAULT_API_URL = 'https://maddie-sv65.onrender.com/api/v1';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

const ACCESS_TOKEN_KEY = 'maddie_access_token';
const REFRESH_TOKEN_KEY = 'maddie_refresh_token';

// ─── Token Storage ───────────────────────────────────────────────────────────
// Web fallback: localStorage (expo-secure-store not available on web)
export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(ACCESS_TOKEN_KEY);
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(ACCESS_TOKEN_KEY, token); return; }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },
  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(REFRESH_TOKEN_KEY);
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(REFRESH_TOKEN_KEY, token); return; }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// ─── API Error ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────
type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; skipAuth?: boolean };

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) throw new ApiError(401, 'Session expired. Please login again.');

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(401, 'Session expired. Please login again.');

  const newToken = data.data?.accessToken || data.accessToken;
  await tokenStorage.setAccessToken(newToken);
  return newToken;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers = {}, ...rest } = options;

  const buildHeaders = async (): Promise<Record<string, string>> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...(headers as Record<string, string>) };
    if (!skipAuth) {
      const token = await tokenStorage.getAccessToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  };

  const execute = async (token?: string): Promise<Response> => {
    const h = await buildHeaders();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let response = await execute();

  // Token expired — attempt silent refresh
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);
        response = await execute(newToken);
      } catch (err) {
        isRefreshing = false;
        throw err;
      }
    } else {
      await new Promise<void>((resolve) => {
        refreshSubscribers.push(async (token) => {
          response = await execute(token);
          resolve();
        });
      });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || 'Something went wrong',
      data?.errors,
    );
  }

  return data as T;
}

// ─── Typed API Helpers ────────────────────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string, opts?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'GET', ...opts }),
  post: <T>(endpoint: string, body: unknown, opts?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'POST', body, ...opts }),
  patch: <T>(endpoint: string, body: unknown, opts?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, ...opts }),
  put: <T>(endpoint: string, body: unknown, opts?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, ...opts }),
  delete: <T>(endpoint: string, opts?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...opts }),
};
