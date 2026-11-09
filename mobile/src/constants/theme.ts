export const Colors = {
  // Primary brand palette
  primary: '#0284C7',           // Action Vibrant Ocean Blue
  primaryDark: '#0369A1',
  primaryLight: 'rgba(2, 132, 199, 0.12)',

  // Petrol Blue & Teal Brand Accents
  petrol: '#10394F',            // Deep Petrol Blue (KixCleen Hero)
  petrolSurface: '#164863',
  petrolCard: '#1A4D68',
  accent: '#00D2B4',            // Fresh Mint / Teal Accent
  accentLight: 'rgba(0, 210, 180, 0.15)',

  // Neo-Modern Reference Palette (High-Contrast Dark Surfaces & Lime Highlights)
  surfaceDark: '#121316',        // Deep Charcoal Black (Dock & Hero Containers)
  surfaceDarkCard: '#1E1F24',    // Inset Dark Card
  surfaceDarkBorder: '#27272A',
  surfaceDarkSecondary: '#18191E',
  accentLime: '#D4F63D',         // Modern Chartreuse / Electric Lime
  accentLimeText: '#0F172A',     // Dark text on lime

  // Clean Light Theme Surfaces
  background: '#F4F6F9',        // Soft neutral light background
  surface: '#FFFFFF',           // Pure white surface
  card: '#FFFFFF',              // Elevated white cards
  cardSecondary: '#F8FAFC',
  surfaceHighlight: '#EBF4FA',  // Light blue tint on selection

  // Borders
  border: '#E2E8F0',            // Subtle slate border
  borderLight: '#EDF2F7',
  borderDark: '#CBD5E1',

  // Typography Colors
  textPrimary: '#1E293B',       // Bold dark slate
  textSecondary: '#64748B',     // Slate grey for subtitles
  textMuted: '#94A3B8',         // Subtle captions
  textWhite: '#FFFFFF',
  textInverse: '#FFFFFF',

  // Functional Status Colors
  cyan: '#0284C7',
  cyanLight: 'rgba(2, 132, 199, 0.12)',

  yellow: '#D97706',
  yellowLight: 'rgba(245, 158, 11, 0.15)',

  red: '#EF4444',
  redLight: 'rgba(239, 68, 68, 0.12)',

  purple: '#8B5CF6',
  purpleLight: 'rgba(139, 92, 246, 0.12)',

  green: '#10B981',
  greenLight: 'rgba(16, 185, 129, 0.12)',

  white: '#FFFFFF',
  black: '#0F172A',
};

export const Typography = {
  titleLarge: { fontSize: 24, fontWeight: '800' as const, color: Colors.textPrimary },
  titleMedium: { fontSize: 20, fontWeight: '700' as const, color: Colors.textPrimary },
  titleSmall: { fontSize: 16, fontWeight: '700' as const, color: Colors.textPrimary },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, color: Colors.textPrimary },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textMuted },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  cardLarge: 24,
  pill: 9999,
  full: 9999,
};

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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dock: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
};
