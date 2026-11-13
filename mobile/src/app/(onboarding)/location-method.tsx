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
        setGpsError('Location access was not granted. Please select your location manually on the map.');
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
      setGpsError('Unable to detect GPS position. Please check your connection or choose manual map selection.');
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top Header with Safe Area Spacing - Lowered a bit */}
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
              Where would you like to place your KixCleen kiosk?
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Options List - Placed close to top title */}
        <View style={styles.cardsContainer}>
          {gpsError && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={15} color={Colors.red} />
              <Text style={styles.errorBannerText}>{gpsError}</Text>
            </View>
          )}

          {/* Option 1: Current Location */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'gps' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('gps')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconWash,
                selectedMethod === 'gps' && styles.iconWashActive,
              ]}
            >
              <Feather
                name="navigation"
                size={20}
                color={selectedMethod === 'gps' ? '#FFFFFF' : '#64748B'}
              />
            </View>
            <View style={styles.cardTextContent}>
              <Text
                style={[
                  styles.cardTitle,
                  selectedMethod === 'gps' && styles.cardTitleActive,
                ]}
              >
                Use current location
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  selectedMethod === 'gps' && styles.cardSubtitleActive,
                ]}
              >
                Detect your physical GPS coordinates standing at the kiosk installation spot.
              </Text>
            </View>
            <View
              style={[
                styles.radioRing,
                selectedMethod === 'gps' && styles.radioRingActive,
              ]}
            >
              {selectedMethod === 'gps' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {/* Option 2: Select Manually */}
          <TouchableOpacity
            style={[
              styles.methodCard,
              selectedMethod === 'manual' && styles.methodCardActive,
            ]}
            onPress={() => setSelectedMethod('manual')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconWash,
                selectedMethod === 'manual' && styles.iconWashActive,
              ]}
            >
              <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={22}
                color={selectedMethod === 'manual' ? '#FFFFFF' : '#64748B'}
              />
            </View>
            <View style={styles.cardTextContent}>
              <Text
                style={[
                  styles.cardTitle,
                  selectedMethod === 'manual' && styles.cardTitleActive,
                ]}
              >
                Select manually on map
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  selectedMethod === 'manual' && styles.cardSubtitleActive,
                ]}
              >
                Browse Zamboanga City barangays and drag the pin to your exact kiosk setup point.
              </Text>
            </View>
            <View
              style={[
                styles.radioRing,
                selectedMethod === 'manual' && styles.radioRingActive,
              ]}
            >
              {selectedMethod === 'manual' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* 3 Minimal Carousel Dots (Second Dot Active) */}
          <View style={styles.dotsRow}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>

          {/* Stadium Pill Button */}
          <TouchableOpacity
            style={styles.pillButton}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={isRequestingGps}
          >
            {isRequestingGps ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.pillButtonText}>Continue</Text>
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
    paddingTop: 24, // Lowered a bit from top
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
  cardsContainer: {
    gap: 14,
    flex: 1,
    paddingTop: 16, // Places options close to header
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  methodCardActive: {
    borderColor: Colors.indigo,
    borderWidth: 2,
    backgroundColor: 'rgba(79, 70, 229, 0.05)',
    shadowColor: Colors.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWash: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWashActive: {
    backgroundColor: Colors.indigo,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardTitleActive: {
    color: Colors.indigo,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  cardSubtitleActive: {
    color: '#4338CA',
    fontWeight: '500',
  },
  radioRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingActive: {
    borderColor: Colors.indigo,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.indigo,
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
