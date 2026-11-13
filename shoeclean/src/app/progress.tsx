/**
 * Step 9: Cleaning Progress Screen
 * Real-time monitoring of automated shoe cleaning cycles with status updates,
 * timer countdown, and simulated machine status integration.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../constants';
import { useOrder } from '../store/orderStore';
import { StepProgress } from '../components/progress';
import { ProgressRing, Card } from '../components/common';
import { formatTime } from '../utils';
import { MachineStatus } from '../types';
import {
  startCleaningSession,
  updateKioskCleaningStatus,
  sendKioskHeartbeat,
} from '../services';
import { useResponsive } from '../hooks';

export default function ProgressScreen() {
  const router = useRouter();
  const {
    isTablet,
    contentMaxWidth,
    horizontalPadding,
    progressTwoColumn,
  } = useResponsive();

  const { state, dispatch } = useOrder();
  const selectedService = state.selectedService;

  // Machine status state
  const [machineStatus, setMachineStatus] = useState<MachineStatus>(state.machineStatus);

  useEffect(() => {
    if (!selectedService) {
      router.replace('/');
      return;
    }

    const duration = selectedService.durationMinutes;

    // Notify monitoring platform that cleaning cycle has officially started
    updateKioskCleaningStatus(state.orderId, 'in_progress');
    sendKioskHeartbeat({
      doorLocked: true,
      currentOrderId: state.orderId,
      currentActivity: `Starting ${selectedService.name} cycle...`,
      status: 'busy',
    });

    // Start machine session simulation (or ESP32 connection in future)
    const stopSession = startCleaningSession(
      duration,
      (status) => {
        setMachineStatus(status);
        dispatch({ type: 'UPDATE_MACHINE_STATUS', status });

        // Transmit live progress heartbeat to Monitoring Platform
        sendKioskHeartbeat({
          doorLocked: true,
          currentOrderId: state.orderId,
          currentActivity: `${status.currentStep} (${status.progressPercent}%)`,
          status: 'busy',
        });
      },
      () => {
        updateKioskCleaningStatus(state.orderId, 'completed');
        sendKioskHeartbeat({
          doorLocked: false,
          currentOrderId: state.orderId,
          currentActivity: 'Wash cycle completed. Chamber door unlocked.',
          status: 'online',
        });
        dispatch({ type: 'SET_CLEANING_COMPLETE' });
        router.replace('/complete');
      }
    );

    return () => {
      stopSession();
    };
  }, [selectedService, dispatch, router, state.orderId]);

  // Developer simulation helper to complete immediately
  const handleFastForward = () => {
    updateKioskCleaningStatus(state.orderId, 'completed');
    sendKioskHeartbeat({
      doorLocked: false,
      currentOrderId: state.orderId,
      currentActivity: 'Wash cycle completed. Chamber door unlocked.',
      status: 'online',
    });
    dispatch({ type: 'SET_CLEANING_COMPLETE' });
    router.replace('/complete');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Kiosk Safety Top Bar */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.kioskTitleRow}>
            <View style={styles.livePulse} />
            <Text style={styles.kioskTitle}>CHAMBER 01 ACTIVE • DOOR MAGNETICALLY LOCKED</Text>
          </View>
          <Text style={styles.orderBadge}>Session #{state.orderId}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        bounces={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          <View style={[styles.mainLayout, progressTwoColumn && styles.mainLayoutRow]}>
            {/* Left Column: Progress Ring & Countdown Timer */}
            <View style={styles.progressColumn}>
              <Card style={styles.ringCard}>
                <ProgressRing
                  progress={machineStatus.progressPercent}
                  size={isTablet ? 250 : 210}
                  label={machineStatus.currentStep}
                />

                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={24} color={Colors.primary} />
                  <Text style={styles.timerValue}>
                    {formatTime(machineStatus.estimatedTimeRemaining)}
                  </Text>
                  <Text style={styles.timerLabel}>Estimated Remaining Time</Text>
                </View>
              </Card>
            </View>

            {/* Right Column: Cycle Stages & Machine Parameters */}
            <View style={styles.detailsColumn}>
              {/* Cycle Stage Progress Component */}
              <Card style={styles.stepsCard}>
                <Text style={styles.cardHeader}>Active Cycle Stages</Text>
                <StepProgress currentState={machineStatus.state} />
              </Card>

              {/* Chamber Diagnostics Card */}
              <Card style={styles.chamberCard}>
                <View style={styles.chamberHeader}>
                  <Ionicons name="lock-closed" size={22} color={Colors.primary} />
                  <View>
                    <Text style={styles.chamberTitle}>Chamber #01 Sealed & Active</Text>
                    <Text style={styles.chamberSub}>Automatic sensors regulating water, foam & RPM</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Footwear Category:</Text>
                  <Text style={styles.detailValue}>
                    {state.selectedShoeCategory?.name || 'Standard'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cleaning Program:</Text>
                  <Text style={styles.detailValue}>{selectedService?.name}</Text>
                </View>

                {state.selectedAddons.length > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Applied Treatments:</Text>
                    <Text style={styles.detailValue}>
                      {state.selectedAddons.map((a) => a.name).join(', ')}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Current Hardware Step:</Text>
                  <Text style={[styles.detailValue, { color: Colors.primary }]}>
                    {machineStatus.currentStep}
                  </Text>
                </View>
              </Card>

              {/* Fast-forward Button for Test Simulation */}
              <TouchableOpacity
                style={styles.fastForwardButton}
                onPress={handleFastForward}
                activeOpacity={0.7}
              >
                <Ionicons name="play-forward" size={16} color={Colors.accent} />
                <Text style={styles.fastForwardText}>
                  Fast-Forward / Complete (Simulation Mode)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    ...Shadows.small,
  },
  topBarInner: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  kioskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  kioskTitle: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  orderBadge: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
  },
  mainLayout: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressColumn: {
    flex: 1,
    alignItems: 'center',
  },
  detailsColumn: {
    flex: 1.2,
    gap: Spacing.lg,
  },
  ringCard: {
    width: '100%',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  timerValue: {
    fontSize: Typography.hero,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginVertical: 4,
  },
  timerLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  cardHeader: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chamberCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  chamberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chamberTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  chamberSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  fastForwardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  fastForwardText: {
    fontSize: Typography.caption,
    color: Colors.accent,
    fontWeight: Typography.medium,
  },
});
