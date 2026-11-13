import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing } from '../../constants/theme';

export default function LocationMethodScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'gps' | 'manual'>('gps');
  const [isRequestingGps, setIsRequestingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (selectedMethod === 'manual') {
      router.push({
        pathname: '/(onboarding)/map-select',
        params: { method: 'manual' },
      });
      return;
    }

    // Selected GPS method
    setGpsError(null);
    setIsRequestingGps(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsRequestingGps(false);
        setGpsError(
          'Location access was not granted. Please select your location manually on the map.'
        );
        Alert.alert(
          'Permission Required',
          'GPS location access was not granted. You can still select your kiosk location manually on the map.',
          [
            {
              text: 'Select Manually',
              onPress: () =>
                router.push({
                  pathname: '/(onboarding)/map-select',
                  params: { method: 'manual' },
                }),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setIsRequestingGps(false);

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
        'Unable to detect GPS position. Please check your connection or choose manual map selection.'
      );
      Alert.alert(
        'GPS Service Unavailable',
        'Could not obtain an accurate GPS fix. You can pinpoint your kiosk location manually on the map.',
        [
          {
            text: 'Select Manually',
            onPress: () =>
              router.push({
                pathname: '/(onboarding)/map-select',
                params: { method: 'manual' },
              }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.screenTitle}>Kiosk Location</Text>
            <Text style={styles.screenSubtitle}>
              Where would you like to place your KixCleen kiosk? Choose how you want to register its spot.
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {gpsError && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color={Colors.red} />
              <Text style={styles.errorBannerText}>{gpsError}</Text>
            </View>
          )}

          {/* Option 1 Card: GPS */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'gps' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('gps')}
            activeOpacity={0.85}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.iconWash,
                  selectedMethod === 'gps' && styles.iconWashActive,
                ]}
              >
                <Feather
                  name="navigation"
                  size={20}
                  color={selectedMethod === 'gps' ? Colors.indigo : '#64748B'}
                />
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.optionTag}>OPTION 1</Text>
                <Text style={styles.cardTitle}>Use My Current Location</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedMethod === 'gps' && styles.radioOuterActive,
                ]}
              >
                {selectedMethod === 'gps' && <View style={styles.radioInner} />}
              </View>
            </View>

            <Text style={styles.cardDescription}>
              Detect your exact coordinates automatically while standing at the kiosk installation point.
            </Text>

            <View style={styles.noteBox}>
              <Feather name="info" size={13} color={Colors.indigo} />
              <Text style={styles.noteText}>
                Make sure you are standing at the exact installation spot.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2 Card: Manual Map */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'manual' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('manual')}
            activeOpacity={0.85}
          >
            <View style={styles.cardTopRow}>
              <View
                style={[
                  styles.iconWash,
                  selectedMethod === 'manual' && styles.iconWashActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={22}
                  color={selectedMethod === 'manual' ? Colors.indigo : '#64748B'}
                />
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.optionTag}>OPTION 2</Text>
                <Text style={styles.cardTitle}>Select Location Manually</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedMethod === 'manual' && styles.radioOuterActive,
                ]}
              >
                {selectedMethod === 'manual' && <View style={styles.radioInner} />}
              </View>
            </View>

            <Text style={styles.cardDescription}>
              Search Zamboanga City barangays and drag the pin to your exact kiosk setup point.
            </Text>

            <View style={styles.noteBox}>
              <Feather name="map" size={13} color="#D97706" />
              <Text style={[styles.noteText, { color: '#92400E' }]}>
                Pinpoint your exact spot manually (do not assume city center).
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* 3 Minimal Carousel Dots (Second Dot Active) */}
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        {/* Bottom Section with Stadium Pill Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.pillButton}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={isRequestingGps}
          >
            {isRequestingGps ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.pillButtonText}>
                {selectedMethod === 'gps' ? 'Use Current Location' : 'Select on Map'}
              </Text>
            )}
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
  scrollContent: {
    paddingVertical: Spacing.xs,
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
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  methodCardActive: {
    borderColor: Colors.indigo,
    backgroundColor: 'rgba(79, 70, 229, 0.03)',
    shadowColor: Colors.indigo,
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconWash: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWashActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  optionTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.indigo,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.indigo,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.indigo,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: Spacing.sm,
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
