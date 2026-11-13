import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { LoadingView } from '../components/common/LoadingView';
import { Colors } from '../constants/theme';

function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // If opened on web with a kioskId query param, the user meant to open the Shoeclean Kiosk!
    if (typeof window !== 'undefined' && window.location?.search?.includes('kioskId=')) {
      const search = window.location.search;
      console.log('[Monitoring] Detected kioskId param on monitoring app. Redirecting to dynamic kiosk launcher:', search);
      window.location.replace(`http://localhost:3000/api/launcher/kiosk${search}`);
      return;
    }

    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingView message="Authenticating session..." />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <RootNavigator />
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
