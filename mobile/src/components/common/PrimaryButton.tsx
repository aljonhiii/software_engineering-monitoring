import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, Shadows } from '../../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: PrimaryButtonProps) {
  let bg = Colors.primary;
  let textColor = '#FFFFFF';
  let borderColor = 'transparent';

  if (variant === 'danger') {
    bg = Colors.red;
    textColor = '#FFFFFF';
  } else if (variant === 'secondary') {
    bg = '#F1F5F9';
    textColor = Colors.textPrimary;
    borderColor = Colors.border;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textColor = Colors.primary;
    borderColor = Colors.primary;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg, borderColor },
        variant === 'outline' || variant === 'secondary' ? styles.bordered : null,
        variant === 'primary' && !disabled ? Shadows.small : null,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  bordered: {
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
});
