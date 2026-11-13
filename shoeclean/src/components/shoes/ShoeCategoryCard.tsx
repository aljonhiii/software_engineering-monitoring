/**
 * ShoeCategoryCard - Selectable card for shoe type selection.
 * Redesigned to match the reference design:
 * - Elevated pure white card with soft drop shadow
 * - Realistic vector shoe illustration with ground shadow
 * - Category title in bold dark slate
 * - "( Fast & Deep clean )" subtitle
 * - Base price "₱ 30.00"
 * - Bottom-right corner vibrant blue action button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoeCategory } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { ShoeIllustration } from './ShoeIllustrations';

interface ShoeCategoryCardProps {
  category: ShoeCategory;
  isSelected: boolean;
  onSelect: (category: ShoeCategory) => void;
  basePrice?: number;
}

export function ShoeCategoryCard({
  category,
  isSelected,
  onSelect,
  basePrice = 30,
}: ShoeCategoryCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={() => onSelect(category)}
      activeOpacity={0.88}
    >
      {/* Category Badge */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{category.badge}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            <Text style={styles.selectedBadgeText}>Selected</Text>
          </View>
        )}
      </View>

      {/* Shoe Illustration Container */}
      <View style={styles.illustrationContainer}>
        <ShoeIllustration categoryId={category.id} size={135} />
      </View>

      {/* Text & Action Row */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {category.description}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.startingLabel}>Starts at </Text>
            <Text style={styles.currencySymbol}>₱ </Text>
            <Text style={styles.priceValue}>{basePrice.toFixed(2)}</Text>
          </View>

          <View style={[styles.actionButton, isSelected && styles.actionButtonSelected]}>
            <Ionicons
              name={isSelected ? 'checkmark' : 'arrow-forward'}
              size={16}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    margin: Spacing.xs,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minHeight: 210,
    justifyContent: 'space-between',
    position: 'relative',
    ...Shadows.card,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    ...Shadows.glow(Colors.primary),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: Typography.semiBold,
    color: '#475569',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    minHeight: 110,
  },
  detailsContainer: {
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontWeight: Typography.regular,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  startingLabel: {
    fontSize: 12,
    fontWeight: Typography.medium,
    color: '#64748B',
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonSelected: {
    backgroundColor: '#0F766E', // Deeper teal on select
  },
});
