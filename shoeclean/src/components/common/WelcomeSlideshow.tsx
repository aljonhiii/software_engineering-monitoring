/**
 * WelcomeSlideshow - Polished, kiosk-grade onboarding slideshow for KixCleen.
 *
 * Implements 3 purposeful onboarding screens:
 * 1. Welcome to KixCleen (Automated Vendo Introduction)
 * 2. Simple Steps, Cleaner Shoes (Shoe & Service Selection + Chamber Scrubbing)
 * 3. Touchless & Ready to Wear (Payment & Clean Pickup)
 *
 * Designed with enlarged realistic kiosk machine vector illustrations,
 * prominent touchscreen primary button with arrow icon, and clear step progress indicators.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing } from '../../constants';
import { KioskMachineIllustration } from './KioskMachineIllustration';

interface SlideData {
  id: number;
  step: 1 | 2 | 3;
  title: string;
  description: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    step: 1,
    title: 'Welcome to KixCleen',
    description:
      'Automated self-service shoe cleaning kiosk. Fast, affordable, and professional footwear restoration in under 3 minutes.',
  },
  {
    id: 2,
    step: 2,
    title: 'Simple Steps, Cleaner Shoes',
    description:
      'Select your shoe type, customize your cleaning cycle, and place your pair into the illuminated chamber for deep scrubbing.',
  },
  {
    id: 3,
    step: 3,
    title: 'Touchless & Ready to Wear',
    description:
      'Pay conveniently via GCash, Maya, or cash slot. When finished, the chamber unlocks with shoes dry, sanitized, and ready to walk.',
  },
];

interface WelcomeSlideshowProps {
  isTablet: boolean;
  onPressGetStarted: () => void;
}

export function WelcomeSlideshow({ isTablet, onPressGetStarted }: WelcomeSlideshowProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [slideAnim] = useState(() => new Animated.Value(0));

  const switchSlide = useCallback(
    (newIndex: number, direction: 'next' | 'prev' = 'next') => {
      const isNative = Platform.OS !== 'web';
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: isNative,
        }),
        Animated.timing(slideAnim, {
          toValue: direction === 'next' ? -12 : 12,
          duration: 160,
          useNativeDriver: isNative,
        }),
      ]).start(() => {
        setCurrentSlideIndex(newIndex);
        slideAnim.setValue(direction === 'next' ? 12 : -12);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: isNative,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 220,
            useNativeDriver: isNative,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  // Auto-advance timer (5.5 seconds per slide for relaxed kiosk reading)
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentSlideIndex + 1) % SLIDES.length;
      switchSlide(nextIndex, 'next');
    }, 5500);

    return () => clearInterval(timer);
  }, [currentSlideIndex, switchSlide]);

  const currentSlide = SLIDES[currentSlideIndex];
  // Enlarged realistic machine graphic
  const graphicSize = isTablet ? 320 : 260;

  return (
    <View style={styles.container}>
      {/* Animated Slide Content (Machine Illustration + Copy) */}
      <Animated.View
        style={[
          styles.slideContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Enlarged Realistic Machine Illustration */}
        <View style={[styles.illustrationWrapper, isTablet && styles.illustrationWrapperTablet]}>
          <KioskMachineIllustration step={currentSlide.step} size={graphicSize} />
        </View>

        {/* Clear Hierarchy: Title & Subtitle */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            {currentSlide.title}
          </Text>
          <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
            {currentSlide.description}
          </Text>
        </View>
      </Animated.View>

      {/* Improved 3-Step Progress Indicators */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          return (
            <TouchableOpacity
              key={slide.id}
              style={[styles.dotTouchTarget]}
              onPress={() => switchSlide(index, index > currentSlideIndex ? 'next' : 'prev')}
              activeOpacity={0.8}
              accessibilityLabel={`Go to onboarding step ${index + 1}`}
              accessibilityRole="button"
            >
              <View style={[styles.dot, isActive && styles.dotActive]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Prominent Kiosk Primary Button with Arrow */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            isTablet && styles.getStartedButtonTablet,
          ]}
          onPress={onPressGetStarted}
          activeOpacity={0.88}
          accessibilityLabel="Get Started with KixCleen shoe cleaning"
          accessibilityRole="button"
        >
          <View style={styles.buttonContentRow}>
            <Text style={styles.getStartedText}>GET STARTED</Text>
            {/* Clean vector arrow icon */}
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 0,
  },
  illustrationWrapperTablet: {
    marginVertical: Spacing.xxs,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    maxWidth: 580,
    minHeight: 90,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A', // Obsidian Slate
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", "Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: undefined,
    }),
  },
  titleTablet: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#475569', // Readable Slate Grey
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 480,
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: undefined,
    }),
  },
  subtitleTablet: {
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 540,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  dotTouchTarget: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1', // Inactive light slate
  },
  dotActive: {
    width: 34, // Prominently elongated active indicator
    height: 8,
    backgroundColor: Colors.primary, // #0284C7
    borderRadius: 4,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 380,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  getStartedButton: {
    backgroundColor: Colors.primary, // #0284C7
    minHeight: 58,
    paddingHorizontal: Spacing.lg,
    borderRadius: 9999, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButtonTablet: {
    minHeight: 64,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    fontFamily: Platform.select({
      web: '"Plus Jakarta Sans", "Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: undefined,
    }),
  },
});
