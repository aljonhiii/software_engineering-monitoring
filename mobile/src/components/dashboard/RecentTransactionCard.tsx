import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { formatCurrency, formatRelativeTime } from '../../utils/formatting';
import { StatusBadge } from '../common/StatusBadge';

interface RecentTransactionCardProps {
  orderId: string;
  shoeType: string;
  serviceName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  cleaningStatus: string;
  createdAt: string;
  onPress?: () => void;
}

export function RecentTransactionCard({
  orderId,
  shoeType,
  serviceName,
  totalAmount,
  paymentMethod,
  paymentStatus,
  cleaningStatus,
  createdAt,
  onPress,
}: RecentTransactionCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.leftCol}>
        <View style={styles.orderRow}>
          <Text style={styles.orderId}>#{orderId}</Text>
          <Text style={styles.timeText}>• {formatRelativeTime(createdAt)}</Text>
        </View>
        <Text style={styles.shoeServiceText} numberOfLines={1}>
          {shoeType} <Text style={styles.serviceText}>• {serviceName}</Text>
        </Text>
      </View>

      <View style={styles.rightCol}>
        <Text style={styles.amountText}>{formatCurrency(totalAmount)}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.methodText}>{paymentMethod.toUpperCase()}</Text>
          <StatusBadge status={cleaningStatus} type="cleaning" size="sm" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  leftCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  orderId: {
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
    color: '#0F172A',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  shoeServiceText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  serviceText: {
    color: '#64748B',
    fontWeight: '400',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },
});
