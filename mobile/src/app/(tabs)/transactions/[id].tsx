import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { getTransactionDetailApi } from '../../../api/transactionsApi';
import { Transaction } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatting';
import { Card } from '../../../components/common/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { LoadingView } from '../../../components/common/LoadingView';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getTransactionDetailApi(id);
      if (res.success && res.transaction) {
        setTransaction(res.transaction);
      }
    } catch (err: any) {
      console.warn('[TransactionDetail] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading || !transaction) {
    return <LoadingView message="Loading transaction audit details..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#0F172A" />
          <Text style={styles.backText}>Transactions</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Transaction Audit</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Summary Card */}
        <Card style={styles.headerCard}>
          <View style={styles.orderIdRow}>
            <View>
              <Text style={styles.orderIdLabel}>TRANSACTION REFERENCE</Text>
              <Text style={styles.orderIdValue}>#{transaction.orderId}</Text>
            </View>
            <StatusBadge status={transaction.paymentStatus} type="payment" size="md" />
          </View>

          <Text style={styles.totalAmountValue}>
            {formatCurrency(transaction.totalAmount)}
          </Text>

          <View style={styles.divider} />

          <View style={styles.statusPillsRow}>
            <View style={styles.statusCol}>
              <Text style={styles.miniLabel}>PAYMENT METHOD</Text>
              <Text style={styles.miniVal}>{transaction.paymentMethod.toUpperCase()}</Text>
            </View>
            <View style={styles.statusCol}>
              <Text style={styles.miniLabel}>CLEANING CYCLE</Text>
              <StatusBadge status={transaction.cleaningStatus} type="cleaning" size="sm" />
            </View>
          </View>
        </Card>

        {/* Shoe & Service Specs */}
        <Text style={styles.sectionHeader}>SERVICE SPECIFICATIONS</Text>
        <Card style={styles.detailsCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Shoe Type</Text>
            <Text style={styles.specValue}>{transaction.shoeType}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Service Tier</Text>
            <Text style={styles.specValue}>{transaction.serviceName}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Base Service Price</Text>
            <Text style={styles.specValue}>{formatCurrency(transaction.basePrice)}</Text>
          </View>

          {transaction.addons && transaction.addons.length > 0 && (
            <>
              <View style={styles.subDivider} />
              <Text style={styles.addonsHeader}>Selected Add-ons:</Text>
              {transaction.addons.map((addon, idx) => (
                <View key={idx} style={styles.addonItemRow}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>+{formatCurrency(addon.price)}</Text>
                </View>
              ))}
            </>
          )}
        </Card>

        {/* Audit & Kiosk Machine Information */}
        <Text style={styles.sectionHeader}>MACHINE AUDIT & LOCATION</Text>
        <Card style={styles.detailsCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Kiosk Machine</Text>
            <Text style={styles.specValue}>
              {transaction.kioskName || transaction.kioskId}
            </Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Location</Text>
            <Text style={styles.specValue}>
              {transaction.kioskLocation || 'Ground Floor Lobby'}
            </Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Payment Reference</Text>
            <Text style={[styles.specValue, styles.monoValue]}>
              {transaction.paymentRef || 'N/A (Cash)'}
            </Text>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Order Created</Text>
            <Text style={styles.specValue}>{formatDate(transaction.createdAt)}</Text>
          </View>

          {transaction.completedAt && (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Cycle Completed</Text>
              <Text style={styles.specValue}>{formatDate(transaction.completedAt)}</Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  orderIdValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  totalAmountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: Spacing.md,
  },
  statusPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusCol: {
    gap: 4,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  miniVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  detailsCard: {
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.small,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  specValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  monoValue: {
    fontFamily: 'monospace',
    color: '#0284C7',
  },
  subDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.sm,
  },
  addonsHeader: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  addonItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  addonName: {
    fontSize: 13,
    color: '#334155',
  },
  addonPrice: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
});
