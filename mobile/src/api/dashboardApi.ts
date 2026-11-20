import { apiClient } from './client';
import { DashboardStats } from '../types';

export async function getDashboardStatsApi(
  kioskId?: string | null
): Promise<{ success: boolean; stats: DashboardStats }> {
  const qs = kioskId ? `?kioskId=${encodeURIComponent(kioskId)}` : '';
  return apiClient(`/dashboard/stats${qs}`, {
    method: 'GET',
  });
}
