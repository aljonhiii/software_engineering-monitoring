/**
 * Kiosk Monitoring & Telemetry Integration Service.
 * Connects the KixCleen Kiosk App to the KixCleen Monitoring & Management Backend,
 * transmitting real-time transaction records, wash cycle updates, and ESP32 telemetry heartbeats.
 */

import { AppConfig } from '../constants';
import { ShoeCategory, CleaningService, ServiceAddon, PaymentMethod } from '../types';

interface RecordTransactionParams {
  orderId: string;
  shoeCategory?: ShoeCategory | null;
  service?: CleaningService | null;
  addons?: ServiceAddon[];
  totalPrice: number;
  paymentMethod: PaymentMethod | null;
  transactionId?: string | null;
  channel?: string;
}

interface TelemetryParams {
  doorLocked?: boolean;
  currentOrderId?: string | null;
  currentActivity?: string;
  status?: 'online' | 'busy' | 'offline';
  waterLevelPercent?: number;
  soapLevelPercent?: number;
}

// Running simulated reservoir levels (consumed during cycles)
let currentWaterLevel = 90;
let currentSoapLevel = 94;

/**
 * Report a newly paid kiosk transaction to the monitoring backend.
 * Real-time updates dashboard revenue, payment methods ledger, and recent orders stream.
 */
export async function recordKioskTransaction(params: RecordTransactionParams): Promise<boolean> {
  try {
    const rawMethod = params.paymentMethod || 'cash';
    let normalizedMethod = 'cash';

    if (rawMethod === 'ewallet') {
      const ch = (params.channel || '').toLowerCase();
      const ref = (params.transactionId || '').toLowerCase();
      normalizedMethod = ch.includes('maya') || ref.includes('maya') ? 'maya' : 'gcash';
    } else if (rawMethod === 'coins') {
      normalizedMethod = 'coins';
    } else if (rawMethod === 'bills') {
      normalizedMethod = 'bills';
    } else {
      normalizedMethod = 'cash';
    }

    const basePrice = params.service?.price || 0;
    const addonsList = (params.addons || []).map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
    }));
    const addonsPrice = addonsList.reduce((sum, a) => sum + a.price, 0);

    const payload = {
      orderId: params.orderId,
      kioskId: AppConfig.kioskId,
      shoeType: params.shoeCategory?.name || 'Other Shoes',
      serviceTier: params.service?.id || 'sanitation',
      serviceName: params.service?.name || 'Sanitation',
      addons: addonsList,
      basePrice,
      addonsPrice,
      totalAmount: params.totalPrice,
      paymentMethod: normalizedMethod,
      paymentStatus: 'paid',
      paymentRef: params.transactionId || `ref_${params.orderId}`,
      cleaningStatus: 'pending',
    };

    console.log(`[MonitoringService] Transmitting transaction to ${AppConfig.apiBaseUrl}/transactions:`, payload.orderId);

    const response = await fetch(`${AppConfig.apiBaseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[MonitoringService] Backend rejected transaction recording:', errText);
      return false;
    }

    const data = await response.json();
    console.log('✅ [MonitoringService] Transaction recorded successfully in monitoring backend:', data.message || 'ok');
    return true;
  } catch (err: any) {
    console.warn('[MonitoringService] Network error sending transaction to monitoring backend:', err.message);
    return false;
  }
}

/**
 * Update the cleaning status of an active transaction (e.g. 'in_progress', 'completed').
 */
export async function updateKioskCleaningStatus(
  orderId: string,
  cleaningStatus: 'pending' | 'in_progress' | 'completed'
): Promise<boolean> {
  try {
    console.log(`[MonitoringService] Updating cleaningStatus of #${orderId} to '${cleaningStatus}'`);

    const response = await fetch(`${AppConfig.apiBaseUrl}/transactions/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cleaningStatus }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[MonitoringService] Backend rejected cleaning update:', errText);
      return false;
    }

    console.log(`✅ [MonitoringService] Order #${orderId} cleaning status updated to '${cleaningStatus}'`);
    return true;
  } catch (err: any) {
    console.warn('[MonitoringService] Network error updating cleaning status:', err.message);
    return false;
  }
}

/**
 * Send ESP32 / Kiosk hardware status and consumable telemetry heartbeat.
 * Live-updates the Machine Telemetry tab and dashboard sensors.
 */
export async function sendKioskHeartbeat(telemetry: TelemetryParams): Promise<boolean> {
  try {
    if (telemetry.waterLevelPercent !== undefined) {
      currentWaterLevel = telemetry.waterLevelPercent;
    } else if (telemetry.status === 'busy') {
      currentWaterLevel = Math.max(10, currentWaterLevel - 0.2);
    }

    if (telemetry.soapLevelPercent !== undefined) {
      currentSoapLevel = telemetry.soapLevelPercent;
    } else if (telemetry.status === 'busy') {
      currentSoapLevel = Math.max(10, currentSoapLevel - 0.15);
    }

    const payload = {
      kioskId: AppConfig.kioskId,
      status: telemetry.status || 'online',
      doorLocked: Boolean(telemetry.doorLocked),
      waterLevelPercent: Math.round(currentWaterLevel),
      soapLevelPercent: Math.round(currentSoapLevel),
      currentOrderId: telemetry.currentOrderId !== undefined ? telemetry.currentOrderId : null,
      currentActivity: telemetry.currentActivity || 'Idle - Ready for customer',
    };

    const response = await fetch(`${AppConfig.apiBaseUrl}/machine/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch {
    // Non-blocking for offline/testing robustness
    return false;
  }
}

/**
 * Register active web origin with the backend launcher auto-discovery hub.
 */
export async function registerShoecleanOrigin(): Promise<void> {
  if (typeof window !== 'undefined' && window.location?.origin) {
    try {
      await fetch(`${AppConfig.apiBaseUrl}/launcher/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: window.location.origin,
          kioskId: AppConfig.kioskId,
          appName: 'shoeclean',
        }),
      });
    } catch {
      // Non-blocking
    }
  }
}
