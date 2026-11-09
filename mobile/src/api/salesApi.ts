import { apiClient } from './client';
import { SalesReport } from '../types';

export async function getSalesReportsApi(period: 'day' | 'week' | 'month' = 'week'): Promise<SalesReport> {
  const res = await apiClient(`/sales/reports?period=${period}`, {
    method: 'GET',
  });
  return res as unknown as SalesReport;
}
