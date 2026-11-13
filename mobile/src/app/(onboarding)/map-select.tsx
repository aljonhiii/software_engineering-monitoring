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
} from '../../components/map/InteractiveKioskMap';
import {
  BarangayDropdownPicker,
  SelectedPlace,
} from '../../components/map/BarangayDropdownPicker';
import {
  findNearestBarangay,
} from '../../constants/zamboangaBarangays';
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

  // Identify nearest official barangay from our 98 catalog
  const nearestBarangay = findNearestBarangay(initLat, initLng);

  const initialAddress = isGpsMethod
    ? 'Detected Current Position'
    : (nearestBarangay.landmark || `Brgy. ${nearestBarangay.name}`);

  const initialBarangay = nearestBarangay.name;

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

  const handleDropdownSelect = (place: SelectedPlace) => {
    const updatedAddress = place.address || (place.barangay ? `Brgy. ${place.barangay}` : 'Zamboanga City');
    setSelectedLocation({
      latitude: place.lat,
      longitude: place.lng,
      address: updatedAddress,
      barangay: place.barangay,
      city: 'Zamboanga City',
      locationName: `${updatedAddress}, Brgy. ${place.barangay}`,
    });
    setAddressInput(updatedAddress);
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
        method: isGpsMethod ? 'gps' : 'manual',
      },
    });
  };

  // Dynamic map height so all elements fit cleanly without scrolling
  const mapHeight = SCREEN_HEIGHT > 780 ? 300 : SCREEN_HEIGHT > 680 ? 250 : 200;

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

        {/* Center Content: Instruction, Dropdown, Map & Address Card */}
        <View style={styles.mainContent}>
          {/* Instruction Panel */}
          <View style={styles.instructionPanel}>
            <Text style={styles.instructionTitle}>Pinpoint your kiosk location</Text>
            <Text style={styles.instructionBody}>
              Move the marker to the exact spot where your kiosk will be placed. Zoom in for precision.
            </Text>
          </View>

          {/* Dropdown Selector for All 98 Barangays & Live Map Places */}
          <BarangayDropdownPicker
            selectedBarangay={selectedLocation.barangay || 'Canelar'}
            selectedAddress={addressInput}
            onSelect={handleDropdownSelect}
          />

          {/* Interactive Map */}
          <InteractiveKioskMap
            initialLatitude={selectedLocation.latitude}
            initialLongitude={selectedLocation.longitude}
            initialAddress={selectedLocation.address}
            initialBarangay={selectedLocation.barangay}
            onLocationSelect={handleLocationChange}
            height={mapHeight}
            showQuickChips={false}
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
    paddingTop: 24, // Lowered a bit to match Step 2
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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  instructionBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    marginTop: 10,
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
