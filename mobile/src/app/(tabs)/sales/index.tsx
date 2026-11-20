import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { getSalesReportsApi } from '../../../api/salesApi';
import { getMachineStatusApi } from '../../../api/machineApi';
import { SalesReport, KioskMachine } from '../../../types';
import { formatCurrency } from '../../../utils/formatting';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { Card } from '../../../components/common/Card';
import { SalesBarChart } from '../../../components/sales/SalesBarChart';
import { LoadingView } from '../../../components/common/LoadingView';

export default function SalesScreen() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Kiosk filter state
  const [kiosks, setKiosks] = useState<KioskMachine[]>([]);
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(null); // null = All Kiosks
  const [isKioskPickerOpen, setIsKioskPickerOpen] = useState<boolean>(false);

  // Fetch available kiosks for filtering
  useEffect(() => {
    let isMounted = true;
    getMachineStatusApi()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.kiosks)) {
          setKiosks(res.kiosks);
        }
      })
      .catch((err) => console.warn('[Sales] Kiosks load error:', err.message));
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await getSalesReportsApi(period, selectedKioskId);
      if (res && res.summary) {
        setReport(res);
      }
    } catch (err: any) {
      console.warn('[Sales] Error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, selectedKioskId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const selectedKioskName = selectedKioskId
    ? (kiosks.find((k) => k.id === selectedKioskId)?.name || selectedKioskId)
    : 'All Kiosks';

  if (loading && !report) {
    return <LoadingView message="Calculating revenue and sales analytics..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Sales & Analytics"
        subtitle="Business performance & revenue reports"
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
        {/* Plain Kiosk Dropdown Filter Button (No color) */}
        {kiosks.length > 1 && (
          <View style={styles.kioskFilterRow}>
            <TouchableOpacity
              style={styles.kioskDropdownBtn}
              onPress={() => setIsKioskPickerOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.kioskDropdownLeft}>
                <Ionicons name="storefront-outline" size={14} color="#475569" />
                <Text style={styles.kioskDropdownLabel} numberOfLines={1} ellipsizeMode="tail">
                  {selectedKioskName}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>
            {selectedKioskId && (
              <TouchableOpacity
                style={styles.clearKioskFilterBtn}
                onPress={() => setSelectedKioskId(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={13} color="#64748B" />
                <Text style={styles.clearKioskFilterText}>All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Period Selector Tabs */}
        <View style={styles.periodRow}>
          {(['day', 'week', 'month'] as const).map((p) => {
            const isSelected = period === p;
            const label = p === 'day' ? 'Today' : p === 'week' ? 'Past 7 Days' : 'Past 30 Days';
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodTab, isSelected && styles.periodTabActive]}
                onPress={() => setPeriod(p)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isSelected && styles.periodTabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Revenue Performance Chart */}
        <SalesBarChart
          labels={report?.chart.labels || []}
          data={report?.chart.datasets[0]?.data || []}
          title={`Revenue (${period === 'day' ? 'Today' : period === 'week' ? '7-Day Trend' : '30-Day Trend'})`}
        />

        {/* Summary Metric Cards */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <Text style={styles.sumLabel}>TOTAL REVENUE</Text>
            <Text style={styles.sumAmount}>
              {formatCurrency(report?.summary.totalRevenue)}
            </Text>
            <Text style={styles.sumSub}>{report?.summary.totalOrders ?? 0} paid cleans</Text>
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.sumLabel}>AVG ORDER VALUE</Text>
            <Text style={styles.sumAmount}>
              {formatCurrency(report?.summary.averageOrderValue)}
            </Text>
            <Text style={styles.sumSub}>Per customer session</Text>
          </Card>
        </View>

        {/* Popular Shoe Categories Breakdown */}
        <Text style={styles.sectionHeader}>SHOE CATEGORIES BREAKDOWN</Text>
        <Card style={styles.breakdownCard}>
          {report?.breakdowns.byShoeType &&
          Object.keys(report.breakdowns.byShoeType).length > 0 ? (
            Object.entries(report.breakdowns.byShoeType).map(([shoe, count]) => {
              const pct = report.summary.totalOrders > 0
                ? Math.round((count / report.summary.totalOrders) * 100)
                : 0;

              return (
                <View key={shoe} style={styles.breakdownItem}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName}>{shoe}</Text>
                    <Text style={styles.itemCount}>
                      {count} pairs ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.itemTrack}>
                    <View style={[styles.itemFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No shoe category data recorded.</Text>
          )}
        </Card>

        {/* Popular Services Breakdown */}
        <Text style={styles.sectionHeader}>SERVICE TIER PREFERENCES</Text>
        <Card style={styles.breakdownCard}>
          {report?.breakdowns.byService &&
          Object.keys(report.breakdowns.byService).length > 0 ? (
            Object.entries(report.breakdowns.byService).map(([srv, count]) => {
              const pct = report.summary.totalOrders > 0
                ? Math.round((count / report.summary.totalOrders) * 100)
                : 0;

              return (
                <View key={srv} style={styles.breakdownItem}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName}>{srv}</Text>
                    <Text style={styles.itemCount}>
                      {count} orders ({pct}%)
                    </Text>
                  </View>
                  <View style={styles.itemTrack}>
                    <View
                      style={[
                        styles.itemFill,
                        { width: `${pct}%`, backgroundColor: '#0284C7' },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No service data recorded.</Text>
          )}
        </Card>
      </ScrollView>

      {/* Kiosk Selection Modal */}
      <Modal
        visible={isKioskPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsKioskPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsKioskPickerOpen(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>FILTER BY KIOSK</Text>

            {/* All Kiosks (Default) */}
            <TouchableOpacity
              style={[
                styles.pickerOption,
                !selectedKioskId && styles.pickerOptionActive,
              ]}
              onPress={() => {
                setSelectedKioskId(null);
                setIsKioskPickerOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="layers-outline"
                size={18}
                color={!selectedKioskId ? '#0F172A' : '#64748B'}
              />
              <View style={styles.pickerOptionInfo}>
                <Text
                  style={[
                    styles.pickerOptionName,
                    !selectedKioskId && styles.pickerOptionTextActive,
                  ]}
                >
                  All Kiosks (Aggregate)
                </Text>
                <Text style={styles.pickerOptionSub}>
                  Combined revenue across {kiosks.length} units
                </Text>
              </View>
              {!selectedKioskId && (
                <Ionicons name="checkmark-circle" size={18} color="#0F172A" />
              )}
            </TouchableOpacity>

            {/* Individual Kiosks */}
            {kiosks.map((k) => {
              const isSelected = selectedKioskId === k.id;
              return (
                <TouchableOpacity
                  key={k.id}
                  style={[
                    styles.pickerOption,
                    isSelected && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedKioskId(k.id);
                    setIsKioskPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={18}
                    color={isSelected ? '#0F172A' : '#64748B'}
                  />
                  <View style={styles.pickerOptionInfo}>
                    <Text
                      style={[
                        styles.pickerOptionName,
                        isSelected && styles.pickerOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {k.name}
                    </Text>
                    <Text style={styles.pickerOptionSub} numberOfLines={1}>
                      {k.city || k.location || k.id}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#0F172A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 110,
  },
  kioskFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginBottom: Spacing.sm,
  },
  kioskDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    height: 40,
    ...Shadows.small,
  },
  kioskDropdownLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
  },
  kioskDropdownLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  clearKioskFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    height: 40,
    ...Shadows.small,
  },
  clearKioskFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
    marginBottom: Spacing.md,
    gap: 3,
    ...Shadows.small,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: BorderRadius.pill,
  },
  periodTabActive: {
    backgroundColor: '#0F172A',
  },
  periodTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    ...Shadows.small,
  },
  sumLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  sumAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 4,
    letterSpacing: -0.3,
  },
  sumSub: {
    fontSize: 11,
    color: '#64748B',
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
  breakdownCard: {
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  breakdownItem: {
    marginBottom: Spacing.sm + 2,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  itemCount: {
    fontSize: 11,
    color: '#64748B',
  },
  itemTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  itemFill: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pickerModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.cardLarge,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.medium,
  },
  pickerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
    gap: Spacing.sm,
  },
  pickerOptionActive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pickerOptionInfo: {
    flex: 1,
  },
  pickerOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerOptionTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  pickerOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
