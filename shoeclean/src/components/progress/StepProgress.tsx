/**
 * StepProgress component showing the multi-stage shoe cleaning cycle.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MachineState } from '../../types';
import { Colors, Typography, Spacing } from '../../constants';

interface StepProgressProps {
  currentState: MachineState;
}

interface StepItem {
  key: MachineState;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const STEPS: StepItem[] = [
  { key: 'preparing', label: 'Preparation', icon: 'settings-outline' },
  { key: 'cleaning', label: 'Sanitize / Disinfect', icon: 'shield-checkmark-outline' },
  { key: 'rinsing', label: 'Deodorizing', icon: 'leaf-outline' },
  { key: 'drying', label: 'UV Light & Dryer', icon: 'sunny-outline' },
];

export function StepProgress({ currentState }: StepProgressProps) {
  const getStepStatus = (stepKey: MachineState) => {
    const order: MachineState[] = ['idle', 'preparing', 'cleaning', 'rinsing', 'drying', 'completed'];
    const currentIndex = order.indexOf(currentState);
    const stepIndex = order.indexOf(stepKey);

    if (currentState === 'completed' || currentIndex > stepIndex) {
      return 'completed';
    }
    if (currentIndex === stepIndex) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const status = getStepStatus(step.key);
        return (
          <View key={step.key} style={styles.stepWrapper}>
            {/* Step Icon */}
            <View
              style={[
                styles.iconContainer,
                status === 'active' && styles.iconActive,
                status === 'completed' && styles.iconCompleted,
              ]}
            >
              {status === 'completed' ? (
                <Ionicons name="checkmark" size={20} color={Colors.background} />
              ) : (
                <Ionicons
                  name={step.icon}
                  size={20}
                  color={status === 'active' ? Colors.accent : Colors.textMuted}
                />
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                status === 'active' && styles.labelActive,
                status === 'completed' && styles.labelCompleted,
              ]}
            >
              {step.label}
            </Text>

            {/* Connecting line between steps */}
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.connector,
                  (status === 'completed' || status === 'active') && styles.connectorActive,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    width: '100%',
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
    zIndex: 2,
  },
  iconActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
  },
  iconCompleted: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  label: {
    fontSize: Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: Typography.medium,
  },
  labelActive: {
    color: Colors.accent,
    fontWeight: Typography.bold,
  },
  labelCompleted: {
    color: Colors.textPrimary,
  },
  connector: {
    position: 'absolute',
    top: 22,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: 1,
  },
  connectorActive: {
    backgroundColor: Colors.accent,
  },
});
