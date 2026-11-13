/**
 * useResponsive Hook
 * Provides screen classification, orientation, and layout helpers
 * specifically tailored for 8 to 10-inch Android tablet kiosks as well as mobile devices.
 */

import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  contentMaxWidth: number;
  horizontalPadding: number;
  shoeTypeColumns: number;
  serviceColumns: number;
  paymentColumns: number;
  welcomeColumns: number;
  summaryTwoColumn: boolean;
  progressTwoColumn: boolean;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const minDimension = Math.min(width, height);

  // 8" to 10" tablets generally have minDimension >= 580 (typically 600, 720, 800, or 1200)
  const isTablet = minDimension >= 580 || width >= 700;
  const isLargeTablet = minDimension >= 720 || width >= 1024;

  // Compute container max width so screens don't look awkwardly stretched on large displays
  const contentMaxWidth = isLandscape ? Math.min(width * 0.94, 1200) : Math.min(width * 0.94, 900);

  // Dynamic padding based on device size
  const horizontalPadding = isTablet ? (isLandscape ? 32 : 24) : 16;

  // Shoe Category Grid Columns (2 standardized main categories: Leather Shoes & Other Shoes)
  let shoeTypeColumns = 1;
  if (isLandscape || isTablet || width >= 540) {
    shoeTypeColumns = 2; // 1 row of 2 side-by-side cards
  }

  // Service Cards (Quick, Standard, Deep)
  let serviceColumns = 1;
  if (isLandscape) {
    serviceColumns = 3;
  } else if (isTablet && width >= 720) {
    serviceColumns = 3;
  } else if (isTablet) {
    serviceColumns = 2;
  }

  // Payment Methods (Coins, Bills, E-Wallet)
  let paymentColumns = 1;
  if (isLandscape || (isTablet && width >= 640)) {
    paymentColumns = 3;
  }

  // Welcome Screen 3-step cards
  let welcomeColumns = 1;
  if (isLandscape || (isTablet && width >= 640)) {
    welcomeColumns = 3;
  }

  // Order summary two-column layout (Receipt on left, Checklist/CTA on right)
  const summaryTwoColumn = isLandscape || (isTablet && width >= 720);

  // Progress screen two-column layout
  const progressTwoColumn = isLandscape || (isTablet && width >= 720);

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isLargeTablet,
    contentMaxWidth,
    horizontalPadding,
    shoeTypeColumns,
    serviceColumns,
    paymentColumns,
    welcomeColumns,
    summaryTwoColumn,
    progressTwoColumn,
  };
}
