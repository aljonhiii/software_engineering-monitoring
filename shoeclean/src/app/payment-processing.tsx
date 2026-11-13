/**
 * Step 6: Payment Processing Screen
 * Integrates Xendit Sandbox (Dynamic QR Ph / GCash / Maya) for digital payments,
 * alongside hardware simulation for Coin Slot and Bill Acceptor cash inputs.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  AppConfig,
} from '../constants';
import { useOrder } from '../store/orderStore';
import { PrimaryButton, ErrorBanner, Card } from '../components/common';
import { formatPrice } from '../utils';
import {
  processPayment,
  createDigitalPayment,
  checkPaymentStatus,
  simulateCustomerScanAndPay,
  recordKioskTransaction,
  sendKioskHeartbeat,
} from '../services';
import { DigitalPaymentDetails } from '../types';
import { useResponsive } from '../hooks';

export default function PaymentProcessingScreen() {
  const router = useRouter();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const { state, dispatch } = useOrder();

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingChannel, setVerifyingChannel] = useState<string>('Gateway');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const method = state.paymentMethod || 'coins';
  const totalPrice = state.totalPrice;

  // Cash accumulator for coins or bills
  const [cashInserted, setCashInserted] = useState<number>(0);
  const remainingCash = Math.max(0, totalPrice - cashInserted);

  // Digital Xendit Sandbox State
  const [digitalDetails, setDigitalDetails] = useState<DigitalPaymentDetails | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(method === 'ewallet');
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    AppConfig.xendit.qrExpirySeconds
  );
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handlePaymentSuccess = useCallback(
    (sourceId: string) => {
      stopPolling();
      stopCountdown();
      const txId = `pm_${sourceId}`;
      dispatch({
        type: 'SET_PAYMENT_STATUS',
        status: 'completed',
        transactionId: txId,
      });

      // Synchronize order with KixCleen Monitoring Platform
      recordKioskTransaction({
        orderId: state.orderId,
        shoeCategory: state.selectedShoeCategory,
        service: state.selectedService,
        addons: state.selectedAddons,
        totalPrice: state.totalPrice,
        paymentMethod: state.paymentMethod,
        transactionId: txId,
        channel: 'QR Ph',
      });
      sendKioskHeartbeat({
        doorLocked: false,
        currentOrderId: state.orderId,
        currentActivity: `Order #${state.orderId} paid via Dynamic QR Ph. Chamber reserved.`,
      });

      router.replace('/payment-confirmation');
    },
    [dispatch, router, state, stopCountdown, stopPolling]
  );

  const initDigitalPayment = useCallback(async () => {
    stopPolling();
    stopCountdown();

    try {
      const details = await createDigitalPayment(totalPrice, state.orderId);
      setDigitalDetails(details);
      setErrorMessage(null);
      setIsLoadingQr(false);
      setCountdownSeconds(AppConfig.xendit.qrExpirySeconds);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            stopPolling();
            stopCountdown();
            setErrorMessage('Payment session expired. Please generate a new QR code.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling status
      pollingRef.current = setInterval(async () => {
        const { isPaid } = await checkPaymentStatus(details.sourceId);
        if (isPaid) {
          handlePaymentSuccess(details.sourceId);
        }
      }, AppConfig.xendit.pollingIntervalMs);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize Xendit sandbox session.');
      setIsLoadingQr(false);
    }
  }, [handlePaymentSuccess, state.orderId, stopCountdown, stopPolling, totalPrice]);

  // Initialize Digital Payment when method is ewallet
  useEffect(() => {
    let isCancelled = false;

    if (method === 'ewallet') {
      const timer = setTimeout(() => {
        if (!isCancelled) {
          initDigitalPayment();
        }
      }, 0);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
        stopPolling();
        stopCountdown();
      };
    }

    return () => {
      stopPolling();
      stopCountdown();
    };
  }, [initDigitalPayment, method, stopCountdown, stopPolling]);

  const handleSimulateInstantPay = async (channel: 'GCash' | 'Maya' | 'QR Ph' = 'QR Ph') => {
    if (!digitalDetails) return;
    setVerifyingChannel(channel);
    setIsVerifying(true);
    dispatch({ type: 'SET_PAYMENT_STATUS', status: 'processing' });

    try {
      const result = await simulateCustomerScanAndPay(
        digitalDetails.sourceId,
        totalPrice,
        channel
      );
      if (result.success) {
        stopPolling();
        stopCountdown();
        dispatch({
          type: 'SET_PAYMENT_STATUS',
          status: 'completed',
          transactionId: result.transactionId,
        });

        // Synchronize order with KixCleen Monitoring Platform
        recordKioskTransaction({
          orderId: state.orderId,
          shoeCategory: state.selectedShoeCategory,
          service: state.selectedService,
          addons: state.selectedAddons,
          totalPrice: state.totalPrice,
          paymentMethod: 'ewallet',
          transactionId: result.transactionId,
          channel,
        });
        sendKioskHeartbeat({
          doorLocked: false,
          currentOrderId: state.orderId,
          currentActivity: `Order #${state.orderId} paid ₱${state.totalPrice} via ${channel}`,
        });

        router.replace('/payment-confirmation');
      } else {
        setErrorMessage(result.message);
        dispatch({ type: 'SET_PAYMENT_STATUS', status: 'failed' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation encountered an error.');
      dispatch({ type: 'SET_PAYMENT_STATUS', status: 'failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInsertCash = (amount: number) => {
    const updated = cashInserted + amount;
    setCashInserted(updated);

    if (updated >= totalPrice) {
      handleVerifyCashPayment();
    }
  };

  const handleVerifyCashPayment = async () => {
    setIsVerifying(true);
    setErrorMessage(null);
    dispatch({ type: 'SET_PAYMENT_STATUS', status: 'processing' });

    try {
      const result = await processPayment(totalPrice, method);

      if (result.success) {
        dispatch({
          type: 'SET_PAYMENT_STATUS',
          status: 'completed',
          transactionId: result.transactionId,
        });

        // Synchronize cash transaction with KixCleen Monitoring Platform
        const channelName = method === 'coins' ? 'Coin Slot' : 'Bill Acceptor';
        recordKioskTransaction({
          orderId: state.orderId,
          shoeCategory: state.selectedShoeCategory,
          service: state.selectedService,
          addons: state.selectedAddons,
          totalPrice: state.totalPrice,
          paymentMethod: method,
          transactionId: result.transactionId,
          channel: channelName,
        });
        sendKioskHeartbeat({
          doorLocked: false,
          currentOrderId: state.orderId,
          currentActivity: `Order #${state.orderId} paid ₱${state.totalPrice} via ${channelName}`,
        });

        router.replace('/payment-confirmation');
      } else {
        setErrorMessage(result.message);
        dispatch({ type: 'SET_PAYMENT_STATUS', status: 'failed' });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment communication timed out. Please retry.');
      dispatch({ type: 'SET_PAYMENT_STATUS', status: 'failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isVerifying}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            <Text style={styles.backButtonText}>Change Method</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step 6 of 10: Payment Processing</Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace('/')}
            disabled={isVerifying}
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
          {/* Amount Due Header Card */}
          <View style={styles.amountBanner}>
            <Text style={styles.amountLabel}>Total Amount Due</Text>
            <Text style={styles.amountValue}>{formatPrice(totalPrice)}</Text>
            <Text style={styles.amountNote}>
              Channel: {method.toUpperCase()} • {state.selectedShoeCategory?.name} (
              {state.selectedService?.name})
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorArea}>
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
              />
              <View style={styles.recoveryButtonsRow}>
                {method === 'ewallet' ? (
                  <PrimaryButton
                    title="Generate New QR"
                    onPress={() => {
                      setIsLoadingQr(true);
                      initDigitalPayment();
                    }}
                    variant="primary"
                    style={styles.recoveryBtn}
                  />
                ) : (
                  <PrimaryButton
                    title="Retry Cash Verification"
                    onPress={handleVerifyCashPayment}
                    variant="primary"
                    style={styles.recoveryBtn}
                  />
                )}
                <PrimaryButton
                  title="Choose Other Method"
                  onPress={() => router.back()}
                  variant="outline"
                  style={styles.recoveryBtn}
                />
              </View>
            </View>
          )}

          {/* Interactive Simulation Container */}
          <Card style={styles.simCard}>
            {isVerifying ? (
              <View style={styles.verifyingContainer}>
                <View style={styles.spinnerCircle}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
                <Text style={styles.verifyingTitle}>
                  Verifying {verifyingChannel} Payment...
                </Text>
                <Text style={styles.verifyingSubtitle}>
                  Validating authentication token and confirming receipt of funds with the kiosk.
                </Text>
                <View style={styles.pulseBar}>
                  <View style={styles.pulseInner} />
                </View>
              </View>
            ) : method === 'ewallet' ? (
              <View style={styles.ewalletContainer}>
                {/* Sandbox Header Badge */}
                <View style={styles.sandboxBadge}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#0284C7" />
                  <Text style={styles.sandboxBadgeText}>KIOSK SECURE PAYMENT MODE</Text>
                </View>

                <Text style={styles.simSectionTitle}>Scan Dynamic QR Ph</Text>
                <Text style={styles.qrHint}>
                  Accepts GCash, Maya, ShopeePay, GrabPay, and QR Ph banking apps
                </Text>

                {isLoadingQr ? (
                  <View style={styles.qrLoadingBox}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.qrLoadingText}>Generating Kiosk QR Code...</Text>
                  </View>
                ) : digitalDetails ? (
                  <View style={styles.qrOuterWrapper}>
                    <View style={styles.qrBox}>
                      <QRCode
                        value={digitalDetails.qrPayload || digitalDetails.checkoutUrl || 'https://xendit.co'}
                        size={190}
                        color="#0F172A"
                        backgroundColor="#FFFFFF"
                      />
                    </View>

                    {/* Meta Info */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Ref No.</Text>
                        <Text style={styles.metaValue}>{digitalDetails.referenceNumber}</Text>
                      </View>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Expires In</Text>
                        <Text
                          style={[
                            styles.metaValue,
                            countdownSeconds < 60 && styles.metaValueUrgent,
                          ]}
                        >
                          {formatCountdown(countdownSeconds)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Polling Live Indicator */}
                <View style={styles.liveStatusRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.liveStatusText}>
                    Awaiting scan from mobile wallet...
                  </Text>
                </View>

                {/* Live Action Bar */}
                <View style={styles.sandboxActionsContainer}>
                  {digitalDetails?.checkoutUrl && (
                    <TouchableOpacity
                      style={styles.openCheckoutBtn}
                      onPress={() => {
                        if (digitalDetails.checkoutUrl) {
                          Linking.openURL(digitalDetails.checkoutUrl);
                        }
                      }}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.openCheckoutBtnText}>
                        Open Xendit Test Checkout (GCash / Maya)
                      </Text>
                    </TouchableOpacity>
                  )}

                  <PrimaryButton
                    title="Simulate Customer QR Scan & Pay"
                    onPress={() => handleSimulateInstantPay('QR Ph')}
                    size="large"
                    variant="outline"
                    style={styles.fullWidthBtn}
                  />

                  <Text style={styles.sandboxNote}>
                    💡 Tap above to open Xendit’s hosted checkout. Completing payment there will officially update your Xendit Transactions dashboard!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.cashContainer}>
                <Text style={styles.simSectionTitle}>
                  {method === 'coins' ? 'Coin Slot Feeder' : 'Bill Acceptor Slot'}
                </Text>

                <View style={styles.cashTally}>
                  <Text style={styles.tallyLabel}>Cash Inserted</Text>
                  <Text style={styles.tallyValue}>{formatPrice(cashInserted)}</Text>
                  <Text style={styles.tallySub}>
                    {remainingCash > 0
                      ? `Insert ${formatPrice(remainingCash)} more to activate machine`
                      : 'Amount received! Verifying...'}
                  </Text>
                </View>

                <Text style={styles.insertPrompt}>
                  Tap below to simulate physical cash insertion:
                </Text>

                <View style={styles.denomRow}>
                  {method === 'coins' ? (
                    <>
                      <TouchableOpacity
                        style={styles.denomBtn}
                        onPress={() => handleInsertCash(5)}
                      >
                        <Text style={styles.denomText}>+ ₱5 Coin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.denomBtn}
                        onPress={() => handleInsertCash(10)}
                      >
                        <Text style={styles.denomText}>+ ₱10 Coin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.denomBtn}
                        onPress={() => handleInsertCash(20)}
                      >
                        <Text style={styles.denomText}>+ ₱20 Coin</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.denomBtn}
                        onPress={() => handleInsertCash(20)}
                      >
                        <Text style={styles.denomText}>+ ₱20 Bill</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.denomBtn}
                        onPress={() => handleInsertCash(50)}
                      >
                        <Text style={styles.denomText}>+ ₱50 Bill</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.denomBtn}
                        onPress={() => handleInsertCash(100)}
                      >
                        <Text style={styles.denomText}>+ ₱100 Bill</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.exactBtn}
                  onPress={() => handleInsertCash(totalPrice)}
                >
                  <Text style={styles.exactBtnText}>
                    Insert Exact Total ({formatPrice(totalPrice)})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
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
    paddingBottom: Spacing.xxl,
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
    marginBottom: Spacing.lg,
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
  amountNote: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  errorArea: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  recoveryButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  recoveryBtn: {
    flex: 1,
  },
  simCard: {
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
    ...Shadows.card,
  },
  simSectionTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  verifyingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  spinnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  verifyingTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 380,
  },
  pulseBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  pulseInner: {
    width: '60%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  ewalletContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sandboxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  sandboxBadgeText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  qrHint: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 380,
  },
  qrOuterWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Shadows.medium,
  },
  qrLoadingBox: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  qrLoadingText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: Typography.medium,
  },
  metaValue: {
    fontSize: Typography.caption,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  metaValueUrgent: {
    color: Colors.error,
  },
  metaDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#CBD5E1',
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.md,
  },
  liveStatusText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  sandboxActionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  openCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: '#0284C7',
    ...Shadows.small,
  },
  openCheckoutBtnText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
  },
  fullWidthBtn: {
    width: '100%',
  },
  sandboxNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  cashContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  cashTally: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    width: '100%',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tallyLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  tallyValue: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginVertical: 4,
  },
  tallySub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  insertPrompt: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  denomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  denomBtn: {
    backgroundColor: '#F8FAFC',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 100,
    alignItems: 'center',
  },
  denomText: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  exactBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    marginTop: Spacing.xs,
  },
  exactBtnText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
});
