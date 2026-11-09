import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

export interface OverflowNavItem {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  isActive: boolean;
  onPress: () => void;
}

interface OverflowNavModalProps {
  visible: boolean;
  onClose: () => void;
  items: OverflowNavItem[];
}

export function OverflowNavModal({ visible, onClose, items }: OverflowNavModalProps) {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.floatingPanel,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.cardContent}>
                {/* Header Row */}
                <View style={styles.headerRow}>
                  <Text style={styles.headerTitle}>MODULES & TOOLS</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Items List */}
                <View style={styles.itemsList}>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.itemRow,
                        item.isActive && styles.itemRowActive,
                      ]}
                      onPress={() => {
                        item.onPress();
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          item.isActive && styles.iconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={item.isActive ? Colors.accentLime : '#0F172A'}
                        />
                      </View>

                      <View style={styles.itemInfo}>
                        <View style={styles.titleLine}>
                          <Text
                            style={[
                              styles.itemTitle,
                              item.isActive && styles.itemTitleActive,
                            ]}
                          >
                            {item.title}
                          </Text>
                          {item.isActive && (
                            <View style={styles.activePill}>
                              <Text style={styles.activePillText}>CURRENT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.itemDesc}>{item.description}</Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={item.isActive ? '#0F172A' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 96 : 88,
  },
  floatingPanel: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF', // Modern crisp white floating panel
    borderRadius: BorderRadius.cardLarge,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.large,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemRowActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#0F172A',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxActive: {
    backgroundColor: '#0F172A',
  },
  itemInfo: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemTitleActive: {
    color: '#0F172A',
  },
  activePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accentLime,
  },
  itemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
