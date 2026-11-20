import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows, BorderRadius } from '../../constants/theme';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStatsApi } from '../../api/dashboardApi';
import { getSalesReportsApi } from '../../api/salesApi';
import { DashboardStats, SalesReport, KioskSummary, Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { LoadingView } from '../../components/common/LoadingView';
import { SalesBarChart } from '../../components/sales/SalesBarChart';
import { RecentTransactionCard } from '../../components/dashboard/RecentTransactionCard';
import { DigitalReceiptModal } from '../../components/common/DigitalReceiptModal';

export default function DashboardScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Kiosk switcher state
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(null); // null = All Kiosks
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);
  const [persistedKiosks, setPersistedKiosks] = useState<KioskSummary[]>([]);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);


  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, salesRes] = await Promise.allSettled([
        getDashboardStatsApi(selectedKioskId),
        getSalesReportsApi('week'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success && statsRes.value?.stats) {
        setStats(statsRes.value.stats);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value?.summary) {
        setSalesReport(salesRes.value);
      }
    } catch (err: any) {
      console.warn('[Dashboard] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedKioskId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewTx = (tx: any) => {
      const txKioskId = tx.kiosk_id || tx.kioskId;
      // Scoping check: if buyer has assigned kiosks, ignore events for unrelated machines
      if (
        user &&
        (user.role === 'buyer' || user.role === 'owner') &&
        Array.isArray(user.assignedKioskIds) &&
        user.assignedKioskIds.length > 0 &&
        txKioskId &&
        !user.assignedKioskIds.includes(txKioskId)
      ) {
        return;
      }

      console.log('[Dashboard] Live order received for assigned kiosk:', tx.order_id || tx.orderId);
      fetchStats();
    };

    const handleMachineStatus = (machineData: any) => {
      const machineKioskId = machineData.id || machineData.kiosk_id;
      if (
        user &&
        (user.role === 'buyer' || user.role === 'owner') &&
        Array.isArray(user.assignedKioskIds) &&
        user.assignedKioskIds.length > 0 &&
        machineKioskId &&
        !user.assignedKioskIds.includes(machineKioskId)
      ) {
        return;
      }

      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          machineStatus: machineData.status || prev.machineStatus,
          doorLocked: machineData.doorLocked ?? prev.doorLocked,
          waterLevelPercent: machineData.waterLevelPercent ?? prev.waterLevelPercent,
          soapLevelPercent: machineData.soapLevelPercent ?? prev.soapLevelPercent,
          machineActivity: machineData.currentActivity || prev.machineActivity,
        };
      });
    };

    socket.on('transaction:new', handleNewTx);
    socket.on('transaction:updated', handleNewTx);
    socket.on('machine:status', handleMachineStatus);

    return () => {
      socket.off('transaction:new', handleNewTx);
      socket.off('transaction:updated', handleNewTx);
      socket.off('machine:status', handleMachineStatus);
    };
  }, [socket, fetchStats, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Fleet data - persist so dropdown never disappears when selecting a single kiosk
  useEffect(() => {
    if (stats?.ownedKiosks && stats.ownedKiosks.length > 0) {
      setPersistedKiosks(stats.ownedKiosks);
    }
  }, [stats?.ownedKiosks]);

  if (loading && !stats) {
    return <LoadingView message="Loading fleet dashboard..." />;
  }

  // Show only 6 recent orders on main dashboard as requested
  const recentSixOrders = (stats?.recentTransactions || []).slice(0, 6);

  const activeKiosks = persistedKiosks.length > 0 ? persistedKiosks : (stats?.ownedKiosks || []);
  const ownedKiosks = activeKiosks;
  const hasMultipleKiosks = activeKiosks.length > 1;
  const fleetHealth = stats?.fleetHealth;

  // Label for the kiosk switcher button
  const switcherLabel = selectedKioskId
    ? (ownedKiosks.find((k) => k.id === selectedKioskId)?.name || selectedKioskId)
    : 'All Kiosks';

  // Filtered recent orders when a specific kiosk is selected
  const filteredOrders = selectedKioskId
    ? recentSixOrders.filter((t) => t.kioskId === selectedKioskId)
    : recentSixOrders;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Standard ScreenHeader: Unified with rest of the app */}
      <ScreenHeader
        title="Dashboard"
        subtitle="Operations overview & live metrics"
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
        {/* ── Plain Minimal Kiosk Selector Pill (No color / neutral) ── */}
        {hasMultipleKiosks && (
          <View style={styles.switcherWrapper}>
            <TouchableOpacity
              style={styles.switcherPill}
              onPress={() => setIsSwitcherOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="storefront-outline" size={14} color="#475569" />
              <Text style={styles.switcherLabel} numberOfLines={1}>
                {switcherLabel}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Dark Hero Card: Integrated from Payments Ledger Design */}
        <View style={styles.darkHeroCard}>
          <Text style={styles.darkHeroLabel}>
            {selectedKioskId
              ? `${switcherLabel.toUpperCase()} — REVENUE`
              : "TODAY'S REVENUE PERFORMANCE"}
          </Text>
          <Text style={styles.darkHeroAmount}>
            {formatCurrency(stats?.todayRevenue)}
          </Text>

          {/* Breakdown items */}
          <View style={styles.breakdownRows}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Verified Cleans Today</Text>
              <Text style={styles.breakdownVal}>
                {stats?.todayPaidCount ?? 0} Completed
              </Text>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Active Cleaning Cycles</Text>
              <Text style={styles.breakdownVal}>
                {stats?.activeCleansCount ?? 0} Running
                {fleetHealth && !selectedKioskId
                  ? ` (${fleetHealth.busy} kiosk${fleetHealth.busy !== 1 ? 's' : ''})`
                  : ' (Chamber 01)'}
              </Text>
            </View>

            <View style={[styles.breakdownItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.breakdownLabel}>All-Time Fleet Volume</Text>
              <Text style={styles.breakdownVal}>
                {formatCurrency(stats?.allTimeRevenue)}
              </Text>
            </View>
          </View>

          {/* Pill Action Button inside hero card */}
          <TouchableOpacity
            style={styles.heroPillBtn}
            onPress={() => router.push('/(tabs)/payments')}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={16} color="#0F172A" />
            <Text style={styles.heroPillBtnText}>View Payments Ledger & Channels</Text>
            <Ionicons name="arrow-forward" size={14} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Quick Hardware & Telemetry Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPillsRow}
        >
          <TouchableOpacity
            style={styles.quickPill}
            onPress={() => router.push('/(tabs)/machine')}
            activeOpacity={0.7}
          >
            <Ionicons name="hardware-chip-outline" size={13} color="#0284C7" />
            <Text style={styles.quickPillText}>
              Telemetry: {stats?.machineStatus?.toUpperCase() || 'ONLINE'}
            </Text>
          </TouchableOpacity>

          <View style={styles.quickPill}>
            <Ionicons name="water-outline" size={13} color="#0D9488" />
            <Text style={styles.quickPillText}>Water: {stats?.waterLevelPercent ?? 90}%</Text>
          </View>

          <View style={styles.quickPill}>
            <Ionicons name="flask-outline" size={13} color="#8B5CF6" />
            <Text style={styles.quickPillText}>Soap: {stats?.soapLevelPercent ?? 95}%</Text>
          </View>

          <View style={styles.quickPill}>
            <Ionicons
              name={stats?.doorLocked ? 'lock-closed' : 'lock-open-outline'}
              size={13}
              color={stats?.doorLocked ? '#10B981' : '#F59E0B'}
            />
            <Text style={styles.quickPillText}>
              {stats?.doorLocked ? 'Door Locked' : 'Door Unlocked'}
            </Text>
          </View>
        </ScrollView>

        {/* 7-Day Revenue Analytics Trend: Integrated from Sales Analytics Design */}
        {salesReport?.chart && (
          <View style={styles.analyticsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>7-DAY REVENUE ANALYTICS</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/sales')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>Full Analytics</Text>
              </TouchableOpacity>
            </View>

            <SalesBarChart
              labels={salesReport.chart.labels || []}
              data={salesReport.chart.datasets[0]?.data || []}
              title="Daily Revenue Trend"
            />
          </View>
        )}

        {/* Recent Orders Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedKioskId ? `ORDERS — ${switcherLabel}` : 'RECENT ORDERS (6)'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/transactions')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>
              View all ({stats?.recentTransactions?.length ?? 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders List - max 6, filtered by selected kiosk */}
        {filteredOrders.length > 0 ? (
          <>
            {filteredOrders.map((tx) => (
              <RecentTransactionCard
                key={tx.id}
                orderId={tx.orderId}
                shoeType={tx.shoeType}
                serviceName={tx.serviceName}
                totalAmount={tx.totalAmount}
                paymentMethod={tx.paymentMethod}
                paymentStatus={tx.paymentStatus}
                cleaningStatus={tx.cleaningStatus}
                createdAt={tx.createdAt}
                kioskName={hasMultipleKiosks ? tx.kioskName : undefined}
                onPress={() => setSelectedReceiptTx(tx as any)}
              />
            ))}

            {/* View More Button if fleet has more than 6 orders */}
            {stats?.recentTransactions && stats.recentTransactions.length > 6 && (
              <TouchableOpacity
                style={styles.viewMoreOrdersBtn}
                onPress={() => router.push('/(tabs)/transactions')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewMoreOrdersText}>
                  View all {stats.recentTransactions.length} orders
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#0F172A" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>
              {selectedKioskId
                ? 'No transactions for this kiosk yet.'
                : 'No transactions recorded today.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Digital Receipt Modal: Instant, No Page Reload */}
      <DigitalReceiptModal
        visible={Boolean(selectedReceiptTx)}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
      />

      {/* Kiosk Switcher Modal */}
      {hasMultipleKiosks && (
        <Modal
          visible={isSwitcherOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSwitcherOpen(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsSwitcherOpen(false)}>
            <View style={styles.switcherModal}>
              <Text style={styles.switcherModalTitle}>SELECT KIOSK VIEW</Text>

              {/* All Kiosks option */}
              <TouchableOpacity
                style={[
                  styles.switcherOption,
                  !selectedKioskId && styles.switcherOptionActive,
                ]}
                onPress={() => { setSelectedKioskId(null); setIsSwitcherOpen(false); }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="layers-outline"
                  size={18}
                  color={!selectedKioskId ? '#FFFFFF' : '#0284C7'}
                />
                <View style={styles.switcherOptionText}>
                  <Text style={[styles.switcherOptionName, !selectedKioskId && { color: '#FFFFFF' }]}>
                    All Kiosks
                  </Text>
                  <Text style={[styles.switcherOptionSub, !selectedKioskId && { color: '#94A3B8' }]}>
                    Aggregate view across {ownedKiosks.length} units
                  </Text>
                </View>
                {!selectedKioskId && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </TouchableOpacity>

              {ownedKiosks.map((kiosk) => {
                const isActive = selectedKioskId === kiosk.id;
                const statusColor =
                  kiosk.status === 'online' ? '#10B981'
                  : kiosk.status === 'busy' ? '#3B82F6'
                  : kiosk.status === 'maintenance' ? '#F59E0B'
                  : '#94A3B8';
                return (
                  <TouchableOpacity
                    key={kiosk.id}
                    style={[styles.switcherOption, isActive && styles.switcherOptionActive]}
                    onPress={() => { setSelectedKioskId(kiosk.id); setIsSwitcherOpen(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.switcherStatusDot, { backgroundColor: statusColor }]} />
                    <View style={styles.switcherOptionText}>
                      <Text style={[styles.switcherOptionName, isActive && { color: '#FFFFFF' }]} numberOfLines={1}>
                        {kiosk.name}
                      </Text>
                      <Text style={[styles.switcherOptionSub, isActive && { color: '#94A3B8' }]} numberOfLines={1}>
                        {kiosk.city || kiosk.location} • {kiosk.status}
                      </Text>
                    </View>
                    {isActive && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}
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
    paddingBottom: 110, // Extra clearance for modern bottom capsule
  },
  // ── Kiosk Switcher ──────────────────────────────────────────────────
  switcherWrapper: {
    marginBottom: Spacing.sm,
  },
  switcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  switcherLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 220,
  },
  // ── Dark Hero Card ──────────────────────────────────────────────────
  darkHeroCard: {
    backgroundColor: '#121316',
    borderRadius: BorderRadius.cardLarge,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: Spacing.md,
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
  breakdownLabel: { fontSize: 12, color: '#94A3B8' },
  breakdownVal: { fontSize: 13, fontWeight: '700', color: '#F8FAFC' },
  heroPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentLime,
    borderRadius: BorderRadius.pill,
    paddingVertical: 12,
    gap: 6,
  },
  heroPillBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  // ── Quick Pills ──────────────────────────────────────────────────────
  quickPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    ...Shadows.small,
  },
  quickPillText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  // ── Analytics & Section Headers ──────────────────────────────────────
  analyticsSection: { marginBottom: Spacing.xs },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  viewAllText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  // ── View More / Empty ────────────────────────────────────────────────
  viewMoreOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.pill,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    gap: 6,
    ...Shadows.small,
  },
  viewMoreOrdersText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.cardLarge,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Spacing.xs,
    ...Shadows.small,
  },
  emptyText: { fontSize: 13, color: '#64748B', marginTop: Spacing.sm, textAlign: 'center' },
  // ── Kiosk Switcher Modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  switcherModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.cardLarge,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.medium,
  },
  switcherModalTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  switcherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  switcherOptionActive: { backgroundColor: '#121316' },
  switcherStatusDot: { width: 8, height: 8, borderRadius: 4 },
  switcherOptionText: { flex: 1 },
  switcherOptionName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  switcherOptionSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
});
