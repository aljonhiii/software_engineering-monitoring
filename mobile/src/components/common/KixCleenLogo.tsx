import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface KixCleenLogoProps {
  width?: number;
  height?: number;
}

export function KixCleenLogo({ width = 160, height = 120 }: KixCleenLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/kixcleen-logo.png')}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
