import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { registerKioskLocationApi } from '../../api/machineApi';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing } from '../../constants/theme';

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Navigation Bar matching Steps 2 & 3 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.screenTitle}>Review Location</Text>
            <Text style={styles.screenSubtitle}>
              Please verify your kiosk installation details before saving.
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Center Content: Clean Review Card */}
        <View style={styles.mainContent}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color={Colors.red} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.reviewCard}>
            <View style={styles.iconCircle}>
              <Feather name="map-pin" size={22} color={Colors.indigo} />
            </View>

            <Text style={styles.addressTitle}>{address}</Text>
            <Text style={styles.barangaySubtitle}>Brgy. {barangay}, {city}</Text>

            <View style={styles.divider} />

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coordinates</Text>
                <Text style={styles.detailValue}>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Kiosk</Text>
                <Text style={styles.detailValue}>{assignedKioskId}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Owner</Text>
                <Text style={styles.detailValue}>
                  {user?.fullName || user?.username || 'Kiosk Owner'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Action Section */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={handleConfirmLocation}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.pillButtonText}>Confirm Kiosk Location</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Edit Location</Text>
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
    paddingTop: 24, // Matches Steps 2 & 3
    paddingBottom: Spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleWrapper: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.red,
    lineHeight: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  barangaySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  detailsList: {
    width: '100%',
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
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
  secondaryButton: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  homeIndicator: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
  },
});
