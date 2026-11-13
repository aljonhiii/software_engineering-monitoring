/**
 * Step 5: Payment Method Selection Screen
 * Customer chooses their preferred payment method (Coins, Bills, or E-Wallet QR).
 */

import React, { useState, useEffect } from 'react';
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
import { PaymentMethodCard } from '../components/payment';
import { PrimaryButton, ErrorBanner, ScreenHeader } from '../components/common';
import { formatPrice } from '../utils';
import { PaymentMethod } from '../types';
import { useResponsive } from '../hooks';

export default function PaymentMethodScreen() {
  const router = useRouter();
  const {
    contentMaxWidth,
    horizontalPadding,
    paymentColumns,
  } = useResponsive();

  const { state, dispatch } = useOrder();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    state.paymentMethod
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user navigated directly or state was cleared, redirect safely in useEffect
  useEffect(() => {
    if (!state.selectedService) {
      router.replace('/');
    }
  }, [state.selectedService, router]);

  if (!state.selectedService) {
    return null;
  }

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setErrorMessage(null);
    dispatch({ type: 'SET_PAYMENT_METHOD', method });
  };

  const handleContinue = () => {
    if (!selectedMethod) {
      setErrorMessage('Please select a payment method to proceed.');
      return;
    }
    router.push('/payment-processing');
  };

  const handleBack = () => {
    router.back();
  };

  const isThreeCols = paymentColumns === 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            <Text style={styles.backButtonText}>Back to Summary</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step 5 of 10: Payment Method</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
          {/* Total Amount Due Banner */}
          <View style={styles.amountBanner}>
            <Text style={styles.amountLabel}>Total Amount Due</Text>
            <Text style={styles.amountValue}>{formatPrice(state.totalPrice)}</Text>
            <View style={styles.servicePill}>
              <Text style={styles.servicePillText}>
                {state.selectedShoeCategory?.name} • {state.selectedService.name}
              </Text>
            </View>
          </View>

          <ScreenHeader
            title="SELECT PAYMENT METHOD"
            subtitle="Choose your preferred payment channel to activate the shoe cleaning kiosk"
          />

          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {/* Payment Methods Grid */}
          <View
            style={[
              styles.methodsGrid,
              isThreeCols && styles.methodsGridRow,
            ]}
          >
            <View
              style={[
                styles.methodWrapper,
                isThreeCols && styles.methodWrapperRow,
              ]}
            >
              <PaymentMethodCard
                method="coins"
                title="Coin Slot"
                subtitle="Accepts ₱1, ₱5, ₱10, ₱20 coins"
                icon="cash-outline"
                isSelected={selectedMethod === 'coins'}
                onSelect={handleSelectMethod}
              />
            </View>

            <View
              style={[
                styles.methodWrapper,
                isThreeCols && styles.methodWrapperRow,
              ]}
            >
              <PaymentMethodCard
                method="bills"
                title="Bill Acceptor"
                subtitle="Accepts ₱20, ₱50, ₱100 notes"
                icon="wallet-outline"
                isSelected={selectedMethod === 'bills'}
                onSelect={handleSelectMethod}
              />
            </View>

            <View
              style={[
                styles.methodWrapper,
                isThreeCols && styles.methodWrapperRow,
              ]}
            >
              <PaymentMethodCard
                method="ewallet"
                title="E-Wallet (QR)"
                subtitle="GCash, Maya, ShopeePay, QR Ph"
                icon="qr-code-outline"
                isSelected={selectedMethod === 'ewallet'}
                onSelect={handleSelectMethod}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={[styles.bottomBarInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>Payment Channel:</Text>
            <Text style={styles.selectedName}>
              {selectedMethod
                ? selectedMethod === 'ewallet'
                  ? 'Contactless E-Wallet (QR)'
                  : selectedMethod === 'bills'
                  ? 'Paper Bill Acceptor'
                  : 'Coin Slot'
                : 'Select a payment method above'}
            </Text>
          </View>

          <PrimaryButton
            title="Proceed to Payment"
            onPress={handleContinue}
            disabled={!selectedMethod}
            size="large"
            style={styles.proceedButton}
          />
        </View>
      </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  stepIndicator: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
  },
  cancelButtonText: {
    fontSize: Typography.body,
    color: Colors.textMuted,
  },
  scrollContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: 130,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
  },
  amountBanner: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  amountLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: Typography.hero,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginVertical: 4,
  },
  servicePill: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  servicePillText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  methodsGrid: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  methodsGridRow: {
    flexDirection: 'row',
  },
  methodWrapper: {
    width: '100%',
  },
  methodWrapperRow: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.large,
  },
  bottomBarInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  selectedLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  selectedName: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  proceedButton: {
    minWidth: 240,
  },
});
