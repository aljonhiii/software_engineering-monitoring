import React from 'react';
import { Tabs } from 'expo-router';
import { ModernBottomBar } from '../../components/navigation/ModernBottomBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ModernBottomBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />

      <Tabs.Screen
        name="transactions/index"
        options={{
          title: 'Orders',
        }}
      />

      <Tabs.Screen
        name="payments/index"
        options={{
          title: 'Payments',
        }}
      />

      <Tabs.Screen
        name="machine/index"
        options={{
          title: 'Telemetry',
        }}
      />

      <Tabs.Screen
        name="sales/index"
        options={{
          title: 'Reports',
        }}
      />

      <Tabs.Screen
        name="settings/index"
        options={{
          title: 'Settings',
        }}
      />

      {/* Detail screen hidden from tab bar */}
      <Tabs.Screen
        name="transactions/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
