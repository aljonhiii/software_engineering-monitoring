import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useSocket } from '../../context/SocketContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showLiveIndicator?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showNotificationBell?: boolean;
  unreadCount?: number;
  onNotificationPress?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  showLiveIndicator = false,
  onRefresh,
  isRefreshing = false,
  showNotificationBell = true,
  unreadCount = 0,
  onNotificationPress,
}: ScreenHeaderProps) {
  const { isConnected } = useSocket();

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightActions}>
        {showLiveIndicator && (
          <View style={styles.syncIndicator}>
            <View
              style={[
                styles.syncDot,
                { backgroundColor: isConnected ? '#10B981' : '#94A3B8' },
              ]}
            />
            <Text style={styles.syncText}>
              {isConnected ? 'Synced' : 'Offline'}
            </Text>
          </View>
        )}

        {onRefresh && (
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={isRefreshing}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Refresh"
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color={isRefreshing ? Colors.textMuted : '#475569'}
            />
          </TouchableOpacity>
        )}

        {showNotificationBell && (
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onNotificationPress || onRefresh}
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
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bellBadgeCount: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
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
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
