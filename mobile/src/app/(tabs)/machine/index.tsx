import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { useSocket } from '../../../context/SocketContext';
import { getMachineStatusApi } from '../../../api/machineApi';
import { KioskMachine } from '../../../types';
import { formatDate, formatRelativeTime } from '../../../utils/formatting';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { Card } from '../../../components/common/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { LoadingView } from '../../../components/common/LoadingView';

export default function MachineScreen() {
  const { socket } = useSocket();
  const [kiosks, setKiosks] = useState<KioskMachine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchMachineStatus = useCallback(async () => {
    try {
      const res = await getMachineStatusApi();
      if (res.success && res.kiosks) {
        setKiosks(res.kiosks);
      }
    } catch (err: any) {
      console.warn('[Machine] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMachineStatus();
  }, [fetchMachineStatus]);

  // Realtime Socket listener
  useEffect(() => {
    if (!socket) return;

    const handleStatus = (updatedKiosk: any) => {
      setKiosks((prev) =>
        prev.map((k) => (k.id === updatedKiosk.id ? { ...k, ...updatedKiosk } : k))
      );
    };

    socket.on('machine:status', handleStatus);
    return () => {
      socket.off('machine:status', handleStatus);
    };
  }, [socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMachineStatus();
  };

  if (loading && kiosks.length === 0) {
    return <LoadingView message="Connecting to machine telemetry..." />;
  }

  const primary = kiosks[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScreenHeader
        title="Machine Telemetry"
        subtitle="ESP32 hardware controller & sensors"
        onRefresh={onRefresh}
        isRefreshing={refreshing}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {primary ? (
          <>
            {/* Machine Status Hero Card */}
            <Card style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.heroTitleCol}>
                  <Text style={styles.kioskName}>{primary.name}</Text>
                  <Text style={styles.kioskLoc}>{primary.location}</Text>
                </View>
                <StatusBadge status={primary.status} type="machine" size="md" />
              </View>

              <View style={styles.pulseRow}>
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: primary.status === 'online' ? '#10B981' : '#94A3B8' },
                  ]}
                />
                <Text style={styles.pulseText}>
                  Heartbeat: {formatRelativeTime(primary.lastHeartbeat)} ({formatDate(primary.lastHeartbeat)})
                </Text>
              </View>

              <View style={styles.currentOrderBox}>
                <Text style={styles.orderBoxLabel}>HARDWARE STATE</Text>
                <Text style={styles.orderBoxValue}>{primary.currentActivity}</Text>
                {primary.currentOrderId && (
                  <Text style={styles.orderBoxOrder}>
                    Active Order: #{primary.currentOrderId}
                  </Text>
                )}
              </View>
            </Card>

            {/* Hardware Actuators & Locks */}
            <Text style={styles.sectionHeader}>HARDWARE MECHANISMS</Text>
            <Card style={styles.card}>
              <View style={styles.statRow}>
                <View style={styles.statRowLeft}>
                  <Ionicons
                    name={primary.doorLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                    size={20}
                    color="#64748B"
                  />
                  <View>
                    <Text style={styles.rowTitle}>Chamber Magnetic Lock</Text>
                    <Text style={styles.rowSub}>
                      {primary.doorLocked
                        ? 'Door magnetically locked (Cycle active)'
                        : 'Door unlocked and accessible'}
                    </Text>
                  </View>
                </View>
                <View style={styles.lockBadge}>
                  <View
                    style={[
                      styles.lockDot,
                      { backgroundColor: primary.doorLocked ? '#10B981' : '#F59E0B' },
                    ]}
                  />
                  <Text style={styles.lockText}>
                    {primary.doorLocked ? 'LOCKED' : 'UNLOCKED'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Consumables Gauges */}
            <Text style={styles.sectionHeader}>CONSUMABLE RESERVOIRS</Text>

            {/* Water Tank */}
            <Card style={styles.card}>
              <View style={styles.reservoirTop}>
                <View>
                  <Text style={styles.rowTitle}>Clean Water Supply</Text>
                  <Text style={styles.rowSub}>High-pressure wash & rinse reservoir</Text>
                </View>
                <Text style={styles.pctText}>{primary.waterLevelPercent}%</Text>
              </View>
              <View style={styles.gaugeTrack}>
                <View
                  style={[
                    styles.gaugeFill,
                    {
                      width: `${primary.waterLevelPercent}%`,
                      backgroundColor: primary.waterLevelPercent < 20 ? '#EF4444' : '#0284C7',
                    },
                  ]}
                />
              </View>
              {primary.waterLevelPercent <= 20 && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertText}>
                    Warning: Clean water reservoir is low. Refill recommended.
                  </Text>
                </View>
              )}
            </Card>

            {/* Soap Tank */}
            <Card style={styles.card}>
              <View style={styles.reservoirTop}>
                <View>
                  <Text style={styles.rowTitle}>Detergent Foam Supply</Text>
                  <Text style={styles.rowSub}>Anti-bacterial cleaning formula</Text>
                </View>
                <Text style={styles.pctText}>{primary.soapLevelPercent}%</Text>
              </View>
              <View style={styles.gaugeTrack}>
                <View
                  style={[
                    styles.gaugeFill,
                    {
                      width: `${primary.soapLevelPercent}%`,
                      backgroundColor: primary.soapLevelPercent < 20 ? '#EF4444' : '#0D9488',
                    },
                  ]}
                />
              </View>
              {primary.soapLevelPercent <= 20 && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertText}>
                    Warning: Foam solution reservoir is low. Refill recommended.
                  </Text>
                </View>
              )}
            </Card>

            {/* Machine Specs & Connectivity */}
            <Text style={styles.sectionHeader}>CONTROLLER NETWORK SPECS</Text>
            <Card style={styles.card}>
              <View style={styles.specLine}>
                <Text style={styles.specLabel}>Microcontroller</Text>
                <Text style={styles.specVal}>ESP32-WROOM-32 (Dual-Core)</Text>
              </View>
              <View style={styles.specLine}>
                <Text style={styles.specLabel}>Telemetry Protocol</Text>
                <Text style={styles.specVal}>REST + WebSocket Heartbeat</Text>
              </View>
              <View style={[styles.specLine, { borderBottomWidth: 0 }]}>
                <Text style={styles.specLabel}>Assigned Kiosk ID</Text>
                <Text style={[styles.specVal, styles.monoVal]}>
                  {primary.id}
                </Text>
              </View>
            </Card>
          </>
        ) : (
          <Text style={styles.emptyText}>No kiosks registered.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: '#121316',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: BorderRadius.cardLarge,
    ...Shadows.medium,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  heroTitleCol: {
    flex: 1,
  },
  kioskName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  kioskLoc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: Spacing.sm,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  currentOrderBox: {
    backgroundColor: '#1E1F24',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#27272A',
    marginTop: Spacing.xs,
  },
  orderBoxLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  orderBoxValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 2,
  },
  orderBoxOrder: {
    fontSize: 11,
    color: Colors.accentLime,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.cardLarge,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  reservoirTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  pctText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gaugeTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 2,
  },
  alertBox: {
    marginTop: Spacing.sm,
    padding: Spacing.xs + 2,
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '500',
  },
  specLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  monoVal: {
    fontFamily: 'monospace',
    color: '#0284C7',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: Spacing.xl,
  },
});
