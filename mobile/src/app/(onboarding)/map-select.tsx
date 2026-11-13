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
import { Feather } from '@expo/vector-icons';
import {
  InteractiveKioskMap,
  LocationCoordinate,
} from '../../components/map/InteractiveKioskMap';
import { Colors, Spacing } from '../../constants/theme';

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
    address: isGpsMethod ? 'Gov. Camins Ave (Detected GPS Position)' : 'Gov. Camins Ave (Near KCC Mall)',
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

  const formattedAddress = `${selectedLocation.address}${
    selectedLocation.barangay ? `, Brgy. ${selectedLocation.barangay}` : ''
  }, ${selectedLocation.city || 'Zamboanga City'}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar matching Reference 2 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.screenTitle}>Set location</Text>
            <Text style={styles.screenSubtitle}>
              Hi, please confirm your physical kiosk installation location in Zamboanga City.
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Interactive Map */}
        <View style={styles.mapContainer}>
          <InteractiveKioskMap
            initialLatitude={initLat}
            initialLongitude={initLng}
            initialAddress={selectedLocation.address}
            initialBarangay={selectedLocation.barangay}
            onLocationSelect={handleLocationChange}
            height={360}
          />
        </View>

        {/* Inset Address Card matching Reference 2 */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Address</Text>
          <Text style={styles.addressValue} numberOfLines={2}>
            {formattedAddress}
          </Text>
        </View>

        {/* Bottom Section with Stadium Pill Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={handleProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.pillButtonText}>Set My Location</Text>
          </TouchableOpacity>

          {/* Clean Home Indicator Bar */}
          <View style={styles.homeIndicator} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
    paddingTop: Spacing.xs,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: Spacing.xs,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  titleWrapper: {
    alignItems: 'center',
    paddingHorizontal: 40,
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
  mapContainer: {
    marginVertical: Spacing.xs,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  addressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.sm,
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
