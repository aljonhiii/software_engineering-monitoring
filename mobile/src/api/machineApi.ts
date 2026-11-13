import { apiClient } from './client';
import { KioskMachine, KioskLocationRegistrationPayload } from '../types';

export async function getMachineStatusApi(): Promise<{ success: boolean; kiosks: KioskMachine[] }> {
  return apiClient('/machine/status', {
    method: 'GET',
  });
}

export async function registerKioskLocationApi(
  payload: KioskLocationRegistrationPayload
): Promise<{
  success: boolean;
  message: string;
  kiosk?: {
    id: string;
    name?: string;
    latitude: number;
    longitude: number;
    address: string;
    barangay?: string;
    city?: string;
    location?: string;
  };
  onboardingCompleted?: boolean;
}> {
  return apiClient('/machine/register-location', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
