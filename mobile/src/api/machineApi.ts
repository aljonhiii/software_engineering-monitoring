import { apiClient } from './client';
import { KioskMachine } from '../types';

export async function getMachineStatusApi(): Promise<{ success: boolean; kiosks: KioskMachine[] }> {
  return apiClient('/machine/status', {
    method: 'GET',
  });
}
