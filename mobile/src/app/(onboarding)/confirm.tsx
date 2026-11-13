import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { registerKioskLocationApi } from '../../api/machineApi';
import { useAuth } from '../../context/AuthContext';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export default function ConfirmLocationScreen() {
  const router = useRouter();
  const { user, completeOnboarding } = useAuth();
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    address: string;
    barangay?: string;
    city?: string;
    locationName?: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const latitude = params.latitude ? parseFloat(params.latitude) : 6.9214;
  const longitude = params.longitude ? parseFloat(params.longitude) : 122.0790;
  const address = params.address || 'Gov. Camins Ave (Near KCC Mall)';
  const barangay = params.barangay || 'Canelar';
  const city = params.city || 'Zamboanga City';
  const locationName = params.locationName || `${address}, Brgy. ${barangay}`;
  const assignedKioskId = user?.assignedKioskIds?.[0] || 'KIOSK-01-MAIN';

  const handleConfirmLocation = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await registerKioskLocationApi({
        kioskId: assignedKioskId,
        latitude,
        longitude,
        address,
        barangay,
        city,
        locationName,
      });

      setIsSubmitting(false);

      if (res.success) {
        // Mark onboarding completed in Auth state
        completeOnboarding(res.kiosk);

        Alert.alert(
          'Kiosk Location Confirmed! 🎉',
          `Your KixCleen kiosk location has been successfully registered at ${address}, Zamboanga City. Welcome to your owner monitoring dashboard!`,
          [
            {
              text: 'Open Dashboard',
              onPress: () => {
                router.replace('/(tabs)');
              },
            },
          ]
        );
      } else {
        setErrorMessage(res.message || 'Failed to register kiosk location. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      console.error('Error confirming kiosk location:', err);
      setErrorMessage(err.message || 'Network error while saving location. Please verify backend connection.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Review Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero Illustration Header */}
        <View style={styles.headerHero}>
          <View style={styles.kioskIconBadge}>
            <MaterialCommunityIcons name="store-marker-outline" size={38} color={Colors.petrol} />
          </View>
          <Text style={styles.mainTitle}>Confirm Kiosk Location</Text>
          <Text style={styles.subTitle}>
            Review your physical kiosk setup details before finalizing your account.
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Feather name="alert-triangle" size={16} color={Colors.red} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.reviewCard}>
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Feather name="map-pin" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Physical Address</Text>
            </View>
            <Text style={styles.addressDisplay}>{address}</Text>
            <Text style={styles.subAddressDisplay}>
              Brgy. {barangay}, {city}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Feather name="crosshair" size={16} color={Colors.accent} />
              <Text style={styles.sectionTitle}>GPS Geo-Coordinates</Text>
            </View>
            <View style={styles.coordBox}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Latitude</Text>
                <Text style={styles.coordValue}>{latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>Longitude</Text>
                <Text style={styles.coordValue}>{longitude.toFixed(6)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Feather name="cpu" size={16} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Hardware Association</Text>
            </View>
            <View style={styles.hardwareRow}>
              <Text style={styles.hardwareLabel}>Assigned Machine:</Text>
              <View style={styles.hardwarePill}>
                <Text style={styles.hardwarePillText}>{assignedKioskId}</Text>
              </View>
            </View>
            <View style={styles.hardwareRow}>
              <Text style={styles.hardwareLabel}>Registered Owner:</Text>
              <Text style={styles.hardwareValue}>{user?.fullName || user?.username || 'Owner'}</Text>
            </View>
          </View>
        </View>

        {/* Confirmation Guarantee Badge */}
        <View style={styles.guaranteeBadge}>
          <Feather name="check-circle" size={15} color={Colors.accent} />
          <Text style={styles.guaranteeText}>
            This location will be saved permanently and used for customer navigation and telemetry.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmButtonText}>CONFIRM KIOSK LOCATION</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={16} color={Colors.petrol} style={{ marginRight: 6 }} />
            <Text style={styles.editButtonText}>EDIT LOCATION</Text>
          </TouchableOpacity>
        </View>
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
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.petrol,
  },
  headerHero: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  kioskIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 57, 79, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.petrol,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.red,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  cardSection: {
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressDisplay: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subAddressDisplay: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  coordBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  coordItem: {
    flex: 1,
    alignItems: 'center',
  },
  coordDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  coordLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.petrol,
    fontFamily: 'monospace',
  },
  hardwareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  hardwareLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  hardwarePill: {
    backgroundColor: 'rgba(16, 57, 79, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  hardwarePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.petrol,
    fontFamily: 'monospace',
  },
  hardwareValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 210, 180, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 180, 0.3)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.petrol,
    lineHeight: 16,
  },
  actionContainer: {
    gap: Spacing.sm,
  },
  confirmButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.indigo,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  editButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: Colors.petrol,
    fontSize: 13,
    fontWeight: '700',
  },
});
