import axios from 'axios';
import type { AuthTokens } from '@types';

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await axios.post(
    `/api/auth/login`,
    { username: email, password },
    { withCredentials: false }
  );
  const tokens: AuthTokens = {
    access_token: res.data?.access_token,
    refresh_token: res.data?.refresh_token
  };
  localStorage.setItem('access_token', tokens.access_token);
  // Store refresh token in localStorage for header-based refresh
  if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
  return tokens;
}

export async function refreshToken(): Promise<string | null> {
  try {
    const refresh = localStorage.getItem('refresh_token');
    const headers: Record<string, string> = {};
    if (refresh) headers.Authorization = `Bearer ${refresh}`;
    const res = await axios.post(`/api/auth/refresh`, {}, { withCredentials: false, headers });
    const newAccess = res.data?.access_token;
    if (newAccess) localStorage.setItem('access_token', newAccess);
    return newAccess ?? null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}
