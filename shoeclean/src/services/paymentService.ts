/**
 * Payment service abstraction.
 * Currently uses simulation — swap this implementation for real
 * backend integration without changing any UI code.
 */

import { PaymentMethod, PaymentResult } from '../types';
import { AppConfig } from '../constants';
import { generateId } from '../utils';
import { simulateCustomerScanAndPay } from './xenditService';

/**
 * Process a payment: digital e-wallet via Xendit or cash via hardware simulation.
 */
export async function processPayment(
  amount: number,
  method: PaymentMethod,
  sourceId?: string
): Promise<PaymentResult> {
  // If digital e-wallet with active Xendit QR source
  if (method === 'ewallet' && sourceId) {
    return await simulateCustomerScanAndPay(sourceId, amount);
  }

  // Simulate payment processing delay for hardware cash validator
  await new Promise((resolve) =>
    setTimeout(resolve, AppConfig.simulatedPaymentDelay)
  );

  // High success rate for coin/bill acceptors
  const isSuccess = Math.random() < 0.98;

  return {
    success: isSuccess,
    transactionId: generateId(),
    message: isSuccess
      ? `Payment of ₱${amount} received via ${method === 'coins' ? 'Coin Slot' : 'Bill Acceptor'}`
      : 'Hardware feeder error. Please retrieve your money and try again.',
    timestamp: new Date(),
  };
}
