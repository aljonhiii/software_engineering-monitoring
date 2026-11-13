/**
 * Order and payment type definitions.
 */

import { CleaningService, ServiceAddon } from './service';

/** Payment methods available in the vendo */
export type PaymentMethod = 'coins' | 'bills' | 'ewallet';

/** Payment status throughout the flow */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Current order state */
export interface Order {
  id: string;
  service: CleaningService | null;
  addons: ServiceAddon[];
  totalPrice: number;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

/** Digital payment details for E-Wallet / QR Ph */
export interface DigitalPaymentDetails {
  sourceId: string;
  qrCodeUrl?: string;
  qrPayload?: string;
  checkoutUrl?: string;
  amountCentavos: number;
  status:
    | 'pending'
    | 'chargeable'
    | 'paid'
    | 'expired'
    | 'failed'
    | 'COMPLETED'
    | 'ACTIVE'
    | 'PAID'
    | 'SETTLED';
  expiresAt: string;
  referenceNumber: string;
}

/** Payment result returned by the payment service */
export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
  timestamp: Date;
  digitalDetails?: DigitalPaymentDetails;
}
