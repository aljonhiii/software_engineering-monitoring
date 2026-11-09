import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Shadows } from '../../constants/theme';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'telemetry' | 'system';
  isRead: boolean;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationPress: (item: NotificationItem) => void;
}

export function NotificationsModal({
  visible,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onNotificationPress,
}: NotificationsModalProps) {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [slideAnim] = useState(() => new Animated.Value(-8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
      slideAnim.setValue(-8);
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim]);

  if (!visible) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return { name: 'receipt-outline' as const, bg: '#DCFCE7', color: '#16A34A' };
      case 'telemetry':
        return { name: 'water-outline' as const, bg: '#E0F2FE', color: '#0284C7' };
      case 'system':
      default:
        return { name: 'shield-checkmark-outline' as const, bg: '#EDE9FE', color: '#7C3AED' };
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.popoverCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                },
              ]}
            >
              {/* Pointing notch indicator directly below the bell icon */}
              <View style={styles.popoverArrow} />

              <View style={styles.cardContent}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                  <View style={styles.headerTitleGroup}>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadPill}>
                        <Text style={styles.unreadPillText}>{unreadCount} New</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.headerActions}>
                    {unreadCount > 0 && (
                      <TouchableOpacity
                        onPress={onMarkAllAsRead}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.markAllReadText}>Mark read</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.closeBtn}
                    >
                      <Ionicons name="close" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Notifications List */}
                <ScrollView
                  style={styles.listScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                >
                  {notifications.length > 0 ? (
                    notifications.map((item) => {
                      const icon = getIconForType(item.type);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemCard,
                            !item.isRead && styles.itemCardUnread,
                          ]}
                          onPress={() => onNotificationPress(item)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.iconBox,
                              { backgroundColor: icon.bg },
                            ]}
                          >
                            <Ionicons name={icon.name} size={16} color={icon.color} />
                          </View>

                          <View style={styles.itemInfo}>
                            <View style={styles.titleRow}>
                              <Text
                                style={[
                                  styles.itemTitle,
                                  !item.isRead && styles.itemTitleUnread,
                                ]}
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                              <Text style={styles.timeText}>{item.timestamp}</Text>
                            </View>
                            <Text style={styles.messageText} numberOfLines={2}>
                              {item.message}
                            </Text>
                          </View>

                          {!item.isRead && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyWrap}>
                      <Ionicons name="notifications-off-outline" size={32} color="#CBD5E1" />
                      <Text style={styles.emptyTitle}>No notifications</Text>
                      <Text style={styles.emptySub}>
                        All kiosk operations and telemetry are running normally.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Footer Clear All */}
                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearAllBtn}
                    onPress={onClearAll}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 95 : 68,
    paddingRight: 16,
  },
  popoverCard: {
    width: 340,
    maxWidth: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  popoverArrow: {
    position: 'absolute',
    top: -6,
    right: 22,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  unreadPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  unreadPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listScroll: {
    maxHeight: 320,
    marginTop: 6,
  },
  listContent: {
    paddingVertical: 4,
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    ...Shadows.small,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  itemInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 6,
  },
  itemTitleUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  messageText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    marginLeft: 6,
    marginTop: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  clearAllBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
