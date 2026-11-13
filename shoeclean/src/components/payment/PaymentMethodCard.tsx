/**
 * PaymentMethodCard component representing simulated hardware payment inputs.
 * Redesigned with elevated white cards and blue accents.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({
  method,
  title,
  subtitle,
  icon,
  isSelected,
  onSelect,
}: PaymentMethodCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={() => onSelect(method)}
      activeOpacity={0.88}
    >
      <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
        <Ionicons
          name={icon}
          size={32}
          color={isSelected ? '#FFFFFF' : Colors.primary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={[styles.badge, isSelected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
          {isSelected ? 'Selected' : 'Tap to Choose'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    ...Shadows.card,
  },
  containerSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    ...Shadows.glow(Colors.primary),
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconWrapperSelected: {
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
  },
  badgeSelected: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: Typography.medium,
  },
  badgeTextSelected: {
    color: '#FFFFFF',
    fontWeight: Typography.bold,
  },
});
