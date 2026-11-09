import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';

interface MachineOverviewCardProps {
  status: string;
  doorLocked: boolean;
  waterLevelPercent: number;
  soapLevelPercent: number;
  currentActivity?: string;
  lastHeartbeat?: string | null;
}

export function MachineOverviewCard({
  status,
  doorLocked,
  waterLevelPercent,
  soapLevelPercent,
  currentActivity = 'Idle',
}: MachineOverviewCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>KixCleen Vendo #1</Text>
          <Text style={styles.subTitle}>Unit 01 • Main Commercial Lobby</Text>
        </View>
        <StatusBadge status={status} type="machine" />
      </View>

      <View style={styles.activityRow}>
        <Text style={styles.activityLabel}>Status:</Text>
        <Text style={styles.activityText}>{currentActivity}</Text>
      </View>

      <View style={styles.telemetryContainer}>
        {/* Door Status */}
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>CHAMBER DOOR</Text>
          <View style={styles.doorStatusRow}>
            <View
              style={[
                styles.doorStatusDot,
                { backgroundColor: doorLocked ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={styles.doorStatusText}>
              {doorLocked ? 'LOCKED' : 'UNLOCKED'}
            </Text>
          </View>
        </View>

        {/* Clean Water */}
        <View style={styles.telemetryItem}>
          <View style={styles.meterHeader}>
            <Text style={styles.telemetryLabel}>CLEAN WATER</Text>
            <Text style={styles.meterValue}>{waterLevelPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, waterLevelPercent))}%`,
                  backgroundColor: waterLevelPercent < 20 ? '#EF4444' : '#0284C7',
                },
              ]}
            />
          </View>
        </View>

        {/* Foam Detergent */}
        <View style={styles.telemetryItem}>
          <View style={styles.meterHeader}>
            <Text style={styles.telemetryLabel}>DETERGENT</Text>
            <Text style={styles.meterValue}>{soapLevelPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, soapLevelPercent))}%`,
                  backgroundColor: soapLevelPercent < 20 ? '#EF4444' : '#0D9488',
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.md,
  },
  activityLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  activityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  telemetryContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  telemetryItem: {
    flex: 1,
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  doorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  doorStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  doorStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meterValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
