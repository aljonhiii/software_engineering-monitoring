import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { getPaymentsLedgerApi, PaymentItem } from '../../../api/paymentsApi';
import { PaymentsLedgerSummary } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatting';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { LoadingView } from '../../../components/common/LoadingView';

export default function PaymentsScreen() {
  const [summary, setSummary] = useState<PaymentsLedgerSummary | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await getPaymentsLedgerApi();
      if (res.success) {
        setSummary(res.summary);
        setPayments(res.payments);
      }
    } catch (err: any) {
      console.warn('[Payments] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  if (loading && !summary) {
    return <LoadingView message="Loading payment ledger..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Payments"
        subtitle="Revenue reconciliation & ledger"
        onRefresh={onRefresh}
        isRefreshing={refreshing}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Dark Hero Card (inspired by Payments screen in reference) */}
        <View style={styles.darkHeroCard}>
          <Text style={styles.darkHeroLabel}>TOTAL SETTLED VOLUME</Text>
          <Text style={styles.darkHeroAmount}>
            {formatCurrency(summary?.totalCollected)}
          </Text>

          {/* Breakdown items */}
          <View style={styles.breakdownRows}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>GCash Channels</Text>
              <Text style={styles.breakdownVal}>
                {formatCurrency(summary?.methodsSummary.gcash.amount)}
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Maya Channels</Text>
              <Text style={styles.breakdownVal}>
                {formatCurrency(summary?.methodsSummary.maya.amount)}
              </Text>
            </View>

            <View style={[styles.breakdownItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.breakdownLabel}>Cash Deposits</Text>
              <Text style={styles.breakdownVal}>
                {formatCurrency(summary?.methodsSummary.cash.amount)}
              </Text>
            </View>
          </View>

          {/* Pill Action Button inside hero card */}
          <View style={styles.heroPillBtn}>
            <Ionicons name="checkmark-circle" size={16} color="#0F172A" />
            <Text style={styles.heroPillBtnText}>
              {summary?.successfulCount ?? 0} Verified Transactions
            </Text>
          </View>
        </View>

        {/* Payment Channels Section */}
        <Text style={styles.sectionHeader}>PAYMENT METHOD CHANNELS</Text>
        <View style={styles.methodsColumn}>
          {/* GCash */}
          <View style={styles.methodCardRow}>
            <View style={styles.methodLeftCol}>
              <View style={[styles.methodIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.methodName}>GCash Payment</Text>
                <Text style={styles.methodSub}>
                  {summary?.methodsSummary.gcash.count ?? 0} transactions processed
                </Text>
              </View>
            </View>
            <View style={styles.methodRightCol}>
              <Text style={styles.methodAmount}>
                {formatCurrency(summary?.methodsSummary.gcash.amount)}
              </Text>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Maya */}
          <View style={styles.methodCardRow}>
            <View style={styles.methodLeftCol}>
              <View style={[styles.methodIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="qr-code-outline" size={18} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.methodName}>Maya Wallet</Text>
                <Text style={styles.methodSub}>
                  {summary?.methodsSummary.maya.count ?? 0} transactions processed
                </Text>
              </View>
            </View>
            <View style={styles.methodRightCol}>
              <Text style={styles.methodAmount}>
                {formatCurrency(summary?.methodsSummary.maya.amount)}
              </Text>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Cash */}
          <View style={styles.methodCardRow}>
            <View style={styles.methodLeftCol}>
              <View style={[styles.methodIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash-outline" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.methodName}>Cash / Coins</Text>
                <Text style={styles.methodSub}>
                  {summary?.methodsSummary.cash.count ?? 0} transactions processed
                </Text>
              </View>
            </View>
            <View style={styles.methodRightCol}>
              <Text style={styles.methodAmount}>
                {formatCurrency(summary?.methodsSummary.cash.amount)}
              </Text>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Payment Logs */}
        <Text style={styles.sectionHeader}>VERIFIED LEDGER</Text>
        {payments.map((p) => (
          <View key={p.id} style={styles.paymentRowCard}>
            <View style={styles.paymentLeft}>
              <View style={styles.orderRefRow}>
                <Text style={styles.paymentOrder}>#{p.orderId}</Text>
                <Text style={styles.paymentMethodTag}>{p.paymentMethod.toUpperCase()}</Text>
              </View>
              <Text style={styles.paymentRef}>
                Ref: {p.paymentRef || 'Cash Deposit'}
              </Text>
              <Text style={styles.paymentDate}>{formatDate(p.createdAt)}</Text>
            </View>

            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
              <StatusBadge status={p.paymentStatus} type="payment" size="sm" />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110, // Extra clearance for floating dock
  },
  darkHeroCard: {
    backgroundColor: '#121316',
    borderRadius: BorderRadius.cardLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  darkHeroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  darkHeroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 6,
    letterSpacing: -0.5,
  },
  breakdownRows: {
    marginTop: 10,
    marginBottom: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  heroPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentLime,
    borderRadius: BorderRadius.pill,
    paddingVertical: 12,
    gap: 6,
  },
  heroPillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  methodsColumn: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  methodCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    padding: Spacing.md,
    ...Shadows.small,
  },
  methodLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  methodSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  methodRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  paymentLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  paymentOrder: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  paymentMethodTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },
  paymentRef: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  paymentDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
});
