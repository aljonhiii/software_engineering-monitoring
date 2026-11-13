/**
 * KioskMachineIllustration - Clean, pure footwear showcase for KixCleen
 * onboarding slides.
 *
 * Designed strictly to customer specifications:
 * - NO brushes, NO spray, NO bubbles, NO frames/borders: JUST THE SHOES!
 * - Smooth showroom rotation & floating motion where the shoes NEVER minimize or shrink.
 * - Always stays 100% full size, prominent, and crystal clear.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import Svg, { Ellipse as SvgEllipse } from 'react-native-svg';

const SNEAKER_IMAGE = require('../../assets/shoes/sneakers.png');
const SPORTS_IMAGE = require('../../assets/shoes/sports.png');

interface KioskMachineIllustrationProps {
  step: 1 | 2 | 3;
  size?: number;
}

export function KioskMachineIllustration({ step, size = 280 }: KioskMachineIllustrationProps) {
  const height = size * 0.75;
  const isNative = Platform.OS !== 'web';

  // Smooth continuous showroom motion loop (5 seconds per full cycle)
  const [anim360] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim360, {
        toValue: 1,
        duration: 5000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: isNative,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim360, isNative]);

  // Smooth 3D Showroom Turntable Motion:
  // Floats, turns and tilts smoothly without EVER collapsing or minimizing the shoe's size
  const floatY = anim360.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-7, 0, 7, 0, -7],
  });

  const floatX = anim360.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 6, 0, -6, 0],
  });

  const tiltZ = anim360.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['-4deg', '3deg', '-2deg', '4deg', '-4deg'],
  });

  const turn3D = anim360.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['-14deg', '0deg', '14deg', '0deg', '-14deg'],
  });

  const shadowScale = anim360.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.92, 1.05, 0.92],
  });

  const shadowOpacity = anim360.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.14, 0.22, 0.14],
  });

  // Large, prominent shoe sizing (never minimized)
  const shoeWidth = size * 0.85;
  const shoeHeight = shoeWidth * (297 / 500);

  return (
    <View style={[styles.container, { width: size, height }]}>
      {/* ─── DYNAMIC GROUND SHADOW (Expands/contracts with float) ─── */}
      <Animated.View
        style={[
          styles.shadowContainer,
          {
            bottom: size * 0.08,
            transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }],
            opacity: shadowOpacity,
          },
        ]}
      >
        <Svg width={shoeWidth * 0.85} height={18} viewBox="0 0 200 18">
          <SvgEllipse cx="100" cy="9" rx="90" ry="8" fill="#0F172A" />
        </Svg>
      </Animated.View>

      {/* ─── PURE SHOE SHOWCASE (NO BRUSHES, NO SPRAY, NO BORDERS) ─── */}
      {step === 1 && (
        <Animated.View
          style={[
            styles.shoeWrapper,
            {
              width: shoeWidth,
              height: shoeHeight,
              transform: [
                { perspective: 1000 },
                { translateX: floatX },
                { translateY: floatY },
                { rotateY: turn3D },
                { rotateZ: tiltZ },
              ],
            },
          ]}
        >
          <Image
            source={SNEAKER_IMAGE}
            style={styles.shoeImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View
          style={[
            styles.shoeWrapper,
            {
              width: shoeWidth,
              height: shoeHeight,
              transform: [
                { perspective: 1000 },
                { translateX: floatX },
                { translateY: floatY },
                { rotateY: turn3D },
                { rotateZ: tiltZ },
              ],
            },
          ]}
        >
          <Image
            source={SPORTS_IMAGE}
            style={styles.shoeImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {step === 3 && (
        <Animated.View
          style={[
            styles.pairWrapper,
            {
              width: shoeWidth,
              height: shoeHeight * 1.1,
              transform: [
                { perspective: 1000 },
                { translateX: floatX },
                { translateY: floatY },
                { rotateY: turn3D },
                { rotateZ: tiltZ },
              ],
            },
          ]}
        >
          {/* Back Sneaker */}
          <Image
            source={SNEAKER_IMAGE}
            style={[styles.pairBackShoe, { width: shoeWidth * 0.88, height: shoeHeight * 0.88 }]}
            resizeMode="contain"
          />
          {/* Front Pristine Sneaker */}
          <Image
            source={SNEAKER_IMAGE}
            style={[styles.pairFrontShoe, { width: shoeWidth * 0.95, height: shoeHeight * 0.95 }]}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shadowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shoeImage: {
    width: '100%',
    height: '100%',
  },
  pairWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  pairBackShoe: {
    position: 'absolute',
    top: 0,
    right: 8,
    opacity: 0.68,
  },
  pairFrontShoe: {
    position: 'absolute',
    bottom: 0,
    left: 8,
  },
});
