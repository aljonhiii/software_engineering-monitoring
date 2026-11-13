/**
 * ServiceCard component for displaying a cleaning service tier.
 * Clean, typography-first card layout without decorative icons or jargon.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CleaningService } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants';
import { formatPrice, formatDuration } from '../../utils';

interface ServiceCardProps {
  service: CleaningService;
  isSelected: boolean;
  onSelect: (service: CleaningService) => void;
}

export function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={() => onSelect(service)}
      activeOpacity={0.88}
    >
      <View>
        {/* Top Row: Service Name, Duration & Radio */}
        <View style={styles.header}>
          <Text style={styles.title}>{service.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.durationBadge, isSelected && styles.durationBadgeSelected]}>
              <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                {formatDuration(service.durationMinutes)}
              </Text>
            </View>
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          </View>
        </View>

        {/* Plain, readable description (never truncated) */}
        <Text style={styles.description}>{service.description}</Text>

        {/* Concise Feature List */}
        <View style={styles.featureList}>
          {service.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.bulletDot, isSelected && styles.bulletDotSelected]} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Price Footer */}
      <View style={styles.footer}>
        <Text style={styles.priceLabel}>Price</Text>
        <Text style={[styles.priceValue, isSelected && styles.priceValueSelected]}>
          {formatPrice(service.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardWhite,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minHeight: 220,
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  containerSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    ...Shadows.glow(Colors.primary),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  durationBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  durationBadgeSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  durationText: {
    fontSize: Typography.caption,
    color: '#475569',
    fontWeight: Typography.semiBold,
  },
  durationTextSelected: {
    color: Colors.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
    lineHeight: 20,
  },
  featureList: {
    marginVertical: Spacing.md,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  bulletDotSelected: {
    backgroundColor: Colors.primary,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: Typography.regular,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: Typography.semiBold,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  priceValueSelected: {
    color: Colors.primary,
  },
});
