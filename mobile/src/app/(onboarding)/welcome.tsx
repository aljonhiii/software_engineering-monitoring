import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { KixCleenLogo } from '../../components/common/KixCleenLogo';
import { OnboardingIllustration } from '../../components/common/OnboardingIllustration';
import { Colors, Spacing } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Brand Logo Header */}
        <View style={styles.logoWrapper}>
          <KixCleenLogo width={140} height={40} />
        </View>

        {/* Hero Vector Artwork */}
        <View style={styles.illustrationWrapper}>
          <OnboardingIllustration width={260} height={210} />
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Let&apos;s get started</Text>
          <Text style={styles.subtitle}>
            Your smart shoe-cleaning experience starts here. Let&apos;s set up your kiosk location.
          </Text>
        </View>

        {/* 3 Minimal Carousel Dots */}
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
    paddingTop: SCREEN_HEIGHT > 700 ? Spacing.xl : Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SCREEN_HEIGHT > 750 ? Spacing.md : Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
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
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.lg,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
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
