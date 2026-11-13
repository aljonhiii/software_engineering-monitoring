/**
 * Machine status type definitions.
 * Represents the state of the physical shoe cleaning machine.
 */

/** Machine operational states */
export type MachineState =
  | 'idle'
  | 'preparing'
  | 'cleaning'
  | 'rinsing'
  | 'drying'
  | 'completed'
  | 'error';

/** Machine status reported by ESP32 (or simulated) */
export interface MachineStatus {
  state: MachineState;
  progressPercent: number;
  currentStep: string;
  estimatedTimeRemaining: number; // seconds
  errorMessage?: string;
}

/** Cleaning session tracked by the machine */
export interface CleaningSession {
  sessionId: string;
  startedAt: Date;
  completedAt: Date | null;
  machineStatus: MachineStatus;
}
