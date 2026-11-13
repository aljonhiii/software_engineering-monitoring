import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  InteractiveKioskMap,
  LocationCoordinate,
} from '../../components/map/InteractiveKioskMap';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export default function MapSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    initialLat?: string;
    initialLng?: string;
    method?: string;
  }>();

  const initLat = params.initialLat ? parseFloat(params.initialLat) : 6.9214;
  const initLng = params.initialLng ? parseFloat(params.initialLng) : 122.0790;
  const isGpsMethod = params.method === 'gps';

  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinate>({
    latitude: initLat,
    longitude: initLng,
    address: isGpsMethod ? 'Current Detected Position' : 'Gov. Camins Ave (Near KCC Mall)',
    barangay: 'Canelar',
    city: 'Zamboanga City',
    locationName: 'Gov. Camins Ave, Brgy. Canelar',
  });

  const handleLocationChange = (coord: LocationCoordinate) => {
    setSelectedLocation(coord);
  };

  const handleProceed = () => {
    if (!selectedLocation.address || !selectedLocation.address.trim()) {
      Alert.alert(
        'Address Required',
        'Please enter a descriptive street or place address for your kiosk installation point.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/(onboarding)/confirm',
      params: {
        latitude: String(selectedLocation.latitude),
        longitude: String(selectedLocation.longitude),
        address: selectedLocation.address,
        barangay: selectedLocation.barangay || '',
        city: selectedLocation.city || 'Zamboanga City',
        locationName: selectedLocation.locationName || selectedLocation.address,
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
            <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Pinpoint Kiosk Location</Text>
            <Text style={styles.headerSubtitle}>
              {isGpsMethod ? 'GPS Fix Detected' : 'Manual Placement'}
            </Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>
        </View>

        {/* Instructions banner */}
        <View style={styles.instructionsBanner}>
          <Feather name="move" size={16} color={Colors.petrol} />
          <Text style={styles.instructionsText}>
            Tap or drag the map pin to the exact physical spot where the kiosk is positioned.
          </Text>
        </View>

        {/* Interactive Map Component */}
        <InteractiveKioskMap
          initialLatitude={initLat}
          initialLongitude={initLng}
          initialAddress={selectedLocation.address}
          initialBarangay={selectedLocation.barangay}
          onLocationSelect={handleLocationChange}
          height={380}
        />

        {/* Summary Preview Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.pinIconWrap}>
              <MaterialCommunityIcons name="map-marker-check" size={22} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>Confirmed Target Spot</Text>
              <Text style={styles.summaryAddress} numberOfLines={2}>
                {selectedLocation.address || 'Point Selected'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Barangay</Text>
              <Text style={styles.detailVal}>{selectedLocation.barangay || 'Not specified'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>City / Province</Text>
              <Text style={styles.detailVal}>Zamboanga City</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailKey}>Coordinates</Text>
              <Text style={styles.detailValCoord}>
                {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceed}
          activeOpacity={0.85}
        >
          <Text style={styles.proceedButtonText}>PROCEED TO CONFIRMATION</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.petrol,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  instructionsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 57, 79, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.petrol,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  pinIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.petrol,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  summaryAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryDetails: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailValCoord: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.petrol,
    fontFamily: 'monospace',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.petrol,
    height: 52,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});
