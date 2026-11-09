import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AppConfig } from '../constants/config';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        cachedToken = window.localStorage.getItem(AppConfig.tokenStorageKey);
        return cachedToken;
      }
      return null;
    }
    cachedToken = await SecureStore.getItemAsync(AppConfig.tokenStorageKey);
    return cachedToken;
  } catch {
    return null;
  }
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (token) {
          window.localStorage.setItem(AppConfig.tokenStorageKey, token);
        } else {
          window.localStorage.removeItem(AppConfig.tokenStorageKey);
        }
      }
      return;
    }
    if (token) {
      await SecureStore.setItemAsync(AppConfig.tokenStorageKey, token);
    } else {
      await SecureStore.deleteItemAsync(AppConfig.tokenStorageKey);
    }
  } catch (err) {
    console.warn('[SecureStore] Failed to update token:', err);
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const url = `${AppConfig.apiUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Check your local server connection.');
    }
    throw err;
  }
}
