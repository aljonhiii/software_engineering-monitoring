/**
 * App-wide configuration.
 * Environment-specific settings and feature flags.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveHostUrl(envUrl: string | undefined, defaultPort: number, pathSuffix = ''): string {
  let host = 'localhost';

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    // If opened on a tablet / phone via LAN IP (e.g. 192.168.1.4), talk to the backend on that same host IP!
    host = window.location.hostname;
  } else {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) {
      host = debuggerHost;
    }
  }

  if (envUrl && envUrl.trim() !== '') {
    if (envUrl.includes('localhost') && host !== 'localhost') {
      return envUrl.replace('localhost', host);
    }
    return envUrl;
  }

  return `http://${host}:${defaultPort}${pathSuffix}`;
}

const STORAGE_KIOSK_KEY = 'kixcleen_kiosk_id';
let runtimeKioskId: string | null = null;

/**
 * Dynamically resolves the active Kiosk ID:
 * 1. Runtime memory override (set by deep link or on-device modal)
 * 2. URL search parameter (?kioskId=... or ?kiosk_id=...) on Web
 * 3. Local storage persistent setting (kixcleen_kiosk_id)
 * 4. Environment variable (EXPO_PUBLIC_KIOSK_ID)
 * 5. Default fallback ('KIOSK-01-MAIN')
 */
export function getResolvedKioskId(): string {
  if (runtimeKioskId) {
    return runtimeKioskId;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlKioskId = urlParams.get('kioskId') || urlParams.get('kiosk_id');
      if (urlKioskId && urlKioskId.trim()) {
        const clean = urlKioskId.trim().toUpperCase();
        localStorage.setItem(STORAGE_KIOSK_KEY, clean);
        return clean;
      }
      const stored = localStorage.getItem(STORAGE_KIOSK_KEY);
      if (stored && stored.trim()) {
        return stored.trim().toUpperCase();
      }
    } catch {
      // Safe fallback if localStorage is restricted
    }
  }

  return process.env.EXPO_PUBLIC_KIOSK_ID || 'KIOSK-01-MAIN';
}

/**
 * Allows switching the active Kiosk ID in development/runtime.
 */
export function setStoredKioskId(kioskId: string): void {
  const clean = kioskId.trim().toUpperCase();
  runtimeKioskId = clean;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KIOSK_KEY, clean);
      const url = new URL(window.location.href);
      url.searchParams.set('kioskId', clean);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore
    }
  }
}

export const AppConfig = {
  /** App display name */
  appName: 'KixCleen',

  /** Assigned Kiosk Machine ID for telemetry and sales auditing (dynamically resolved) */
  get kioskId(): string {
    return getResolvedKioskId();
  },

  /** Whether to use simulated services (true during development) */
  useSimulation: true,

  /** Simulated payment processing delay (ms) */
  simulatedPaymentDelay: 2500,

  /** Simulated machine update interval (ms) */
  simulatedMachineUpdateInterval: 1000,

  /** Auto-reset delay after completion (ms) */
  completionResetDelay: 15000,

  /** KixCleen Monitor Backend API base URL */
  apiBaseUrl: resolveHostUrl(process.env.EXPO_PUBLIC_MONITOR_API_URL, 3000, '/api'),

  /** Future MQTT broker URL for ESP32 */
  mqttBrokerUrl: 'ws://localhost:9001',

  /** Xendit Sandbox Configuration */
  xendit: {
    apiUrl: 'https://api.xendit.co',
    secretKey:
      process.env.EXPO_PUBLIC_XENDIT_SECRET_KEY || 'xnd_development_sample_shoeclean',
    publicKey:
      process.env.EXPO_PUBLIC_XENDIT_PUBLIC_KEY || 'xnd_public_development_sample_shoeclean',
    pollingIntervalMs: 3000,
    qrExpirySeconds: 300,
    sandboxMode: true,
  },
};
