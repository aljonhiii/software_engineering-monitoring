import { apiClient, setToken } from './client';
import { User } from '../types';

export interface LoginResult {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

export async function loginApi(identifier: string, password: string): Promise<LoginResult> {
  const res = await apiClient<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

  if (res.success && res.token) {
    await setToken(res.token);
  }

  return res as unknown as LoginResult;
}

export async function getMeApi(): Promise<{ success: boolean; user: User }> {
  const res = await apiClient<{ success: boolean; user: User }>('/auth/me', {
    method: 'GET',
  });
  return res;
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiClient('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
