import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { getTransactionsApi } from '../../../api/transactionsApi';
import { getMachineStatusApi } from '../../../api/machineApi';
import { Transaction, KioskMachine } from '../../../types';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { RecentTransactionCard } from '../../../components/dashboard/RecentTransactionCard';
import { LoadingView } from '../../../components/common/LoadingView';
import { DigitalReceiptModal } from '../../../components/common/DigitalReceiptModal';

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Failed'];

export default function TransactionsListScreen() {
  const params = useLocalSearchParams<{ kioskId?: string }>();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Kiosk dropdown filter state (default is null = "All Kiosks")
  const [kiosks, setKiosks] = useState<KioskMachine[]>([]);
  const [selectedKioskId, setSelectedKioskId] = useState<string | null>(params.kioskId || null);
  const [isKioskPickerOpen, setIsKioskPickerOpen] = useState<boolean>(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);

  // Sync selectedKioskId if route param changes
  useEffect(() => {
    if (params.kioskId) {
      setSelectedKioskId(params.kioskId);
    }
  }, [params.kioskId]);

  // Load available kiosks for filtering
  useEffect(() => {
    let isMounted = true;
    getMachineStatusApi()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.kiosks)) {
          setKiosks(res.kiosks);
        }
      })
      .catch((err) => console.warn('[Transactions] Kiosks load error:', err.message));
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await getTransactionsApi({
        search: search.trim() || undefined,
        paymentStatus: selectedStatus !== 'All' ? selectedStatus.toLowerCase() : undefined,
        kioskId: selectedKioskId || undefined,
        limit: 100,
      });
      if (res.success && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (err: any) {
      console.warn('[Transactions] Error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedStatus, selectedKioskId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Live real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewTx = (newTx: any) => {
      const txKioskId = newTx.kiosk_id || newTx.kioskId;
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

      // If filtering by specific kiosk, ignore other kiosks
      if (selectedKioskId && txKioskId && txKioskId !== selectedKioskId) {
        return;
      }

      setTransactions((prev) => {
        const orderId = newTx.order_id || newTx.orderId;
        const exists = prev.some((t) => t.orderId === orderId);
        if (exists) return prev;
        const formatted: Transaction = {
          id: newTx.id,
          orderId,
          kioskId: newTx.kiosk_id || newTx.kioskId,
          kioskName: newTx.kiosk_name || newTx.kioskName,
          kioskLocation: newTx.kiosk_location || newTx.kioskLocation,
          shoeType: newTx.shoe_type || newTx.shoeType,
          serviceTier: newTx.service_tier || newTx.serviceTier,
          serviceName: newTx.service_name || newTx.serviceName,
          addons: typeof newTx.addons === 'string' ? JSON.parse(newTx.addons || '[]') : newTx.addons || [],
          basePrice: Number(newTx.base_price || 0),
          addonsPrice: Number(newTx.addons_price || 0),
          totalAmount: Number(newTx.total_amount || 0),
          paymentMethod: newTx.payment_method || newTx.paymentMethod,
          paymentStatus: newTx.payment_status || newTx.paymentStatus,
          paymentRef: newTx.payment_ref || newTx.paymentRef,
          cleaningStatus: newTx.cleaning_status || newTx.cleaningStatus,
          createdAt: newTx.created_at || new Date().toISOString(),
        };
        return [formatted, ...prev];
      });
    };

    const handleUpdatedTx = (updatedTx: any) => {
      const orderId = updatedTx.order_id || updatedTx.orderId;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.orderId === orderId) {
            return {
              ...t,
              paymentStatus: updatedTx.payment_status || t.paymentStatus,
              cleaningStatus: updatedTx.cleaning_status || t.cleaningStatus,
              completedAt: updatedTx.completed_at || t.completedAt,
            };
          }
          return t;
        })
      );
    };

    socket.on('transaction:new', handleNewTx);
    socket.on('transaction:updated', handleUpdatedTx);

    return () => {
      socket.off('transaction:new', handleNewTx);
      socket.off('transaction:updated', handleUpdatedTx);
    };
  }, [socket, user, selectedKioskId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const selectedKiosk = kiosks.find((k) => k.id === selectedKioskId);
  const kioskDropdownLabel = selectedKiosk ? selectedKiosk.name : 'All Kiosks';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Transactions"
        subtitle={`${transactions.length} record${transactions.length === 1 ? '' : 's'}${selectedKioskId ? ` • ${kioskDropdownLabel}` : ''}`}
        onRefresh={onRefresh}
        isRefreshing={refreshing}
      />

      {/* Search & Filter Header */}
      <View style={styles.searchContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID, shoe type..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Kiosk Dropdown Bar (Plain, neutral styling, non-overlapping) */}
        <View style={styles.filterControlRow}>
          <TouchableOpacity
            style={styles.kioskDropdownBtn}
            onPress={() => setIsKioskPickerOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.kioskDropdownLeft}>
              <Ionicons name="storefront-outline" size={14} color="#475569" />
              <Text style={styles.kioskDropdownText} numberOfLines={1} ellipsizeMode="tail">
                {kioskDropdownLabel}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          {selectedKioskId && (
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => setSelectedKioskId(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={13} color="#64748B" />
              <Text style={styles.resetFilterText}>All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Segmented Controls */}
        <View style={styles.chipsRow}>
          {STATUS_FILTERS.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <LoadingView message="Loading transactions..." />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id || item.orderId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <RecentTransactionCard
              orderId={item.orderId}
              shoeType={item.shoeType}
              serviceName={item.serviceName}
              totalAmount={item.totalAmount}
              paymentMethod={item.paymentMethod}
              paymentStatus={item.paymentStatus}
              cleaningStatus={item.cleaningStatus}
              createdAt={item.createdAt}
              kioskName={item.kioskName || (kiosks.find((k) => k.id === item.kioskId)?.name)}
              onPress={() => setSelectedReceiptTx(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="filter-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching transactions</Text>
              <Text style={styles.emptySub}>
                {selectedKioskId
                  ? `No records found for ${kioskDropdownLabel}. Try selecting "All Kiosks".`
                  : 'Adjust search keywords or filter criteria.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Digital Receipt Modal: Instant, No Page Reload */}
      <DigitalReceiptModal
        visible={Boolean(selectedReceiptTx)}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
      />

      {/* Kiosk Dropdown Modal Picker */}
      <Modal
        visible={isKioskPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsKioskPickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsKioskPickerOpen(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>SELECT KIOSK</Text>

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
                color={!selectedKioskId ? '#0284C7' : '#64748B'}
              />
              <View style={styles.pickerOptionInfo}>
                <Text
                  style={[
                    styles.pickerOptionName,
                    !selectedKioskId && styles.pickerOptionTextActive,
                  ]}
                >
                  All Kiosks (Default)
                </Text>
                <Text style={styles.pickerOptionSub}>
                  Show transactions from all {kiosks.length} units
                </Text>
              </View>
              {!selectedKioskId && (
                <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
              )}
            </TouchableOpacity>

            {/* Individual Kiosks */}
            {kiosks.map((k) => {
              const isSelected = selectedKioskId === k.id;
              const statusColor =
                k.status === 'online' ? '#10B981'
                : k.status === 'busy' ? '#3B82F6'
                : k.status === 'maintenance' ? '#F59E0B'
                : '#94A3B8';

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
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
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
                    <Ionicons name="checkmark-circle" size={18} color="#0284C7" />
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
  searchContainer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  filterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
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
  kioskDropdownText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  resetFilterBtn: {
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
  resetFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 110,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
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
  pickerModalTitle: {
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
