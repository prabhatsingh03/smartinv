import axios from 'axios';
import { config } from '@config/index';
import type { AuthTokens } from '@types';

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await axios.post(
    `${config.authBaseUrl}/login`,
    { username: email, password },
    { withCredentials: false }
  );
  const tokens: AuthTokens = {
    access_token: res.data?.access_token,
    refresh_token: res.data?.refresh_token
  };
  localStorage.setItem('accessToken', tokens.access_token);
  // Store refresh token in localStorage for header-based refresh
  if (tokens.refresh_token) localStorage.setItem('refreshToken', tokens.refresh_token);
  return tokens;
}

export async function refreshToken(): Promise<string | null> {
  try {
    const refresh = localStorage.getItem('refreshToken');
    const headers: Record<string, string> = {};
    if (refresh) headers.Authorization = `Bearer ${refresh}`;
    const res = await axios.post(`${config.authBaseUrl}/refresh`, {}, { withCredentials: false, headers });
    const newAccess = res.data?.access_token;
    if (newAccess) localStorage.setItem('accessToken', newAccess);
    return newAccess ?? null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}
