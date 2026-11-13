import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KixCleenLogo } from '../../components/common/KixCleenLogo';
import { Colors, Spacing } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEATURES = [
  { icon: 'activity' as const, label: 'Real-time kiosk monitoring' },
  { icon: 'map-pin' as const, label: 'Location management' },
  { icon: 'bar-chart-2' as const, label: 'Revenue & usage tracking' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top spacer */}
        <View style={styles.topSpacer} />

        {/* Central Hero: KixCleen Logo */}
        <View style={styles.logoHeroWrapper}>
          <View style={styles.logoSoftWash}>
            <KixCleenLogo width={210} height={110} />
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Let&apos;s get started</Text>
          <Text style={styles.subtitle}>
            Your KixCleen journey starts here. Manage your kiosk, monitor its
            activity, and keep your shoe-cleaning business connected wherever you
            go.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresBlock}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon} size={15} color={Colors.indigo} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* 3 Minimal Carousel Dots (First Dot Active) */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Bottom Section with Stadium Pill Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.pillButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(onboarding)/location-method')}
          >
            <Text style={styles.pillButtonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Clean Home Indicator Bar */}
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  topSpacer: {
    height: SCREEN_HEIGHT > 750 ? 24 : 12,
  },
  logoHeroWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  logoSoftWash: {
    width: 220,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    maxWidth: 320,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '400',
  },
  featuresBlock: {
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: 260,
    alignSelf: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.indigo,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
  },
  pillButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  pillButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  homeIndicator: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 18,
  },
});
