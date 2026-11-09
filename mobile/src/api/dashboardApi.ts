import { apiClient } from './client';
import { DashboardStats } from '../types';

export async function getDashboardStatsApi(): Promise<{ success: boolean; stats: DashboardStats }> {
  return apiClient('/dashboard/stats', {
    method: 'GET',
  });
}
