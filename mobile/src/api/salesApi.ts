import { apiClient } from './client';
import { SalesReport } from '../types';

export async function getSalesReportsApi(
  period: 'day' | 'week' | 'month' = 'week',
  kioskId?: string | null
): Promise<SalesReport> {
  const qs = new URLSearchParams({ period });
  if (kioskId) {
    qs.append('kioskId', kioskId);
  }
  const res = await apiClient(`/sales/reports?${qs.toString()}`, {
    method: 'GET',
  });
  return res as unknown as SalesReport;
}
