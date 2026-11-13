/**
 * AddonCard component for selecting optional cleaning add-ons.
 * Clean, typography-driven row with toggle checkbox and clear pricing.
 */

import React from 'react';  
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceAddon } from '../../types';
import { Colors, Typography, Spacing, Shadows } from '../../constants';
import { formatPrice } from '../../utils';

interface AddonCardProps {
  addon: ServiceAddon;
  isSelected: boolean;
  onToggle: (addon: ServiceAddon) => void;
}

export function AddonCard({ addon, isSelected, onToggle }: AddonCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={() => onToggle(addon)}
      activeOpacity={0.85}
    >
      <View style={styles.textContainer}>
        <Text style={styles.name}>{addon.name}</Text>
        <Text style={styles.description}>{addon.description}</Text>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.price, isSelected && styles.priceSelected]}>
          +{formatPrice(addon.price)}
        </Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardWhite,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minHeight: 74,
    ...Shadows.small,
  },
  containerSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    ...Shadows.glow(Colors.primary),
  },
  textContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
    lineHeight: 18,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  priceSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
