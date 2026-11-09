import { apiClient } from './client';
import { Transaction } from '../types';

export interface TransactionFilterParams {
  paymentStatus?: string;
  cleaningStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getTransactionsApi(
  filters: TransactionFilterParams = {}
): Promise<{ success: boolean; count: number; transactions: Transaction[] }> {
  const query = new URLSearchParams();
  if (filters.paymentStatus) query.append('paymentStatus', filters.paymentStatus);
  if (filters.cleaningStatus) query.append('cleaningStatus', filters.cleaningStatus);
  if (filters.search) query.append('search', filters.search);
  if (filters.page) query.append('page', String(filters.page));
  if (filters.limit) query.append('limit', String(filters.limit));

  const qs = query.toString();
  return apiClient(`/transactions${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getTransactionDetailApi(id: string): Promise<{ success: boolean; transaction: Transaction }> {
  return apiClient(`/transactions/${id}`, {
    method: 'GET',
  });
}
