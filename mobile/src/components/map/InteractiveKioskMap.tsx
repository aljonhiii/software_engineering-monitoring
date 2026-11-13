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
  showQuickChips?: boolean;
  showDetailsCard?: boolean;
}

const DEFAULT_LAT = 6.9214;
const DEFAULT_LNG = 122.0790;
const DEFAULT_CITY = 'Zamboanga City';

// Accurate popular landmarks in Zamboanga City with precise coordinates & barangays
export const POPULAR_AREAS = [
  {
    id: 'canelar',
    name: 'Canelar / KCC',
    lat: 6.9214,
    lng: 122.0790,
    brgy: 'Canelar',
    address: 'Gov. Camins Ave (Near KCC Mall)',
  },
  {
    id: 'pueblo',
    name: 'Pueblo / City Hall',
    lat: 6.9042,
    lng: 122.0738,
    brgy: 'Zone IV (Poblacion)',
    address: 'N.S. Valderrosa St (City Hall)',
  },
  {
    id: 'tetuan',
    name: 'Tetuan',
    lat: 6.9248,
    lng: 122.0915,
    brgy: 'Tetuan',
    address: 'Veterans Ave / Don Alfaro St',
  },
  {
    id: 'guiwan',
    name: 'Guiwan',
    lat: 6.9387,
    lng: 122.1025,
    brgy: 'Guiwan',
    address: 'MCLL Highway, Guiwan',
  },
  {
    id: 'santamaria',
    name: 'Santa Maria',
    lat: 6.9312,
    lng: 122.0684,
    brgy: 'Santa Maria',
    address: 'Santa Maria Road',
  },
  {
    id: 'pasonanca',
    name: 'Pasonanca',
    lat: 6.9530,
    lng: 122.0745,
    brgy: 'Pasonanca',
    address: 'Pasonanca Road',
  },
  {
    id: 'tumaga',
    name: 'Tumaga',
    lat: 6.9395,
    lng: 122.0831,
    brgy: 'Tumaga',
    address: 'Tumaga Por Centro',
  },
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
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};
    
    // zoomControl is disabled for clean native look matching reference design
    var map = L.map('map', {
      zoomControl: false,
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
  height = 320,
  showQuickChips = true,
  showDetailsCard = false,
}: InteractiveKioskMapProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [address, setAddress] = useState<string>(initialAddress);
  const [barangay, setBarangay] = useState<string>(initialBarangay);
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
      const defaultAddr = address || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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

  // Update map center and pin if parent supplies new coordinates (e.g. from dropdown)
  useEffect(() => {
    if (
      Math.abs(initialLatitude - coords.latitude) > 0.0001 ||
      Math.abs(initialLongitude - coords.longitude) > 0.0001
    ) {
      setCoords({ latitude: initialLatitude, longitude: initialLongitude });
      if (initialBarangay) setBarangay(initialBarangay);
      if (initialAddress) setAddress(initialAddress);

      const msg = JSON.stringify({ action: 'SET_CENTER', latitude: initialLatitude, longitude: initialLongitude });
      if (Platform.OS === 'web' && webIframeRef.current) {
        try {
          webIframeRef.current.contentWindow?.postMessage(msg, '*');
        } catch {}
      } else if (nativeWebviewRef.current) {
        nativeWebviewRef.current.postMessage(msg);
      }
    }
  }, [initialLatitude, initialLongitude, initialBarangay, initialAddress, coords.latitude, coords.longitude]);

  // Reverse geocode via Nominatim when coordinates change through manual dragging
  const resolveAddressFromCoords = useCallback(
    async (lat: number, lng: number) => {
      try {
        // First check if coordinates match any preset area
        const matchedArea = POPULAR_AREAS.find((area) => {
          const dLat = Math.abs(area.lat - lat);
          const dLng = Math.abs(area.lng - lng);
          return dLat < 0.003 && dLng < 0.003;
        });

        if (matchedArea) {
          setAddress(matchedArea.address);
          setBarangay(matchedArea.brgy);
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: matchedArea.address,
            barangay: matchedArea.brgy,
            city: DEFAULT_CITY,
            locationName: `${matchedArea.address}, Brgy. ${matchedArea.brgy}`,
          });
          return;
        }

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

          // Pick most accurate barangay for Zamboanga City
          let detectedBrgy = suburb;
          if (!detectedBrgy) {
            let closest = POPULAR_AREAS[0];
            let minDist = Infinity;
            for (const a of POPULAR_AREAS) {
              const dist = Math.hypot(a.lat - lat, a.lng - lng);
              if (dist < minDist) {
                minDist = dist;
                closest = a;
              }
            }
            detectedBrgy = closest.brgy;
          }

          setAddress(resolvedAddr);
          setBarangay(detectedBrgy);

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
      }
    },
    [fallbackAddress, onLocationSelect]
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

  const panToLocation = (lat: number, lng: number, brgyName?: string, customAddress?: string) => {
    setCoords({ latitude: lat, longitude: lng });
    const targetBrgy = brgyName || barangay;
    const targetAddr = customAddress || address;

    if (brgyName) setBarangay(brgyName);
    if (customAddress) setAddress(customAddress);

    // If preset address and barangay provided, synchronously notify without Nominatim overwrite
    if (customAddress && brgyName) {
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        address: targetAddr,
        barangay: targetBrgy,
        city: DEFAULT_CITY,
        locationName: `${targetAddr}, Brgy. ${targetBrgy}`,
      });
    } else {
      resolveAddressFromCoords(lat, lng);
    }

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
      {showQuickChips && (
        <View style={styles.quickAreaContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaScroll}>
            {POPULAR_AREAS.map((area, idx) => {
              const isActive = Math.abs(coords.latitude - area.lat) < 0.001 && Math.abs(coords.longitude - area.lng) < 0.001;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.areaChip,
                    isActive && styles.areaChipActive,
                  ]}
                  onPress={() => panToLocation(area.lat, area.lng, area.brgy, area.address)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="map-pin"
                    size={11}
                    color={isActive ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.areaChipText,
                      isActive && styles.areaChipTextActive,
                    ]}
                  >
                    {area.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Map View Frame */}
      <View style={[styles.mapFrame, { height: typeof height === 'number' ? height : 300 }]}>
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

      {/* Address & Barangay Manual Overrides (if enabled) */}
      {showDetailsCard && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  quickAreaContainer: {
    marginBottom: 10,
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaChipActive: {
    backgroundColor: Colors.indigo,
    borderColor: Colors.indigo,
  },
  areaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  areaChipTextActive: {
    color: '#FFFFFF',
  },
  mapFrame: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Shadows.small,
  },
  webview: {
    flex: 1,
    backgroundColor: '#e5e7eb',
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
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
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
