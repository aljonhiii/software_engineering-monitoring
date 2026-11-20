import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
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
  const isScrollable = data.length > 7;

  // Format label for display based on dataset length
  const formatLabel = (rawLabel: string) => {
    if (!rawLabel) return '';
    // Format "Sun, 11/15" or "11/15/2026"
    if (isScrollable) {
      const parts = rawLabel.split(',');
      if (parts.length > 1) {
        return parts[1].trim(); // Returns "11/15"
      }
      return rawLabel.trim();
    }
    // For 7-day or 1-day, show weekday (e.g., "Sun", "Mon")
    return rawLabel.split(',')[0].replace(/,/g, '').trim();
  };

  const renderBars = () => (
    <View style={[styles.barsRow, isScrollable && styles.barsRowScrollable]}>
      {data.map((val, idx) => {
        const heightPct = Math.round((val / maxVal) * 100);
        const label = formatLabel(labels[idx] || '');
        const isHighest = val === maxVal && maxVal > 0;

        return (
          <View
            key={idx}
            style={[styles.barCol, isScrollable && styles.barColScrollable]}
          >
            {/* Value text above bar */}
            <Text style={[styles.barValText, isHighest && styles.barValTextHighest]}>
              {val > 0 ? `₱${Math.round(val)}` : '-'}
            </Text>

            {/* Bar track and fill */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${Math.max(4, heightPct)}%` },
                  isHighest && styles.barFillHighest,
                  val === 0 && styles.barFillZero,
                ]}
              />
            </View>

            {/* Date / Day label below bar */}
            <Text style={[styles.barLabelText, isHighest && styles.barLabelHighest]} numberOfLines={1}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.chartTitle}>{title}</Text>
        {isScrollable && (
          <Text style={styles.scrollHint}>← Scroll horizontally →</Text>
        )}
      </View>

      <View style={styles.chartWrapper}>
        {isScrollable ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderBars()}
          </ScrollView>
        ) : (
          renderBars()
        )}
        {/* Subtle baseline axis */}
        <View style={styles.baseline} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    ...Shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  chartTitle: {
    ...Typography.titleSmall,
    color: '#0F172A',
    fontWeight: '700',
  },
  scrollHint: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chartWrapper: {
    height: 180,
    justifyContent: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xs,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 165,
    width: '100%',
  },
  barsRowScrollable: {
    width: undefined,
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barColScrollable: {
    flex: undefined,
    width: 44,
  },
  barValText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  barValTextHighest: {
    color: '#0284C7',
    fontWeight: '800',
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
    backgroundColor: '#0284C7',
    borderRadius: BorderRadius.full,
  },
  barFillHighest: {
    backgroundColor: '#0D9488', // Highlight peak day with bold teal
  },
  barFillZero: {
    backgroundColor: '#E2E8F0',
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  barLabelHighest: {
    color: '#0F172A',
    fontWeight: '700',
  },
  baseline: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginTop: 2,
  },
});
