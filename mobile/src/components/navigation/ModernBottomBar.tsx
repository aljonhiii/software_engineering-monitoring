import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { OverflowNavModal, OverflowNavItem } from './OverflowNavModal';

// Route configuration mapping for clean icons and labels
const ROUTE_CONFIG: Record<
  string,
  {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    description: string;
  }
> = {
  index: {
    title: 'Dashboard',
    icon: 'speedometer-outline',
    activeIcon: 'speedometer',
    description: 'Fleet operations & live telemetry',
  },
  'transactions/index': {
    title: 'Orders',
    icon: 'receipt-outline',
    activeIcon: 'receipt',
    description: 'Real-time order audit & receipts',
  },
  'payments/index': {
    title: 'Payments',
    icon: 'card-outline',
    activeIcon: 'card',
    description: 'Settled revenue & payment channels',
  },
  'machine/index': {
    title: 'Telemetry',
    icon: 'hardware-chip-outline',
    activeIcon: 'hardware-chip',
    description: 'ESP32 controller & sensor diagnostics',
  },
  'sales/index': {
    title: 'Reports',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
    description: 'Revenue analytics & sales trends',
  },
  'settings/index': {
    title: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
    description: 'Operator account & preferences',
  },
};

export function ModernBottomBar(props: any) {
  const { state, descriptors, emitter, navigateToTab, navigation } = props;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  // Filter out hidden routes (e.g., detail screens like transactions/[id])
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key] || {};
    return options?.href !== null && options?.display !== 'none';
  });

  // Ensure the preferred 4 primary tabs: index, transactions/index, payments/index, machine/index
  const primaryRouteNames = [
    'index',
    'transactions/index',
    'payments/index',
    'machine/index',
  ];

  const primaryRoutes = visibleRoutes.filter((r: any) =>
    primaryRouteNames.includes(r.name)
  );

  const overflowRoutes = visibleRoutes.filter(
    (r: any) => !primaryRouteNames.includes(r.name)
  );

  const currentRoute = state.routes[state.index];
  const isOverflowActive = overflowRoutes.some(
    (r: any) => r.name === currentRoute.name
  );

  const handleTabPress = (route: any) => {
    const isFocused = currentRoute.name === route.name;

    const event =
      emitter?.emit?.({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      }) ||
      descriptors[route.key]?.navigation?.emit?.({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

    if (!isFocused && !event?.defaultPrevented) {
      if (typeof navigateToTab === 'function') {
        navigateToTab(route.key);
      } else if (navigation?.navigate) {
        navigation.navigate(route.name);
      } else {
        // Fallback: Clean path (e.g. "transactions/index" -> "/(tabs)/transactions")
        const cleanPath =
          route.name === 'index'
            ? '/(tabs)'
            : `/(tabs)/${route.name.replace(/\/index$/, '')}`;
        router.navigate(cleanPath as any);
      }
    }
  };

  const overflowItems: OverflowNavItem[] = overflowRoutes.map((route: any) => {
    const cfg = ROUTE_CONFIG[route.name] || {
      title: route.name,
      icon: 'cube-outline',
      description: 'System module',
    };
    return {
      name: route.name,
      title: cfg.title,
      icon: cfg.icon,
      description: cfg.description,
      isActive: currentRoute.name === route.name,
      onPress: () => {
        handleTabPress(route);
      },
    };
  });

  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8);

  return (
    <>
      <View
        style={[
          styles.dockContainer,
          { bottom: bottomOffset },
        ]}
      >
        <View style={styles.dockCapsule}>
          {/* Primary 4 Route Buttons */}
          {primaryRoutes.map((route: any) => {
            const isFocused = currentRoute.name === route.name;
            const cfg = ROUTE_CONFIG[route.name] || {
              icon: 'cube-outline',
              activeIcon: 'cube',
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handleTabPress(route)}
                style={[
                  styles.navItem,
                  isFocused && styles.navItemActive,
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <Ionicons
                  name={isFocused ? cfg.activeIcon : cfg.icon}
                  size={21}
                  color={isFocused ? Colors.accentLime : '#FFFFFF'}
                />
              </TouchableOpacity>
            );
          })}

          {/* 5th Slot: 2x3 Six-Dot Grid Overflow Button */}
          {overflowRoutes.length > 0 && (
            <TouchableOpacity
              onPress={() => setIsOverflowOpen(true)}
              style={[
                styles.navItem,
                isOverflowActive && styles.navItemActive,
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="More navigation options"
            >
              <View style={styles.sixDotGrid}>
                {/* Horizontal row 1: 3 dots */}
                <View style={styles.dotRow}>
                  <View
                    style={[
                      styles.dot,
                      isOverflowActive && styles.dotActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      isOverflowActive && styles.dotActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      isOverflowActive && styles.dotActive,
                    ]}
                  />
                </View>
                {/* Horizontal row 2: 3 dots */}
                <View style={styles.dotRow}>
                  <View
                    style={[
                      styles.dot,
                      isOverflowActive && styles.dotActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      isOverflowActive && styles.dotActive,
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      isOverflowActive && styles.dotActive,
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Floating Rounded Overflow Modal */}
      <OverflowNavModal
        visible={isOverflowOpen}
        onClose={() => setIsOverflowOpen(false)}
        items={overflowItems}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  dockCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#8E8E93', // Modern smoke gray matching user reference
    borderRadius: 36,
    paddingHorizontal: 12,
    height: 62,
    width: '92%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.08)', // Subtle circular recess matching reference
  },
  navItemActive: {
    backgroundColor: '#000000', // Solid pitch-black circle
    borderWidth: 1,
    borderColor: '#18181B',
  },
  sixDotGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF', // Crisp white dots
  },
  dotActive: {
    backgroundColor: Colors.accentLime,
  },
});
