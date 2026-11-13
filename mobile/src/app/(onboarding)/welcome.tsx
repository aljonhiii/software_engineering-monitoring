import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Badge */}
        <View style={styles.topBar}>
          <View style={styles.brandPill}>
            <MaterialCommunityIcons name="shoe-sneaker" size={18} color={Colors.accent} />
            <Text style={styles.brandText}>KIXCLEEN VENDO</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 1 of 3</Text>
          </View>
        </View>

        {/* Hero Visual Card */}
        <View style={styles.heroVisualCard}>
          <View style={styles.heroGlowCircle}>
            <View style={styles.heroInnerIconCircle}>
              <MaterialCommunityIcons name="map-marker-radius" size={54} color={Colors.petrol} />
            </View>
          </View>

          {/* Floating Accents */}
          <View style={styles.floatingTag}>
            <Feather name="check-circle" size={14} color={Colors.accent} />
            <Text style={styles.floatingTagText}>Smart Kiosk Network</Text>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.contentSection}>
          <Text style={styles.mainGreeting}>HI, WELCOME TO KIXCLEEN!</Text>
          <Text style={styles.supportingText}>
            Your smart shoe-cleaning experience starts here. Let&apos;s set up your kiosk location.
          </Text>

          {user?.fullName ? (
            <View style={styles.userBanner}>
              <Feather name="user-check" size={16} color={Colors.petrol} />
              <Text style={styles.userBannerText}>
                Registered as <Text style={{ fontWeight: '700' }}>{user.fullName}</Text>
              </Text>
            </View>
          ) : null}

          {/* Feature Highlights */}
          <View style={styles.highlightsContainer}>
            <View style={styles.highlightRow}>
              <View style={styles.highlightIconBox}>
                <Feather name="crosshair" size={18} color={Colors.primary} />
              </View>
              <View style={styles.highlightTextBox}>
                <Text style={styles.highlightTitle}>Accurate GPS & Pinpoint Location</Text>
                <Text style={styles.highlightDesc}>
                  Register the exact coordinates of your physical kiosk in Zamboanga City.
                </Text>
              </View>
            </View>

            <View style={styles.highlightRow}>
              <View style={styles.highlightIconBox}>
                <Feather name="activity" size={18} color={Colors.accent} />
              </View>
              <View style={styles.highlightTextBox}>
                <Text style={styles.highlightTitle}>Automated Hardware Sync</Text>
                <Text style={styles.highlightDesc}>
                  Link telemetry, water and soap levels, and cash transactions in real time.
                </Text>
              </View>
            </View>

            <View style={styles.highlightRow}>
              <View style={styles.highlightIconBox}>
                <Feather name="shield" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.highlightTextBox}>
                <Text style={styles.highlightTitle}>Dedicated Owner Monitoring</Text>
                <Text style={styles.highlightDesc}>
                  Enjoy full visibility and peace of mind from your mobile dashboard.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Step Indicator Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(onboarding)/location-method')}
        >
          <Text style={styles.primaryButtonText}>GET STARTED</Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.petrol,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stepBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  heroVisualCard: {
    height: 190,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  heroGlowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 210, 180, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInnerIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  floatingTag: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.petrol,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  floatingTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  mainGreeting: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.petrol,
    letterSpacing: 0.3,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  supportingText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 57, 79, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  userBannerText: {
    fontSize: 13,
    color: Colors.petrol,
  },
  highlightsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  highlightIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTextBox: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.petrol,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.petrol,
    height: 52,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
