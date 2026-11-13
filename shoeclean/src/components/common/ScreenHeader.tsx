/**
 * Screen header component with title and optional subtitle.
 * Responsive for tablets and mobile devices.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';
import { useResponsive } from '../../hooks';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { isTablet } = useResponsive();

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      <Text style={[styles.title, isTablet && styles.titleTablet]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  containerTablet: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleTablet: {
    fontSize: Typography.h1,
  },
  subtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxs,
    lineHeight: 20,
    maxWidth: 650,
  },
  subtitleTablet: {
    fontSize: Typography.body,
    marginTop: Spacing.xs,
    lineHeight: 24,
  },
});
