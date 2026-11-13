/**
 * Machine service abstraction.
 * Simulates the ESP32 shoe cleaning machine communication.
 * In production, this would use HTTP/MQTT to talk to the ESP32.
 */

import { MachineStatus, MachineState } from '../types';
import { AppConfig } from '../constants';

/** Cleaning stages with their progress ranges and labels */
const CLEANING_STAGES: { state: MachineState; label: string; progressStart: number; progressEnd: number }[] = [
  { state: 'preparing', label: 'Preparing chamber...', progressStart: 0, progressEnd: 10 },
  { state: 'cleaning', label: 'Sanitation & Disinfection in progress...', progressStart: 10, progressEnd: 60 },
  { state: 'rinsing', label: 'Deodorizing shoes...', progressStart: 60, progressEnd: 80 },
  { state: 'drying', label: 'UV Light & Drying...', progressStart: 80, progressEnd: 95 },
  { state: 'completed', label: 'Cleaning complete!', progressStart: 95, progressEnd: 100 },
];

/**
 * Start a simulated cleaning session.
 * Calls the onUpdate callback at regular intervals with machine status.
 * Returns a cleanup function to stop the simulation.
 */
export function startCleaningSession(
  durationMinutes: number,
  onUpdate: (status: MachineStatus) => void,
  onComplete: () => void
): () => void {
  const totalDurationMs = durationMinutes * 60 * 1000;
  const startTime = Date.now();
  let isRunning = true;

  const interval = setInterval(() => {
    if (!isRunning) return;

    const elapsed = Date.now() - startTime;
    const overallProgress = Math.min((elapsed / totalDurationMs) * 100, 100);
    const remainingMs = Math.max(totalDurationMs - elapsed, 0);
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    // Find the current stage based on overall progress
    const currentStage =
      CLEANING_STAGES.find(
        (stage) => overallProgress >= stage.progressStart && overallProgress < stage.progressEnd
      ) ?? CLEANING_STAGES[CLEANING_STAGES.length - 1];

    const status: MachineStatus = {
      state: currentStage.state,
      progressPercent: Math.round(overallProgress),
      currentStep: currentStage.label,
      estimatedTimeRemaining: remainingSeconds,
    };

    onUpdate(status);

    if (overallProgress >= 100) {
      isRunning = false;
      clearInterval(interval);
      onComplete();
    }
  }, AppConfig.simulatedMachineUpdateInterval);

  // Return cleanup function
  return () => {
    isRunning = false;
    clearInterval(interval);
  };
}

/**
 * Get the initial idle machine status.
 */
export function getIdleStatus(): MachineStatus {
  return {
    state: 'idle',
    progressPercent: 0,
    currentStep: 'Ready',
    estimatedTimeRemaining: 0,
  };
}
