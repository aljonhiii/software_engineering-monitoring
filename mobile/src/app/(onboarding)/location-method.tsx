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
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export default function LocationMethodScreen() {
  const router = useRouter();
  const [isRequestingGps, setIsRequestingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    setGpsError(null);
    setIsRequestingGps(true);

    try {
      // 1. Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsRequestingGps(false);
        setGpsError(
          'Location permission was denied. You can still select your kiosk location manually on the map.'
        );
        Alert.alert(
          'Permission Required',
          'GPS location access was not granted. Please choose "SELECT LOCATION MANUALLY" or enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // 2. Fetch current GPS position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setIsRequestingGps(false);

      // 3. Navigate to map review with detected coordinates
      router.push({
        pathname: '/(onboarding)/map-select',
        params: {
          initialLat: String(lat),
          initialLng: String(lng),
          method: 'gps',
        },
      });
    } catch (err: any) {
      console.warn('GPS location fetch error:', err);
      setIsRequestingGps(false);
      setGpsError(
        'Unable to detect GPS position. Please verify device location services are enabled, or select your location manually.'
      );
      Alert.alert(
        'Location Service Unavailable',
        'Could not obtain an accurate GPS fix. You can pinpoint your location manually on the interactive map.',
        [
          {
            text: 'Select Manually',
            onPress: () => router.push('/(onboarding)/map-select'),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSelectManually = () => {
    router.push({
      pathname: '/(onboarding)/map-select',
      params: {
        method: 'manual',
      },
    });
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
            <Feather name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Screen Heading */}
        <View style={styles.headingSection}>
          <Text style={styles.mainHeading}>
            Where would you like to place your KixCleen kiosk?
          </Text>
          <Text style={styles.subHeading}>
            Choose how you want to register your kiosk&apos;s physical location. You can use your current
            location or manually select a location on the map.
          </Text>
        </View>

        {gpsError && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={Colors.red} />
            <Text style={styles.errorBannerText}>{gpsError}</Text>
          </View>
        )}

        {/* Option 1: Use Current Location */}
        <View style={styles.methodCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
              <Feather name="navigation" size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>OPTION 1</Text>
              <Text style={styles.cardSubtitle}>Use My Current Location</Text>
            </View>
          </View>

          <Text style={styles.cardBodyText}>
            Detect your device&apos;s exact GPS coordinates and review the installation marker on the map.
          </Text>

          {/* Important GPS Instruction */}
          <View style={styles.advisoryNotice}>
            <Feather name="info" size={16} color={Colors.petrol} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.advisoryNoticeTitle}>Important Note:</Text>
              <Text style={styles.advisoryNoticeText}>
                Make sure you are physically standing at the exact location where you want to install
                your KixCleen kiosk before using this option.
              </Text>
              <Text style={[styles.advisoryNoticeText, { marginTop: 4, fontStyle: 'italic' }]}>
                The detected coordinates represent your device&apos;s current position, not automatically
                the entire property or installation area.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.gpsBtn]}
            onPress={handleUseCurrentLocation}
            disabled={isRequestingGps}
            activeOpacity={0.85}
          >
            {isRequestingGps ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="crosshair" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>USE MY CURRENT LOCATION</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Option 2: Select Location Manually */}
        <View style={styles.methodCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 210, 180, 0.15)' }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={26} color={Colors.petrol} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>OPTION 2</Text>
              <Text style={styles.cardSubtitle}>Select Location Manually</Text>
            </View>
          </View>

          <Text style={styles.cardBodyText}>
            Search or browse Zamboanga City barangays and drag the pin to your exact kiosk setup spot.
          </Text>

          {/* Important Manual Instruction */}
          <View style={[styles.advisoryNotice, { backgroundColor: '#F8FAFC', borderColor: Colors.border }]}>
            <Feather name="alert-triangle" size={16} color="#D97706" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.advisoryNoticeTitle, { color: '#B45309' }]}>Precise Pinpoint Required:</Text>
              <Text style={styles.advisoryNoticeText}>
                Do not automatically assume that the center of the city or barangay is the kiosk&apos;s actual location. You must manually identify and confirm the exact installation point.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.manualBtn]}
            onPress={handleSelectManually}
            activeOpacity={0.85}
          >
            <Feather name="map" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>SELECT LOCATION MANUALLY</Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicator Dots */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headingSection: {
    marginBottom: Spacing.lg,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.petrol,
    lineHeight: 28,
    marginBottom: Spacing.xs,
  },
  subHeading: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  errorBanner: {
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
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.red,
    lineHeight: 16,
  },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.xs,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.petrol,
  },
  cardBodyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: Spacing.sm,
  },
  advisoryNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(16, 57, 79, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 57, 79, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  advisoryNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.petrol,
    marginBottom: 2,
  },
  advisoryNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  actionBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsBtn: {
    backgroundColor: Colors.indigo,
  },
  manualBtn: {
    backgroundColor: '#1E293B',
    shadowColor: '#1E293B',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.indigo,
  },
});
