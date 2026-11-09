import { apiClient } from './client';

export async function registerPushTokenApi(expoPushToken: string, deviceName?: string): Promise<{ success: boolean }> {
  return apiClient('/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify({ expoPushToken, deviceName }),
  });
}
