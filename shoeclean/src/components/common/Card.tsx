/**
 * Card container matching the clean elevated white card style.
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Shadows } from '../../constants';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  selected?: boolean;
}

export function Card({ children, style, onPress, selected }: CardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.card,
        selected && styles.selected,
        style,
      ]}
      {...(onPress ? { onPress, activeOpacity: 0.88 } : {})}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  selected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    ...Shadows.glow(Colors.primary),
  },
});
