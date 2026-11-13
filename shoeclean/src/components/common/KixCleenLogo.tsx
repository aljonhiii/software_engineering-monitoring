/**
 * KixCleenLogo - Official brand logo for KixCleen.
 * Features the dynamic sneaker circular speed mark, bold slanted KixCleen wordmark,
 * and 'CLEAN KICKS, FRESH STEPS.' tagline on transparent background.
 */

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface KixCleenLogoProps {
  isTablet?: boolean;
}

export function KixCleenLogo({ isTablet = false }: KixCleenLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/kixcleen-logo.png')}
        style={[styles.logoImage, isTablet && styles.logoImageTablet]}
        resizeMode="contain"
      />
    </View>
  );
}

// Backward-compatible alias
export const KicksCleenLogo = KixCleenLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 186,
    height: 150,
  },
  logoImageTablet: {
    width: 180,
    height: 160,
  },
});
