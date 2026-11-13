/**
 * Price and time formatting utilities.
 */

import { CURRENCY_SYMBOL } from '../constants';

/** Format a number as Philippine Peso currency */
export function formatPrice(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(0)}`;
}

/** Format seconds into MM:SS display */
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/** Format minutes into a human-readable string */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

/** Generate a unique ID for orders/sessions (KIX-YYYYMMDD-XXXX) */
export function generateId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `KIX-${dateStr}-${randomNum}`;
}
