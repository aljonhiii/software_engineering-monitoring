import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows, BorderRadius } from '../../constants/theme';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStatsApi } from '../../api/dashboardApi';
import { getSalesReportsApi } from '../../api/salesApi';
import { DashboardStats, SalesReport } from '../../types';
import { formatCurrency } from '../../utils/formatting';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { LoadingView } from '../../components/common/LoadingView';
import { SalesBarChart } from '../../components/sales/SalesBarChart';
import { RecentTransactionCard } from '../../components/dashboard/RecentTransactionCard';
import { NotificationsModal, NotificationItem } from '../../components/common/NotificationsModal';

export default function DashboardScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Dynamic system notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Order Paid & Verified',
      message: 'Order #KIX-20261109-1001 paid ₱150.00 via GCASH for Deep Clean.',
      timestamp: '59m ago',
      type: 'order',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Quick Wash Complete',
      message: 'Order #KIX-20261109-1002 cycle finished. Customer collection ready.',
      timestamp: '39m ago',
      type: 'order',
      isRead: false,
    },
    {
      id: 'notif-3',
      title: 'Hardware Telemetry Active',
      message: 'ESP32 controller heartbeat verified for Chamber 01.',
      timestamp: '2h ago',
      type: 'telemetry',
      isRead: true,
    },
    {
      id: 'notif-4',
      title: 'Reservoirs Nominal',
      message: 'Clean water is at 88% and detergent foam is at 92%.',
      timestamp: '2h ago',
      type: 'system',
      isRead: true,
    },
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, salesRes] = await Promise.allSettled([
        getDashboardStatsApi(),
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
  }, []);

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

      // Automatically add new order notification
      const orderId = tx.order_id || tx.orderId || 'NEW';
      const amount = tx.total_amount || tx.totalAmount || 0;
      const method = (tx.payment_method || tx.paymentMethod || 'CASH').toUpperCase();

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'New Verified Order',
          message: `Order #${orderId} paid ₱${amount} via ${method}.`,
          timestamp: 'Just now',
          type: 'order',
          isRead: false,
        },
        ...prev,
      ]);
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
  }, [socket, fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationPress = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setIsNotificationsOpen(false);
    if (item.type === 'order') {
      router.push('/(tabs)/transactions');
    } else if (item.type === 'telemetry') {
      router.push('/(tabs)/machine');
    }
  };

  if (loading && !stats) {
    return <LoadingView message="Loading fleet dashboard..." />;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  // Show only 6 recent orders on main dashboard as requested
  const recentSixOrders = (stats?.recentTransactions || []).slice(0, 6);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Standard ScreenHeader: Unified with rest of the app */}
      <ScreenHeader
        title="Dashboard"
        subtitle="Operations overview & live metrics"
        onRefresh={onRefresh}
        isRefreshing={refreshing}
        showNotificationBell={true}
        unreadCount={unreadCount}
        onNotificationPress={() => setIsNotificationsOpen(true)}
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
        {/* Dark Hero Card: Integrated from Payments Ledger Design */}
        <View style={styles.darkHeroCard}>
          <Text style={styles.darkHeroLabel}>{"TODAY'S REVENUE PERFORMANCE"}</Text>
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
                {stats?.activeCleansCount ?? 0} Running (Chamber 01)
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

        {/* Recent Orders Section Header (Showing 6 orders) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>RECENT ORDERS (6)</Text>
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

        {/* Recent Orders List - max 6 */}
        {recentSixOrders.length > 0 ? (
          <>
            {recentSixOrders.map((tx) => (
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
                onPress={() => router.push(`/(tabs)/transactions/${tx.orderId}` as any)}
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
            <Text style={styles.emptyText}>No transactions recorded today.</Text>
          </View>
        )}
      </ScrollView>

      {/* Interactive System Notifications Modal */}
      <NotificationsModal
        visible={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        onNotificationPress={handleNotificationPress}
      />
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
  quickPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  analyticsSection: {
    marginBottom: Spacing.xs,
  },
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
  viewAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
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
  viewMoreOrdersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
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
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: Spacing.sm,
  },
});
