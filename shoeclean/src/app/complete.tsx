/**
 * Step 10: Cleaning Completed Screen
 * Displays completion celebration, chamber door release instructions,
 * receipt summary, and the FINISH action returning to Welcome.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { PrimaryButton, Card } from '../components/common';
import { formatPrice } from '../utils';
import { useResponsive } from '../hooks';
import { sendKioskHeartbeat } from '../services';

export default function CompleteScreen() {
  const router = useRouter();
  const {
    isLandscape,
    isTablet,
    contentMaxWidth,
    horizontalPadding,
  } = useResponsive();

  const { state, dispatch } = useOrder();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(6);

  const handleFinish = useCallback(() => {
    sendKioskHeartbeat({
      doorLocked: false,
      currentOrderId: null,
      currentActivity: 'Idle - Ready for customer',
      status: 'online',
    });
    dispatch({ type: 'RESET_SESSION' });
    router.replace('/');
  }, [dispatch, router]);

  // Clean timer decrement; triggers handleFinish when secondsRemaining reaches 0
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinish();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining, handleFinish]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: horizontalPadding },
          isLandscape && styles.containerLandscape,
        ]}
        bounces={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* Celebration Header */}
          <View style={styles.celebrationSection}>
            <View
              style={[
                styles.successIconCircle,
                isTablet && styles.successIconCircleTablet,
              ]}
            >
              <Ionicons
                name="sparkles"
                size={isTablet ? 60 : 48}
                color={Colors.primary}
              />
            </View>
            <Text
              style={[
                styles.completionTitle,
                isTablet && styles.completionTitleTablet,
              ]}
            >
              CLEANING COMPLETED!
            </Text>
            <Text style={styles.completionSubtitle}>
              Your footwear has been sanitized, dried, and is ready for pickup.
            </Text>
          </View>

          {/* Chamber Door Unlock Notification Card */}
          <Card style={styles.pickupCard}>
            <View style={styles.pickupHeader}>
              <View style={styles.doorIconWrapper}>
                <Ionicons name="lock-open-outline" size={32} color={Colors.primary} />
              </View>
              <View style={styles.pickupTexts}>
                <Text style={styles.pickupTitle}>Chamber Door Unlocked</Text>
                <Text style={styles.pickupDesc}>
                  The magnetic lock has released. Please pull open the chamber door and retrieve your fresh shoes.
                </Text>
              </View>
            </View>
          </Card>

          {/* Transaction Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Service Completion Summary</Text>
            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction Reference</Text>
              <Text style={styles.receiptVal}>
                #{state.transactionId || state.orderId}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Shoe Category</Text>
              <Text style={styles.receiptVal}>
                {state.selectedShoeCategory?.name || 'Other Shoes'}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cleaning Program</Text>
              <Text style={styles.receiptVal}>
                {state.selectedService?.name || 'Sanitation'}
              </Text>
            </View>

            {state.selectedAddons.length > 0 && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Applied Treatments</Text>
                <Text style={styles.receiptVal}>
                  {state.selectedAddons.map((a) => a.name).join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Method</Text>
              <Text style={styles.receiptVal}>
                {state.paymentMethod ? state.paymentMethod.toUpperCase() : 'CASH'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>Total Amount Paid</Text>
              <Text style={styles.receiptTotalVal}>{formatPrice(state.totalPrice)}</Text>
            </View>
          </Card>

          {/* Auto Reset Footer Banner and Action Button */}
          <View style={styles.footerArea}>
            <Text style={styles.countdownText}>
              Returning to GET STARTED for a new transaction in{' '}
              <Text style={styles.countdownHighlight}>{secondsRemaining}s</Text>
            </Text>

            <PrimaryButton
              title="START NEW TRANSACTION"
              onPress={handleFinish}
              size="large"
              style={styles.finishButton}
            />
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
  container: {
    flexGrow: 1,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerLandscape: {
    paddingVertical: Spacing.lg,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  celebrationSection: {
    alignItems: 'center',
  },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.glow(Colors.primary),
  },
  successIconCircleTablet: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  completionTitle: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  completionTitleTablet: {
    fontSize: Typography.hero,
  },
  completionSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 520,
  },
  pickupCard: {
    width: '100%',
    maxWidth: 680,
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  pickupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  doorIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupTexts: {
    flex: 1,
  },
  pickupTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  pickupDesc: {
    fontSize: Typography.bodySmall,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  summaryCard: {
    width: '100%',
    maxWidth: 680,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  summaryTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  receiptVal: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  receiptTotalLabel: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  receiptTotalVal: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  footerArea: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  countdownText: {
    fontSize: Typography.bodySmall,
    color: Colors.textMuted,
  },
  countdownHighlight: {
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  finishButton: {
    width: '100%',
  },
});
