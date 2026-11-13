import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  InteractiveKioskMap,
  LocationCoordinate,
  POPULAR_AREAS,
} from '../../components/map/InteractiveKioskMap';
import { Colors, Spacing } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Find if init coords match any known area
  const matchedArea = POPULAR_AREAS.find(
    (a) => Math.abs(a.lat - initLat) < 0.003 && Math.abs(a.lng - initLng) < 0.003
  );

  const initialAddress = isGpsMethod
    ? 'Detected Current Position'
    : (matchedArea?.address || 'Gov. Camins Ave (Near KCC Mall)');

  const initialBarangay = matchedArea?.brgy || 'Canelar';

  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinate>({
    latitude: initLat,
    longitude: initLng,
    address: initialAddress,
    barangay: initialBarangay,
    city: 'Zamboanga City',
    locationName: `${initialAddress}, Brgy. ${initialBarangay}`,
  });

  const [addressInput, setAddressInput] = useState<string>(initialAddress);

  const handleLocationChange = (coord: LocationCoordinate) => {
    setSelectedLocation(coord);
    if (coord.address) {
      setAddressInput(coord.address);
    }
  };

  const handleProceed = () => {
    const finalAddress = addressInput.trim() || selectedLocation.address;
    if (!finalAddress || !finalAddress.trim()) {
      Alert.alert(
        'Address Required',
        'Please enter a street or landmark address for your kiosk installation point.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/(onboarding)/confirm',
      params: {
        latitude: String(selectedLocation.latitude),
        longitude: String(selectedLocation.longitude),
        address: finalAddress,
        barangay: selectedLocation.barangay || '',
        city: selectedLocation.city || 'Zamboanga City',
        locationName: selectedLocation.barangay
          ? `${finalAddress}, Brgy. ${selectedLocation.barangay}`
          : finalAddress,
      },
    });
  };

  // Dynamic map height so all elements fit cleanly without scrolling
  const mapHeight = SCREEN_HEIGHT > 780 ? 330 : SCREEN_HEIGHT > 680 ? 280 : 230;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Navigation Bar matching Step 2 and Reference */}
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

        {/* Center Content: Map & Address Card */}
        <View style={styles.mainContent}>
          {/* Interactive Map with Quick Chips */}
          <InteractiveKioskMap
            initialLatitude={initLat}
            initialLongitude={initLng}
            initialAddress={initialAddress}
            initialBarangay={initialBarangay}
            onLocationSelect={handleLocationChange}
            height={mapHeight}
            showQuickChips={true}
            showDetailsCard={false}
          />

          {/* Inset Address Card matching Reference */}
          <View style={styles.addressCard}>
            <View style={styles.addressLabelRow}>
              <Text style={styles.addressLabel}>Address</Text>
              {selectedLocation.barangay ? (
                <Text style={styles.brgyPill}>Brgy. {selectedLocation.barangay}</Text>
              ) : null}
            </View>
            <TextInput
              style={styles.addressInput}
              value={addressInput}
              onChangeText={setAddressInput}
              placeholder="Enter street, building, or landmark"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Bottom Section (Matching Step 1 and Step 2) */}
        <View style={styles.bottomSection}>
          {/* 3 Minimal Carousel Dots (Third Dot Active) */}
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>

          {/* Stadium Pill Button */}
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  brgyPill: {
    fontSize: 11,
    color: Colors.indigo,
    fontWeight: '600',
  },
  addressInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
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
