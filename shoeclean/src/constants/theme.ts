/**
 * Design system — Inspired directly by the reference image.
 * Features petrol blue welcome mode (#10394F), crisp light catalog mode (#F4F6F9),
 * pure white elevated cards (#FFFFFF), and vibrant action blue (#0284C7).
 */

export const Colors = {
  // Reference Image Brand Palette
  welcomeBackground: '#10394F', // Deep Petrol Blue (from Welcome screen)
  welcomeSurface: '#164863',    // Lighter petrol accent
  welcomeCard: '#1A4D68',       // Kiosk status container

  // Clean Light Theme (from Catalog / Screen 2)
  background: '#F4F6F9',        // Soft neutral light background
  surface: '#FFFFFF',           // Pure white surface
  surfaceLight: '#FFFFFF',      // White cards
  surfaceHighlight: '#EBF4FA',  // Soft blue/teal highlight on card selection

  // Action Blues & Accents
  primary: '#0284C7',           // Vibrant Blue from "GET STARTED" and card corner button
  primaryDark: '#0369A1',
  primaryLight: '#38BDF8',
  accent: '#00D2B4',            // Teal accent
  accentDark: '#0E7490',

  // Clean Card White Surfaces
  cardWhite: '#FFFFFF',
  cardWhiteBorder: '#E5E9EE',
  cardWhiteSelectedBorder: '#0284C7',

  // Typography Colors
  textPrimary: '#1E293B',       // Bold dark slate for light screens
  textSecondary: '#64748B',     // Muted grey for subtitles & descriptions
  textMuted: '#94A3B8',         // Subtle captions
  textWhite: '#FFFFFF',         // Crisp white for Welcome screen & dark sections
  textWhiteMuted: '#CBD5E1',
  textInverse: '#FFFFFF',       // White text inside primary blue buttons

  // Status & Feedback
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  info: '#0284C7',

  // Borders
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  borderDark: '#CBD5E1',

  // Overlays
  overlay: 'rgba(16, 57, 79, 0.65)',
} as const;

export const Typography = {
  // Font sizes
  hero: 38,
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 17,
  body: 15,
  bodySmall: 13,
  caption: 12,
  tiny: 10,

  // Font weights
  bold: '700' as const,
  semiBold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,

  // Line heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.7,
} as const;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const Shadows = {
  small: {
    shadowColor: '#0F2B48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F2B48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F2B48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#102A43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;
