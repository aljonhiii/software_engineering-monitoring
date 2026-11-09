import { apiClient } from './client';
import { PaymentsLedgerSummary } from '../types';

export interface PaymentItem {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentRef?: string | null;
  createdAt: string;
}

export async function getPaymentsLedgerApi(): Promise<{
  success: boolean;
  summary: PaymentsLedgerSummary;
  payments: PaymentItem[];
}> {
  return apiClient('/payments', {
    method: 'GET',
  });
}
