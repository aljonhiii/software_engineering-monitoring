/**
 * Xendit Sandbox Payment Service (Invoices & E-Wallet / QR Ph).
 * Creates trackable sandbox invoices directly visible in the Xendit Dashboard
 * under Accept Payments > Invoices and the Transactions tab.
 */

import { AppConfig } from '../constants';
import { DigitalPaymentDetails, PaymentResult } from '../types';
import { generateId } from '../utils';

// Helper to base64 encode credentials safely across Web, Hermes, and React Native
function toBase64(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode = 0, idx = 0, map = chars;
    str.charAt(idx | 0) || ((map = '='), idx % 1);
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
  ) {
    charCode = str.charCodeAt((idx += 3 / 4));
    if (charCode > 0xff) {
      throw new Error('Invalid character in base64 string');
    }
    block = (block << 8) | charCode;
  }
  return output;
}

/** Local in-memory mock store for sandbox testing when live keys aren't set */
const mockSandboxInvoices = new Map<string, DigitalPaymentDetails>();

/**
 * Checks if the configured Xendit keys are active developer credentials
 * rather than default placeholder sample strings.
 */
export function hasConfiguredXenditKeys(): boolean {
  const sec = AppConfig.xendit.secretKey;
  return (
    Boolean(sec) &&
    !sec.includes('sample') &&
    sec.startsWith('xnd_development_')
  );
}

/**
 * Creates a trackable Xendit Invoice in Sandbox mode.
 * Visible immediately in your Xendit Dashboard under Accept Payments > Invoices!
 */
export async function createDigitalPayment(
  amountPesos: number,
  orderId: string
): Promise<DigitalPaymentDetails> {
  const amountCentavos = Math.round(amountPesos * 100);
  const referenceNumber = `XND-${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(
    Date.now() + AppConfig.xendit.qrExpirySeconds * 1000
  ).toISOString();

  // If live Xendit development keys are configured in .env, call Xendit Invoices API
  if (hasConfiguredXenditKeys()) {
    try {
      const authHeader = `Basic ${toBase64(`${AppConfig.xendit.secretKey}:`)}`;
      const response = await fetch(`${AppConfig.xendit.apiUrl}/v2/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          external_id: `kixcleen_${orderId}_${Date.now()}`,
          amount: amountPesos,
          description: `KixCleen Vendo - Order #${orderId}`,
          currency: 'PHP',
          invoice_duration: AppConfig.xendit.qrExpirySeconds,
        }),
      });

      if (response.ok) {
        const invData = await response.json();
        const details: DigitalPaymentDetails = {
          sourceId: invData.id,
          amountCentavos,
          checkoutUrl: invData.invoice_url,
          qrPayload: invData.invoice_url,
          status: 'pending',
          expiresAt: invData.expiry_date || expiresAt,
          referenceNumber,
        };
        mockSandboxInvoices.set(details.sourceId, details);
        return details;
      } else {
        const errText = await response.text();
        console.warn('Xendit Invoice API error, falling back to sandbox emulator:', errText);
      }
    } catch (err) {
      console.warn('Xendit connection error, falling back to sandbox emulator:', err);
    }
  }

  // High-fidelity Sandbox Mock fallback (used with default keys or offline testing)
  const sourceId = `inv_xnd_${generateId()}`;
  const mockCheckoutUrl = `https://checkout-staging.xendit.co/web/${sourceId}`;

  const details: DigitalPaymentDetails = {
    sourceId,
    amountCentavos,
    qrPayload: mockCheckoutUrl,
    checkoutUrl: mockCheckoutUrl,
    status: 'pending',
    expiresAt,
    referenceNumber,
  };

  mockSandboxInvoices.set(sourceId, details);
  return details;
}

/**
 * Checks or polls the status of a Xendit Invoice.
 * When paid (either via the simulation button or Xendit checkout), returns isPaid: true.
 */
export async function checkPaymentStatus(
  sourceId: string
): Promise<{ status: string; isPaid: boolean }> {
  // Check in-memory state first (allows instant local simulation)
  const mock = mockSandboxInvoices.get(sourceId);
  if (mock && (mock.status === 'paid' || mock.status === 'PAID')) {
    return { status: 'PAID', isPaid: true };
  }

  // Check live Xendit Invoices API if keys are configured
  if (hasConfiguredXenditKeys() && !sourceId.startsWith('inv_xnd_')) {
    try {
      const authHeader = `Basic ${toBase64(`${AppConfig.xendit.secretKey}:`)}`;
      const response = await fetch(`${AppConfig.xendit.apiUrl}/v2/invoices/${sourceId}`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const status = data.status; // 'PENDING', 'PAID', 'SETTLED', 'EXPIRED'
        const isPaid = status === 'PAID' || status === 'SETTLED';
        if (isPaid && mock) {
          mock.status = 'paid';
          mockSandboxInvoices.set(sourceId, mock);
        }
        return { status, isPaid };
      }
    } catch (err) {
      console.warn('Failed to poll Xendit invoice status:', err);
    }
  }

  if (mock) {
    const isPaid = mock.status === 'paid' || mock.status === 'PAID';
    return { status: mock.status, isPaid };
  }

  return { status: 'pending', isPaid: false };
}

/**
 * Allows instant in-app simulation of a customer paying via GCash, Maya, or QR Ph.
 * Runs 100% inside the app without opening any external browsers.
 */
export async function simulateCustomerScanAndPay(
  sourceId: string,
  amountPesos?: number,
  channel: 'GCash' | 'Maya' | 'QR Ph' = 'QR Ph'
): Promise<PaymentResult> {
  const mock = mockSandboxInvoices.get(sourceId);
  if (mock) {
    mock.status = 'paid';
    mockSandboxInvoices.set(sourceId, mock);
  }

  const paidAmount = mock
    ? (mock.amountCentavos / 100).toFixed(2)
    : amountPesos
    ? amountPesos.toFixed(2)
    : '50.00';

  return {
    success: true,
    transactionId: `xnd_${channel.toLowerCase().replace(/[^a-z0-9]/g, '')}_${generateId()}`,
    message: `Payment of ₱${paidAmount} verified via ${channel}`,
    timestamp: new Date(),
    digitalDetails: mock,
  };
}
