/**
 * Root Layout for KixCleen customer application.
 * Configures the OrderProvider, StatusBar, and the complete 10-screen Stack.
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OrderProvider } from '../store/orderStore';
import { Colors } from '../constants';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'kixcleen-google-fonts';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);
  return (
    <SafeAreaProvider>
      <OrderProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: 'slide_from_right',
          }}
        >
          {/* Step 1 */}
          <Stack.Screen name="index" options={{ title: 'Welcome' }} />
          {/* Step 2 */}
          <Stack.Screen name="shoe-type" options={{ title: 'Shoe Category' }} />
          {/* Step 3 */}
          <Stack.Screen name="services" options={{ title: 'Cleaning Service' }} />
          {/* Step 4 */}
          <Stack.Screen name="summary" options={{ title: 'Order Summary' }} />
          {/* Step 5 */}
          <Stack.Screen name="payment-method" options={{ title: 'Payment Method' }} />
          {/* Step 6 */}
          <Stack.Screen name="payment-processing" options={{ title: 'Payment Processing' }} />
          {/* Step 7 */}
          <Stack.Screen name="payment-confirmation" options={{ title: 'Payment Confirmed' }} />
          {/* Step 8 */}
          <Stack.Screen name="preparation" options={{ title: 'Cleaning Preparation' }} />
          {/* Step 9 */}
          <Stack.Screen name="progress" options={{ title: 'Cleaning Progress' }} />
          {/* Step 10 */}
          <Stack.Screen name="complete" options={{ title: 'Cleaning Completed' }} />
        </Stack>
      </OrderProvider>
    </SafeAreaProvider>
  );
}
