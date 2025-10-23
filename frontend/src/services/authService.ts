import api from './apiService';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  department_id?: number;
  is_active: boolean;
}

export interface LoginResponse {
  message: string;
  user: User;
  authenticated: boolean;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post(
    `/auth/login`,
    { email, password }
  );
  
  // Store user data in localStorage for simplified authentication
  if (res.data?.authenticated) {
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('authenticated', 'true');
  }
  
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.warn('Logout API call failed:', error);
  } finally {
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('authenticated');
  }
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem('authenticated') === 'true';
}