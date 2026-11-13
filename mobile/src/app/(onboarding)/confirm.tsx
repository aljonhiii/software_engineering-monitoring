import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { registerKioskLocationApi } from '../../api/machineApi';
import { useAuth } from '../../context/AuthContext';
import {
  InteractiveKioskMap,
} from '../../components/map/InteractiveKioskMap';
import { Colors, Spacing } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    method?: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const latitude = params.latitude ? parseFloat(params.latitude) : 6.9214;
  const longitude = params.longitude ? parseFloat(params.longitude) : 122.0790;
  const address = params.address || 'Gov. Camins Ave (Near KCC Mall)';
  const barangay = params.barangay || 'Canelar';
  const city = params.city || 'Zamboanga City';
  const locationName = params.locationName || `${address}, Brgy. ${barangay}`;
  const method = params.method || 'manual';
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

  const mapPreviewHeight = SCREEN_HEIGHT > 780 ? 160 : 130;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.screenTitle}>Your kiosk&apos;s location</Text>
            <Text style={styles.screenSubtitle}>
              Review your selected installation site. Make sure everything is correct before saving.
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color={Colors.red} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* B. Map Preview Card */}
          <View style={styles.mapPreviewCard}>
            <View style={styles.mapClip}>
              <InteractiveKioskMap
                initialLatitude={latitude}
                initialLongitude={longitude}
                initialAddress={address}
                initialBarangay={barangay}
                onLocationSelect={() => {}}
                height={mapPreviewHeight}
                showQuickChips={false}
                showDetailsCard={false}
              />
              {/* Touch-blocking overlay to prevent interaction */}
              <View style={styles.mapOverlay} />
            </View>
            <View style={styles.mapPreviewInfo}>
              <Feather name="map-pin" size={16} color={Colors.indigo} />
              <View style={styles.mapPreviewText}>
                <Text style={styles.mapPreviewAddress}>{address}</Text>
                <Text style={styles.mapPreviewBarangay}>
                  Brgy. {barangay}, {city}
                </Text>
              </View>
            </View>
          </View>

          {/* C. Location Details Section */}
          <View style={styles.detailsBox}>
            <DetailRow
              icon="navigation"
              label="Method"
              value={method === 'gps' ? 'GPS Detection' : 'Manual Selection'}
            />
            <DetailRow
              icon="crosshair"
              label="Latitude"
              value={latitude.toFixed(5)}
            />
            <DetailRow
              icon="crosshair"
              label="Longitude"
              value={longitude.toFixed(5)}
            />
            <DetailRow
              icon="map-pin"
              label="Address"
              value={`${address}, Brgy. ${barangay}`}
            />
          </View>

          {/* D. Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoBoxHeader}>
              <Feather name="info" size={14} color={Colors.indigo} />
              <Text style={styles.infoBoxTitle}>Before you confirm</Text>
            </View>
            <Text style={styles.infoBoxBody}>
              Make sure this pin marks the actual spot where your KixCleen kiosk will be installed. Your registered location will be used for kiosk monitoring and management.
            </Text>
          </View>

          {/* E. Confirmation Section */}
          <View style={styles.confirmSection}>
            <Text style={styles.confirmTitle}>Everything look correct?</Text>
            <Text style={styles.confirmSubtitle}>
              Once confirmed, your kiosk location is saved to your owner account.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action Section (fixed) */}
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
              <Text style={styles.pillButtonText}>Confirm Location</Text>
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

          <View style={styles.homeIndicator} />
        </View>
      </View>
    </SafeAreaView>
  );
}

/* Reusable detail row component */
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.row}>
      <View style={detailStyles.iconCircle}>
        <Feather name={icon} size={13} color={Colors.indigo} />
      </View>
      <View style={detailStyles.textBlock}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingTop: 24,
    paddingBottom: Spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 14,
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
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.red,
    lineHeight: 16,
  },

  // B. Map Preview Card
  mapPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  mapClip: {
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'relative',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  mapPreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mapPreviewText: {
    flex: 1,
  },
  mapPreviewAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 1,
  },
  mapPreviewBarangay: {
    fontSize: 12,
    color: '#64748B',
  },

  // C. Details Box
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },

  // D. Info Box
  infoBox: {
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.indigo,
    padding: 12,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.indigo,
  },
  infoBoxBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  // E. Confirmation Section
  confirmSection: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Bottom
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingBottom: Spacing.xs,
    paddingTop: 8,
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
