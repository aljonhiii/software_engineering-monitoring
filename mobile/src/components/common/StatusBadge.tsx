import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BorderRadius } from '../../constants/theme';

interface StatusBadgeProps {
  status: string;
  type?: 'payment' | 'cleaning' | 'machine' | 'role';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, type = 'payment', size = 'sm' }: StatusBadgeProps) {
  const norm = (status || '').toLowerCase().replace('-', '_');

  let bg = '#F1F5F9';
  let text = '#475569';
  let dot = '#94A3B8';
  let label = status ? status.toUpperCase().replace('_', ' ') : 'UNKNOWN';

  if (type === 'payment') {
    if (norm === 'paid' || norm === 'completed') {
      bg = '#ECFDF5';
      text = '#047857';
      dot = '#10B981';
      label = 'PAID';
    } else if (norm === 'pending') {
      bg = '#FFFBEB';
      text = '#B45309';
      dot = '#F59E0B';
      label = 'PENDING';
    } else if (norm === 'failed') {
      bg = '#FEF2F2';
      text = '#B91C1C';
      dot = '#EF4444';
      label = 'FAILED';
    }
  } else if (type === 'cleaning') {
    if (norm === 'completed') {
      bg = '#ECFDF5';
      text = '#047857';
      dot = '#10B981';
      label = 'COMPLETED';
    } else if (norm === 'in_progress' || norm === 'washing' || norm === 'drying') {
      bg = '#EFF6FF';
      text = '#1D4ED8';
      dot = '#3B82F6';
      label = 'IN PROGRESS';
    } else if (norm === 'cancelled' || norm === 'failed') {
      bg = '#FEF2F2';
      text = '#B91C1C';
      dot = '#EF4444';
      label = 'FAILED';
    } else {
      bg = '#F8FAFC';
      text = '#64748B';
      dot = '#94A3B8';
      label = 'QUEUED';
    }
  } else if (type === 'machine') {
    if (norm === 'online') {
      bg = '#ECFDF5';
      text = '#047857';
      dot = '#10B981';
      label = 'ONLINE';
    } else if (norm === 'busy' || norm === 'cleaning' || norm === 'running') {
      bg = '#EFF6FF';
      text = '#1D4ED8';
      dot = '#3B82F6';
      label = 'ACTIVE';
    } else if (norm === 'maintenance') {
      bg = '#FFFBEB';
      text = '#B45309';
      dot = '#F59E0B';
      label = 'MAINTENANCE';
    } else if (norm === 'error') {
      bg = '#FEF2F2';
      text = '#B91C1C';
      dot = '#EF4444';
      label = 'ERROR';
    } else {
      bg = '#F8FAFC';
      text = '#64748B';
      dot = '#94A3B8';
      label = 'OFFLINE';
    }
  } else if (type === 'role') {
    if (norm === 'owner' || norm === 'buyer') {
      bg = '#F5F3FF';
      text = '#6D28D9';
      dot = '#8B5CF6';
      label = norm === 'buyer' ? 'BUYER / OWNER' : 'OWNER';
    } else if (norm === 'superadmin') {
      bg = '#ECFDF5';
      text = '#047857';
      dot = '#10B981';
      label = 'SUPER ADMIN';
    } else {
      bg = '#EFF6FF';
      text = '#1D4ED8';
      dot = '#3B82F6';
      label = 'ADMIN';
    }
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text
        style={[
          styles.text,
          { color: text },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: 5,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
});
