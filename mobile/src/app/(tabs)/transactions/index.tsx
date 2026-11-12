import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { getTransactionsApi } from '../../../api/transactionsApi';
import { Transaction } from '../../../types';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { RecentTransactionCard } from '../../../components/dashboard/RecentTransactionCard';
import { LoadingView } from '../../../components/common/LoadingView';

const STATUS_FILTERS = ['All', 'Paid', 'Pending', 'Failed'];

export default function TransactionsListScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await getTransactionsApi({
        search: search.trim() || undefined,
        paymentStatus: selectedStatus !== 'All' ? selectedStatus.toLowerCase() : undefined,
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
  }, [search, selectedStatus]);

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

      setTransactions((prev) => {
        const orderId = newTx.order_id || newTx.orderId;
        const exists = prev.some((t) => t.orderId === orderId);
        if (exists) return prev;
        const formatted: Transaction = {
          id: newTx.id,
          orderId,
          kioskId: newTx.kiosk_id || newTx.kioskId,
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
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Transactions"
        subtitle={`${transactions.length} records`}
        onRefresh={onRefresh}
        isRefreshing={refreshing}
      />

      {/* Search & Filter Header */}
      <View style={styles.searchContainer}>
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
              onPress={() => router.push(`/(tabs)/transactions/${item.orderId}` as any)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="filter-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching transactions</Text>
              <Text style={styles.emptySub}>
                Adjust search keywords or filter criteria.
              </Text>
            </View>
          }
        />
      )}
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
    borderBottomWidth: 0,
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
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    padding: Spacing.lg,
    paddingBottom: 110, // Extra clearance for floating dock
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});
