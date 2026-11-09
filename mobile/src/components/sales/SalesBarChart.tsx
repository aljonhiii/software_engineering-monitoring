import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { Card } from '../common/Card';

interface SalesBarChartProps {
  labels: string[];
  data: number[];
  title?: string;
}

export function SalesBarChart({
  labels = [],
  data = [],
  title = 'Revenue Performance',
}: SalesBarChartProps) {
  const maxVal = Math.max(...data, 100);

  return (
    <Card style={styles.card}>
      <Text style={styles.chartTitle}>{title}</Text>

      <View style={styles.barsContainer}>
        {data.map((val, idx) => {
          const heightPct = Math.round((val / maxVal) * 100);
          const label = labels[idx] || '';

          return (
            <View key={idx} style={styles.barCol}>
              <Text style={styles.barValText}>{val > 0 ? `₱${Math.round(val)}` : ''}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${Math.max(6, heightPct)}%` },
                    val === maxVal && styles.barFillHighest,
                  ]}
                />
              </View>
              <Text style={styles.barLabelText} numberOfLines={1}>
                {label.split(' ')[0]}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  chartTitle: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingHorizontal: Spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barValText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  barTrack: {
    width: 14,
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  barFillHighest: {
    backgroundColor: Colors.accent,
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
