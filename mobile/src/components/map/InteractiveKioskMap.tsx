import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  address?: string;
  barangay?: string;
  city?: string;
  locationName?: string;
}

interface InteractiveKioskMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  initialAddress?: string;
  initialBarangay?: string;
  onLocationSelect: (coord: LocationCoordinate) => void;
  height?: number | string;
}

const DEFAULT_LAT = 6.9214;
const DEFAULT_LNG = 122.0790;
const DEFAULT_CITY = 'Zamboanga City';

// Popular barangays/landmarks in Zamboanga City for quick navigation
const POPULAR_AREAS = [
  { name: 'Canelar / KCC', lat: 6.9214, lng: 122.0790, brgy: 'Canelar' },
  { name: 'Pueblo / City Hall', lat: 6.9042, lng: 122.0738, brgy: 'Zone IV (Poblacion)' },
  { name: 'Tetuan', lat: 6.9248, lng: 122.0915, brgy: 'Tetuan' },
  { name: 'Guiwan', lat: 6.9387, lng: 122.1025, brgy: 'Guiwan' },
  { name: 'Pasonanca', lat: 6.9530, lng: 122.0745, brgy: 'Pasonanca' },
  { name: 'Santa Maria', lat: 6.9312, lng: 122.0684, brgy: 'Santa Maria' },
  { name: 'Tumaga', lat: 6.9395, lng: 122.0831, brgy: 'Tumaga' },
];

function generateLeafletHTML(lat: number, lng: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #e5e7eb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .custom-kiosk-pin {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-pulse {
      position: absolute;
      width: 36px;
      height: 36px;
      background: rgba(79, 70, 229, 0.25);
      border-radius: 50%;
      animation: pulse 1.8s infinite ease-out;
      top: -18px;
      left: -18px;
    }
    .pin-body {
      position: absolute;
      top: -34px;
      left: -17px;
      width: 34px;
      height: 34px;
      background: #4F46E5;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-center {
      width: 10px;
      height: 10px;
      background: #FFFFFF;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};
    
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([currentLat, currentLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: 'custom-kiosk-pin',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
      html: '<div class="pin-pulse"></div><div class="pin-body"><div class="pin-center"></div></div>'
    });

    var marker = L.marker([currentLat, currentLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    function notifyPosition(lat, lng) {
      var msg = JSON.stringify({ type: 'LOCATION_CHANGED', latitude: lat, longitude: lng });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(msg, '*');
      }
    }

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      notifyPosition(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyPosition(e.latlng.lat, e.latlng.lng);
    });

    window.updatePin = function(newLat, newLng) {
      marker.setLatLng([newLat, newLng]);
      map.setView([newLat, newLng], 16, { animate: true });
    };

    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data && data.action === 'SET_CENTER') {
          updatePin(data.latitude, data.longitude);
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
  `;
}

export function InteractiveKioskMap({
  initialLatitude = DEFAULT_LAT,
  initialLongitude = DEFAULT_LNG,
  initialAddress = '',
  initialBarangay = '',
  onLocationSelect,
  height = 360,
}: InteractiveKioskMapProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [address, setAddress] = useState<string>(initialAddress);
  const [barangay, setBarangay] = useState<string>(initialBarangay);
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const webIframeRef = useRef<any>(null);
  const nativeWebviewRef = useRef<any>(null);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        panToLocation(pos.coords.latitude, pos.coords.longitude);
      }
    } catch (e) {
      console.warn('Could not locate user:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const fallbackAddress = useCallback(
    (lat: number, lng: number) => {
      const defaultAddr = address || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: defaultAddr,
        barangay: barangay || '',
        city: DEFAULT_CITY,
        locationName: barangay ? `${defaultAddr}, Brgy. ${barangay}` : defaultAddr,
      });
    },
    [address, barangay, onLocationSelect]
  );

  // Reverse geocode via Nominatim when coordinates change
  const resolveAddressFromCoords = useCallback(
    async (lat: number, lng: number) => {
      setIsResolvingAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'KixCleenMobileApp/1.0',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const road = data.address?.road || data.address?.pedestrian || '';
          const suburb = data.address?.suburb || data.address?.quarter || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || DEFAULT_CITY;

          let resolvedAddr = road;
          if (!resolvedAddr) {
            resolvedAddr = data.display_name?.split(',')[0] || `Point at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          }

          const detectedBrgy = suburb || barangay || '';
          setAddress(resolvedAddr);
          if (detectedBrgy) setBarangay(detectedBrgy);

          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: resolvedAddr,
            barangay: detectedBrgy,
            city,
            locationName: detectedBrgy ? `${resolvedAddr}, Brgy. ${detectedBrgy}` : resolvedAddr,
          });
        } else {
          fallbackAddress(lat, lng);
        }
      } catch {
        fallbackAddress(lat, lng);
      } finally {
        setIsResolvingAddress(false);
      }
    },
    [barangay, fallbackAddress, onLocationSelect]
  );

  const handleCoordinateUpdate = useCallback(
    (newLat: number, newLng: number) => {
      setCoords({ latitude: newLat, longitude: newLng });
      resolveAddressFromCoords(newLat, newLng);
    },
    [resolveAddressFromCoords]
  );

  // Listen for iframe postMessage on Web platform
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data && data.type === 'LOCATION_CHANGED') {
            handleCoordinateUpdate(data.latitude, data.longitude);
          }
        } catch {
          // ignore non-JSON messages
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [handleCoordinateUpdate]);

  // Handle message from React Native WebView on native platforms
  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'LOCATION_CHANGED') {
        handleCoordinateUpdate(data.latitude, data.longitude);
      }
    } catch (e) {
      console.warn('Failed to parse webview message:', e);
    }
  };

  const panToLocation = (lat: number, lng: number, brgyName?: string) => {
    setCoords({ latitude: lat, longitude: lng });
    if (brgyName) setBarangay(brgyName);
    resolveAddressFromCoords(lat, lng);

    const msg = JSON.stringify({ action: 'SET_CENTER', latitude: lat, longitude: lng });
    if (Platform.OS === 'web' && webIframeRef.current) {
      try {
        webIframeRef.current.contentWindow?.postMessage(msg, '*');
      } catch {}
    } else if (nativeWebviewRef.current) {
      nativeWebviewRef.current.postMessage(msg);
    }
  };

  const leafletHtml = generateLeafletHTML(coords.latitude, coords.longitude);

  return (
    <View style={styles.container}>
      {/* Quick Area Jump Pills */}
      <View style={styles.quickAreaContainer}>
        <Text style={styles.quickAreaLabel}>Quick jump in Zamboanga City:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaScroll}>
          {POPULAR_AREAS.map((area, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.areaChip,
                coords.latitude === area.lat && styles.areaChipActive,
              ]}
              onPress={() => panToLocation(area.lat, area.lng, area.brgy)}
            >
              <Feather
                name="map-pin"
                size={12}
                color={coords.latitude === area.lat ? Colors.textWhite : Colors.petrol}
              />
              <Text
                style={[
                  styles.areaChipText,
                  coords.latitude === area.lat && styles.areaChipTextActive,
                ]}
              >
                {area.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Map View Frame */}
      <View style={[styles.mapFrame, { height: typeof height === 'number' ? height : 360 }]}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={webIframeRef}
            srcDoc={leafletHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Kiosk Interactive Map"
          />
        ) : (
          <WebView
            ref={nativeWebviewRef}
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            onMessage={handleNativeMessage}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}

        {/* Live Coordinate Badge Overlay */}
        <View style={styles.coordsFloatingBadge}>
          <Feather name="navigation" size={13} color={Colors.accent} />
          <Text style={styles.coordsText}>
            Lat: {coords.latitude.toFixed(5)}, Lng: {coords.longitude.toFixed(5)}
          </Text>
          {isResolvingAddress && <ActivityIndicator size="small" color={Colors.accent} style={{ marginLeft: 4 }} />}
        </View>

        {/* Floating Instruction Overlay */}
        <View style={styles.tipOverlay}>
          <Feather name="info" size={12} color={Colors.textSecondary} />
          <Text style={styles.tipText}>Tap map or drag the pin to set kiosk installation point</Text>
        </View>

        {/* Floating Crosshair Button matching reference */}
        <TouchableOpacity
          style={styles.gpsCrosshairBtn}
          onPress={handleLocateMe}
          activeOpacity={0.8}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={Colors.indigo} />
          ) : (
            <Feather name="crosshair" size={20} color={Colors.indigo} />
          )}
        </TouchableOpacity>
      </View>

      {/* Address & Barangay Manual Overrides */}
      <View style={styles.detailsCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Selected Street / Location Address</Text>
          <View style={styles.inputRow}>
            <Feather name="map-pin" size={16} color={Colors.petrol} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={address}
              placeholder="e.g. Gov. Camins Ave (Near Entrance)"
              placeholderTextColor={Colors.textMuted}
              onChangeText={(text) => {
                setAddress(text);
                onLocationSelect({
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  address: text,
                  barangay,
                  city: DEFAULT_CITY,
                  locationName: barangay ? `${text}, Brgy. ${barangay}` : text,
                });
              }}
            />
          </View>
        </View>

        <View style={styles.rowTwoCols}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
            <Text style={styles.inputLabel}>Barangay</Text>
            <View style={styles.inputRow}>
              <Feather name="home" size={15} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={barangay}
                placeholder="e.g. Canelar"
                placeholderTextColor={Colors.textMuted}
                onChangeText={(text) => {
                  setBarangay(text);
                  onLocationSelect({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    address,
                    barangay: text,
                    city: DEFAULT_CITY,
                    locationName: text ? `${address}, Brgy. ${text}` : address,
                  });
                }}
              />
            </View>
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
            <Text style={styles.inputLabel}>City</Text>
            <View style={[styles.inputRow, styles.inputRowDisabled]}>
              <Feather name="globe" size={15} color={Colors.textSecondary} style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{DEFAULT_CITY}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  quickAreaContainer: {
    marginBottom: Spacing.sm,
  },
  quickAreaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  areaScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaChipActive: {
    backgroundColor: Colors.petrol,
    borderColor: Colors.petrol,
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.petrol,
  },
  areaChipTextActive: {
    color: Colors.textWhite,
  },
  mapFrame: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  webview: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  coordsFloatingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(16, 57, 79, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  coordsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tipOverlay: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  gpsCrosshairBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    height: 44,
  },
  inputRowDisabled: {
    backgroundColor: '#EDF2F7',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  readOnlyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
});
