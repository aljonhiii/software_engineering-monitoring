import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { getTransactionDetailApi } from '../../../api/transactionsApi';
import { Transaction } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatting';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { LoadingView } from '../../../components/common/LoadingView';
import { useNotifications } from '../../../context/NotificationContext';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { unreadCount, openNotifications } = useNotifications();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getTransactionDetailApi(id);
      if (res.success && res.transaction) {
        setTransaction(res.transaction);
      } else {
        setErrorMsg('Transaction could not be found.');
      }
    } catch (err: any) {
      console.warn('[TransactionDetail] Fetch error:', err.message);
      setErrorMsg(err.message || 'Failed to load receipt.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleShareReceipt = async () => {
    if (!transaction) return;
    try {
      await Share.share({
        title: `Receipt #${transaction.orderId}`,
        message: `KIXCLEEN OFFICIAL RECEIPT\nOrder: #${transaction.orderId}\nKiosk: ${transaction.kioskName || transaction.kioskId}\nService: ${transaction.serviceName} (${transaction.shoeType})\nTotal: ${formatCurrency(transaction.totalAmount)}\nStatus: ${transaction.paymentStatus.toUpperCase()}\nRef: ${transaction.paymentRef || 'Cash'}\nDate: ${formatDate(transaction.createdAt)}`,
      });
    } catch (err: any) {
      console.warn('Share error:', err.message);
    }
  };

  if (loading) {
    return <LoadingView message="Loading digital receipt..." />;
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
          <Text style={styles.errorTitle}>Receipt Not Found</Text>
          <Text style={styles.errorSub}>{errorMsg || 'Unable to retrieve transaction details.'}</Text>
          <TouchableOpacity style={styles.errorBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            <Text style={styles.errorBackBtnText}>Back to Transactions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = transaction.basePrice + (transaction.addonsPrice || 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#0F172A" />
          <Text style={styles.backText}>Transactions</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Digital Receipt</Text>
        <View style={styles.navRightActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShareReceipt}
            activeOpacity={0.7}
            accessibilityLabel="Share Receipt"
          >
            <Ionicons name="share-outline" size={18} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={openNotifications}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color="#0F172A" />
            {unreadCount > 0 ? (
              <View style={styles.bellBadgeCount}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Receipt Container */}
        <View style={styles.receiptContainer}>
          {/* Receipt Top Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.brandTitle}>KIXCLEEN</Text>
            <Text style={styles.brandSubtitle}>AUTOMATED SHOE CARE SYSTEM</Text>
            <View style={styles.receiptTypePill}>
              <Text style={styles.receiptTypePillText}>OFFICIAL RECEIPT</Text>
            </View>
          </View>

          {/* Order ID & Time */}
          <View style={styles.receiptMetaBlock}>
            <Text style={styles.orderIdLabel}>RECEIPT / ORDER ID</Text>
            <Text style={styles.orderIdValue}>#{transaction.orderId}</Text>
            <Text style={styles.dateValue}>{formatDate(transaction.createdAt)}</Text>
          </View>

          {/* Dashed Separator */}
          <View style={styles.dashedDivider} />

          {/* Kiosk Terminal Information */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTag}>TERMINAL CONTEXT</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Kiosk Machine</Text>
              <Text style={styles.receiptValueBold}>
                {transaction.kioskName || transaction.kioskId}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Terminal ID</Text>
              <Text style={[styles.receiptValue, styles.monoText]}>
                {transaction.kioskId}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Location</Text>
              <Text style={styles.receiptValue}>
                {transaction.kioskLocation || 'Ground Floor Lobby'}
              </Text>
            </View>
          </View>

          {/* Dashed Separator */}
          <View style={styles.dashedDivider} />

          {/* Cleaning Service Specifications */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTag}>CLEANING SPECIFICATIONS</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Shoe Category</Text>
              <Text style={styles.receiptValueBold}>{transaction.shoeType}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Cleaning Service</Text>
              <Text style={styles.receiptValueBold}>{transaction.serviceName}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Base Service Price</Text>
              <Text style={styles.receiptValue}>{formatCurrency(transaction.basePrice)}</Text>
            </View>

            {/* Add-ons itemization */}
            {transaction.addons && transaction.addons.length > 0 && (
              <View style={styles.addonsListBlock}>
                <Text style={styles.addonsHeading}>Selected Add-ons:</Text>
                {transaction.addons.map((addon, idx) => (
                  <View key={idx} style={styles.addonItemRow}>
                    <Text style={styles.addonItemName}>+ {addon.name}</Text>
                    <Text style={styles.addonItemPrice}>+{formatCurrency(addon.price)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.receiptRow, { marginTop: 6 }]}>
              <Text style={styles.receiptLabel}>Subtotal</Text>
              <Text style={styles.receiptValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Convenience / Platform Fee</Text>
              <Text style={styles.receiptValue}>₱0.00</Text>
            </View>
          </View>

          {/* Double Dashed Separator for Total */}
          <View style={styles.doubleDashedDivider} />

          {/* Total Paid Block */}
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT PAID</Text>
            <Text style={styles.totalValue}>{formatCurrency(transaction.totalAmount)}</Text>
          </View>

          {/* Double Dashed Separator */}
          <View style={styles.doubleDashedDivider} />

          {/* Payment & Wash Cycle Audit */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTag}>PAYMENT & AUDIT VERIFICATION</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Channel</Text>
              <Text style={styles.receiptValueBold}>
                {transaction.paymentMethod.toUpperCase()}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Payment Status</Text>
              <StatusBadge status={transaction.paymentStatus} type="payment" size="sm" />
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Reference No.</Text>
              <Text style={[styles.receiptValue, styles.monoText]}>
                {transaction.paymentRef || 'N/A (Cash Deposit)'}
              </Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Wash Cycle Status</Text>
              <StatusBadge status={transaction.cleaningStatus} type="cleaning" size="sm" />
            </View>
            {transaction.completedAt && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Cycle Finished</Text>
                <Text style={styles.receiptValue}>{formatDate(transaction.completedAt)}</Text>
              </View>
            )}
          </View>

          {/* Dashed Separator */}
          <View style={styles.dashedDivider} />

          {/* Receipt Footer / Barcode Effect */}
          <View style={styles.receiptFooter}>
            <Text style={styles.barcodeText}>
              * K I X - {transaction.orderId.replace(/[^0-9]/g, '').slice(-8) || '20261109'} *
            </Text>
            <Text style={styles.footerNote}>
              Thank you for trusting KixCleen Automated Shoe Care!
            </Text>
            <Text style={styles.footerSubNote}>
              Automated telemetry recorded • Valid audit proof
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
    backgroundColor: '#F1F5F9',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 100,
  },
  backText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    width: 100,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeCount: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 60,
    alignItems: 'center',
  },
  receiptContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.cardLarge,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.medium,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#64748B',
    marginTop: 2,
  },
  receiptTypePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    marginTop: 8,
  },
  receiptTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.5,
  },
  receiptMetaBlock: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  orderIdValue: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dateValue: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: Spacing.md,
  },
  doubleDashedDivider: {
    borderBottomWidth: 2,
    borderColor: '#0F172A',
    borderStyle: 'dashed',
    marginVertical: Spacing.md,
  },
  sectionBlock: {
    gap: 7,
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  receiptValue: {
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'right',
  },
  receiptValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  monoText: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  addonsListBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: 4,
    marginBottom: 4,
    gap: 4,
  },
  addonsHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  addonItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 6,
  },
  addonItemName: {
    fontSize: 11,
    color: '#64748B',
  },
  addonItemPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  totalBlock: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    gap: 4,
  },
  barcodeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 4,
    color: '#94A3B8',
    fontWeight: '600',
    marginVertical: 4,
  },
  footerNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  footerSubNote: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: Spacing.sm,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
  },
  errorBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.md,
  },
  errorBackBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
