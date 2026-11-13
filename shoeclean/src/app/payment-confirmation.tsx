/**
 * Step 7: Payment Confirmation Screen
 * Confirms successful payment receipt and presents the START CLEANING action.
 */

import React from 'react';
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

export default function PaymentConfirmationScreen() {
  const router = useRouter();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { state } = useOrder();

  const handleStartCleaning = () => {
    router.push('/preparation');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        bounces={false}
      >
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          {/* Success Checkmark Circle */}
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-done" size={60} color={Colors.primary} />
          </View>

          <Text style={styles.confirmationTitle}>Payment Confirmed!</Text>
          <Text style={styles.confirmationSubtitle}>
            Your transaction has been processed and your chamber slot is reserved.
          </Text>

          {/* Payment Receipt Summary Card */}
          <Card style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
              <Text style={styles.receiptTitle}>Official Kiosk Receipt</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Transaction Reference</Text>
              <Text style={styles.receiptValue}>
                #{state.transactionId || state.orderId}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Shoe Category</Text>
              <Text style={styles.receiptValue}>
                {state.selectedShoeCategory?.name || 'Other Shoes'}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cleaning Program</Text>
              <Text style={styles.receiptValue}>{state.selectedService?.name}</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Method</Text>
              <Text style={styles.receiptValue}>
                {state.paymentMethod === 'ewallet'
                  ? 'E-WALLET (XENDIT QR PH)'
                  : state.paymentMethod === 'bills'
                  ? 'BILL ACCEPTOR'
                  : state.paymentMethod === 'coins'
                  ? 'COIN SLOT'
                  : 'CASH'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotalLabel}>Amount Paid</Text>
              <Text style={styles.receiptTotalValue}>
                {formatPrice(state.totalPrice)}
              </Text>
            </View>
          </Card>

          {/* Primary CTA: START CLEANING */}
          <View style={styles.actionContainer}>
            <PrimaryButton
              title="START CLEANING"
              onPress={handleStartCleaning}
              size="large"
              style={styles.startButton}
            />
            <Text style={styles.actionHint}>
              Proceed to prepare and insert your shoes into the automated chamber
            </Text>
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
  scrollContent: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    ...Shadows.glow(Colors.primary),
  },
  confirmationTitle: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 22,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 620,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  receiptTitle: {
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
    alignItems: 'center',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  receiptValue: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  receiptTotalLabel: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  receiptTotalValue: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  startButton: {
    width: '100%',
  },
  actionHint: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
