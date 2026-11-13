/**
 * Step 4: Order Summary Screen
 * Displays selected shoe type, cleaning package, itemized pricing, and EDIT & CONFIRM ORDER actions.
 */

import React, { useEffect } from 'react';
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
import { PrimaryButton, ScreenHeader, Card } from '../components/common';
import { formatPrice, formatDuration } from '../utils';
import { useResponsive } from '../hooks';

export default function OrderSummaryScreen() {
  const router = useRouter();
  const {
    contentMaxWidth,
    horizontalPadding,
    summaryTwoColumn,
  } = useResponsive();
  const { state } = useOrder();

  // If user navigated directly or state was cleared, redirect safely in useEffect
  useEffect(() => {
    if (!state.selectedService) {
      router.replace('/');
    }
  }, [state.selectedService, router]);

  if (!state.selectedService) {
    return null;
  }

  const handleConfirmOrder = () => {
    router.push('/payment-method');
  };

  const handleEditOrder = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, { maxWidth: contentMaxWidth }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleEditOrder} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            <Text style={styles.backButtonText}>Edit</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Step 4 of 10: Order Summary</Text>
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
          <ScreenHeader
            title="REVIEW YOUR ORDER"
            subtitle="Please review your selected shoe category and cleaning program before confirming payment"
          />

          <View style={[styles.mainLayout, summaryTwoColumn && styles.mainLayoutRow]}>
            {/* Left Column: Itemized Receipt Card */}
            <View style={styles.column}>
              <Card style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIconWrapper}>
                    <Ionicons name="receipt-outline" size={26} color={Colors.primary} />
                  </View>
                  <View style={styles.receiptHeaderTexts}>
                    <Text style={styles.receiptTitle}>Order Breakdown</Text>
                    <Text style={styles.receiptOrderId}>Session #{state.orderId}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Selected Shoe Type Row */}
                <View style={styles.receiptItem}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemLabelSmall}>Shoe Category</Text>
                    <Text style={styles.itemName}>
                      {state.selectedShoeCategory ? state.selectedShoeCategory.name : 'Other Shoes'}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {state.selectedShoeCategory?.materialCareNote}
                    </Text>
                  </View>
                  <View style={styles.shoeBadge}>
                    <Text style={styles.shoeBadgeText}>Selected</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Base Service Row */}
                <View style={styles.receiptItem}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemLabelSmall}>Cleaning Service</Text>
                    <Text style={styles.itemName}>{state.selectedService.name}</Text>
                    <Text style={styles.itemMeta}>
                      Cycle Duration: {formatDuration(state.selectedService.durationMinutes)}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatPrice(state.selectedService.price)}
                  </Text>
                </View>

                {/* Add-ons Rows */}
                {state.selectedAddons.length > 0 && (
                  <>
                    <Text style={styles.addonsSectionLabel}>Selected Add-ons:</Text>
                    {state.selectedAddons.map((addon) => (
                      <View key={addon.id} style={styles.receiptItemSub}>
                        <View style={styles.itemLeft}>
                          <Text style={styles.subItemName}>+ {addon.name}</Text>
                          <Text style={styles.itemMeta}>{addon.description}</Text>
                        </View>
                        <Text style={styles.subItemPrice}>
                          {formatPrice(addon.price)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.divider} />

                {/* Total Calculation */}
                <View style={styles.totalRow}>
                  <View>
                    <Text style={styles.totalTitle}>Total Amount</Text>
                    <Text style={styles.totalMeta}>Automated supplies & dry cycle included</Text>
                  </View>
                  <Text style={styles.totalPriceDisplay}>
                    {formatPrice(state.totalPrice)}
                  </Text>
                </View>
              </Card>
            </View>

            {/* Right Column: Pre-cleaning Checklist & Action Buttons */}
            <View style={styles.column}>
              <Card style={styles.instructionsCard}>
                <View style={styles.instructionHeader}>
                  <Ionicons name="information-circle-outline" size={24} color={Colors.accent} />
                  <Text style={styles.instructionsTitle}>Important Reminders</Text>
                </View>

                <View style={styles.checklist}>
                  <View style={styles.checkItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    <Text style={styles.checkText}>
                      Ensure both shoes have no wet mud or loose gravel inside.
                    </Text>
                  </View>

                  <View style={styles.checkItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    <Text style={styles.checkText}>
                      Tie or tuck loose laces securely inside the shoe opening.
                    </Text>
                  </View>

                  <View style={styles.checkItem}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    <Text style={styles.checkText}>
                      Chamber door will lock magnetically once the cleaning cycle begins.
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Action Buttons: CONFIRM ORDER & EDIT */}
              <View style={styles.actionButtons}>
                <PrimaryButton
                  title="CONFIRM ORDER"
                  onPress={handleConfirmOrder}
                  size="large"
                />
                <PrimaryButton
                  title="EDIT ORDER"
                  onPress={handleEditOrder}
                  variant="outline"
                />
              </View>
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
  mainLayout: {
    flexDirection: 'column',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: Spacing.lg,
  },
  receiptCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  receiptIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptHeaderTexts: {
    flex: 1,
  },
  receiptTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  receiptOrderId: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemLabelSmall: {
    fontSize: Typography.tiny,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itemName: {
    fontSize: Typography.h4,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  itemMeta: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  shoeBadge: {
    backgroundColor: 'rgba(0, 210, 180, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  shoeBadgeText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  itemPrice: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.accent,
  },
  addonsSectionLabel: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  receiptItemSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingLeft: Spacing.xs,
  },
  subItemName: {
    fontSize: Typography.body,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  subItemPrice: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  totalMeta: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
  },
  totalPriceDisplay: {
    fontSize: Typography.hero,
    fontWeight: Typography.bold,
    color: Colors.primary,
  },
  instructionsCard: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  instructionsTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  checklist: {
    gap: Spacing.md,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkText: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    gap: Spacing.md,
  },
});
