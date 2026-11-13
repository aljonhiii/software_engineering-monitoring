/**
 * Vector shoe illustrations and drop shadows directly modeled after the reference image:
 * - Sneakers: Red/White/Black high-top basketball sneaker
 * - Canvas: Classic black & white high-top canvas sneaker
 * - Suede: Navy blue casual suede loafer / boat shoe
 * - Leather: Polished black formal dress oxford shoe
 * - Sports: Athletic running sneaker with neon accents
 * - Cleats: Cyan / sky-blue outdoor performance turf shoe
 */

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Rect,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { ShoeCategoryId } from '../../types';

interface ShoeProps {
  size?: number;
}

/** Soft ground contact shadow underneath the shoe */
function GroundShadow({ width = 120, height = 16 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 16">
      <Defs>
        <RadialGradient id="groundGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#0B192C" stopOpacity="0.28" />
          <Stop offset="60%" stopColor="#0B192C" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#0B192C" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="60" cy="8" rx="55" ry="6" fill="url(#groundGrad)" />
    </Svg>
  );
}

/** 1. Sneakers (Air Jordan Style Red/White/Black High-top) */
export function SneakerIllustration({ size = 120 }: ShoeProps) {
  const height = size * 0.72;
  return (
    <View style={[styles.wrapper, { width: size, height }]}>
      <Svg width={size} height={height * 0.9} viewBox="0 0 140 100">
        <Defs>
          <LinearGradient id="redGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#EF4444" />
            <Stop offset="100%" stopColor="#B91C1C" />
          </LinearGradient>
          <LinearGradient id="whiteLeather" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#E2E8F0" />
          </LinearGradient>
        </Defs>

        {/* Ankle Collar & Padding (Black & Red) */}
        <Path
          d="M 50 15 L 75 12 C 85 14 90 22 88 35 L 78 48 L 48 35 Z"
          fill="#1E293B"
        />
        <Path
          d="M 54 13 L 72 11 C 78 12 82 18 80 26 L 50 24 Z"
          fill="url(#redGrad)"
        />

        {/* Main Quarter (White Leather) */}
        <Path
          d="M 38 40 L 76 42 L 84 56 L 68 70 L 28 66 Z"
          fill="url(#whiteLeather)"
        />

        {/* Heel & Backstay Overlay (Red) */}
        <Path
          d="M 68 28 L 88 34 C 95 44 94 62 86 70 L 68 70 L 76 42 Z"
          fill="url(#redGrad)"
        />

        {/* Black Swoosh */}
        <Path
          d="M 35 52 C 55 50 78 44 88 38 C 86 46 72 62 48 64 C 40 64 34 58 35 52 Z"
          fill="#0F172A"
        />

        {/* Forefoot & Mudguard Overlay (Red) */}
        <Path
          d="M 28 66 L 42 45 L 25 48 C 16 54 10 65 14 72 L 40 72 Z"
          fill="url(#redGrad)"
        />

        {/* Toe Box (White) */}
        <Path
          d="M 14 70 C 12 66 18 56 26 53 L 36 68 Z"
          fill="url(#whiteLeather)"
        />

        {/* Black Eyelet Eyestay & Red Laces */}
        <Path
          d="M 40 34 L 56 32 L 48 56 L 36 56 Z"
          fill="#0F172A"
        />
        <Path d="M 42 38 L 50 36 M 40 44 L 48 42 M 38 50 L 46 48" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />

        {/* Midsole (Crisp White Rubber) */}
        <Path
          d="M 10 72 L 90 70 C 95 70 96 76 92 79 L 8 80 C 6 76 7 72 10 72 Z"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="0.8"
        />

        {/* Outsole (Red Tread) */}
        <Path
          d="M 8 79 L 92 78 C 94 81 92 84 88 84 L 12 84 C 9 84 7 82 8 79 Z"
          fill="#DC2626"
        />
      </Svg>
      <GroundShadow width={size * 0.9} height={12} />
    </View>
  );
}

/** 2. Canvas Shoes (Converse Chuck Taylor Style High-top) */
export function CanvasIllustration({ size = 120 }: ShoeProps) {
  const height = size * 0.72;
  return (
    <View style={[styles.wrapper, { width: size, height }]}>
      <Svg width={size} height={height * 0.9} viewBox="0 0 140 100">
        <Defs>
          <LinearGradient id="canvasBlack" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#334155" />
            <Stop offset="100%" stopColor="#0F172A" />
          </LinearGradient>
        </Defs>

        {/* High Top Canvas Body (Black) */}
        <Path
          d="M 46 12 L 72 10 C 80 12 84 20 82 32 L 86 68 L 22 68 L 26 52 L 42 34 Z"
          fill="url(#canvasBlack)"
        />

        {/* Chuck Ankle Star Patch (White Circle with Navy Star) */}
        <Circle cx="64" cy="30" r="10" fill="#FFFFFF" />
        <Path
          d="M 64 23 L 66 28 L 71 28 L 67 31 L 69 36 L 64 33 L 59 36 L 61 31 L 57 28 L 62 28 Z"
          fill="#1E3A8A"
        />

        {/* White Contrast Stitching Line */}
        <Path
          d="M 44 36 L 68 36 L 76 66"
          stroke="#E2E8F0"
          strokeWidth="1.2"
          strokeDasharray="2.5,2"
          fill="none"
        />

        {/* Chrome Eyelets & White Laces */}
        <Circle cx="38" cy="38" r="2.2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
        <Circle cx="35" cy="46" r="2.2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
        <Circle cx="31" cy="54" r="2.2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
        <Circle cx="27" cy="62" r="2.2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="0.8" />
        <Path d="M 37 38 L 46 36 M 34 46 L 44 44 M 30 54 L 40 52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

        {/* Distinct White Rubber Toe Cap */}
        <Path
          d="M 8 70 C 8 62 16 56 24 54 L 28 69 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1"
        />

        {/* Rubber Foxing Midsole (White) */}
        <Path
          d="M 6 69 L 90 67 C 94 67 96 72 93 78 L 6 78 Z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="0.8"
        />

        {/* Iconic Red / Black Foxing Pinstripe */}
        <Path
          d="M 12 73 L 90 71"
          stroke="#DC2626"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Black Bumper License Plate on Heel */}
        <Rect x="88" y="70" width="4" height="7" rx="1" fill="#0F172A" />
      </Svg>
      <GroundShadow width={size * 0.9} height={12} />
    </View>
  );
}

/** 3. Suede Shoes (Navy Suede Loafer / Boat Shoe) */
export function SuedeIllustration({ size = 120 }: ShoeProps) {
  const height = size * 0.72;
  return (
    <View style={[styles.wrapper, { width: size, height }]}>
      <Svg width={size} height={height * 0.9} viewBox="0 0 140 100">
        <Defs>
          <LinearGradient id="suedeNavy" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#254A78" />
            <Stop offset="100%" stopColor="#132B4A" />
          </LinearGradient>
        </Defs>

        {/* Loafer Body (Navy Suede) */}
        <Path
          d="M 28 48 C 36 34 68 34 82 46 C 94 56 94 68 86 72 L 14 72 C 10 66 16 54 28 48 Z"
          fill="url(#suedeNavy)"
        />

        {/* Front Apron & Moccasin Stitching */}
        <Path
          d="M 18 64 C 18 56 26 50 38 48 C 50 48 58 54 58 64"
          fill="#1E3E66"
          stroke="#93C5FD"
          strokeWidth="1.2"
          strokeDasharray="2,2"
        />

        {/* Collar & Leather Boat Lace Detail (Caramel / Tan) */}
        <Path
          d="M 52 46 C 65 44 76 45 84 52"
          stroke="#D97706"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="50" cy="46" r="3" fill="#B45309" />
        <Circle cx="64" cy="48" r="2.5" fill="#B45309" />

        {/* Casual Rubber Sole (Off-White / Tan) */}
        <Path
          d="M 12 72 L 88 72 C 92 72 94 76 90 79 L 10 79 C 8 76 9 72 12 72 Z"
          fill="#FEF3C7"
          stroke="#D97706"
          strokeWidth="0.8"
        />
      </Svg>
      <GroundShadow width={size * 0.9} height={12} />
    </View>
  );
}

/** 4. Leather Shoes (Polished Black Formal Oxford Dress Shoe) */
export function LeatherIllustration({ size = 120 }: ShoeProps) {
  const height = size * 0.72;
  return (
    <View style={[styles.wrapper, { width: size, height }]}>
      <Svg width={size} height={height * 0.9} viewBox="0 0 140 100">
        <Defs>
          <LinearGradient id="patentBlack" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#475569" />
            <Stop offset="40%" stopColor="#0F172A" />
            <Stop offset="100%" stopColor="#020617" />
          </LinearGradient>
          <LinearGradient id="shineHighlight" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Sleek Polished Body */}
        <Path
          d="M 10 68 C 12 56 22 46 36 44 L 66 38 C 76 40 84 48 88 62 L 88 72 L 8 72 Z"
          fill="url(#patentBlack)"
        />

        {/* Toe Cap Gloss Reflection */}
        <Path
          d="M 14 66 C 16 58 24 50 32 48 C 22 52 16 60 14 66 Z"
          fill="url(#shineHighlight)"
        />

        {/* Curved Facing & Lacing Eyelets */}
        <Path
          d="M 46 42 L 56 40 L 52 56 L 42 56 Z"
          fill="#020617"
        />
        <Path d="M 48 45 L 54 44 M 46 49 L 52 48 M 44 53 L 50 52" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

        {/* Formal Wooden Stacked Heel & Slim Sole */}
        <Path
          d="M 8 72 L 88 72 C 90 72 90 75 88 76 L 8 76 Z"
          fill="#0F172A"
        />
        <Rect x="70" y="75" width="18" height="6" rx="1" fill="#451A03" />
      </Svg>
      <GroundShadow width={size * 0.9} height={12} />
    </View>
  );
}

/** 5. Sports Shoes (Athletic Trainer with Neon Green Sole) */
export function SportsIllustration({ size = 120 }: ShoeProps) {
  const height = size * 0.72;
  return (
    <View style={[styles.wrapper, { width: size, height }]}>
      <Svg width={size} height={height * 0.9} viewBox="0 0 140 100">
        <Defs>
          <LinearGradient id="neonGreen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#84CC16" />
            <Stop offset="100%" stopColor="#22C55E" />
          </LinearGradient>
          <LinearGradient id="sportsBlue" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#0284C7" />
            <Stop offset="100%" stopColor="#0F172A" />
          </LinearGradient>
        </Defs>

        {/* Engineered Mesh Upper (Dark Blue/Navy) */}
        <Path
          d="M 12 68 C 16 58 28 44 46 38 L 74 34 C 84 38 88 50 86 68 Z"
          fill="url(#sportsBlue)"
        />

        {/* Dynamic Curved Speed Stripes */}
        <Path
          d="M 32 58 C 42 54 58 48 68 42"
          stroke="#38BDF8"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 36 64 C 46 60 62 54 72 48"
          stroke="url(#neonGreen)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Aerodynamic High-Rebound Foam Midsole (Neon Lime) */}
        <Path
          d="M 8 68 C 24 68 40 70 56 68 C 72 66 84 64 92 68 C 96 70 94 77 90 78 L 6 78 C 4 75 5 70 8 68 Z"
          fill="url(#neonGreen)"
        />

        {/* Rubber Traction Waffle Pods */}
        <Path
          d="M 10 78 L 88 78 L 86 81 L 12 81 Z"
          fill="#1E293B"
        />
      </Svg>
      <GroundShadow width={size * 0.9} height={12} />
    </View>
  );
}

/** 6. Cleats / Other (Cyan Performance Turf Shoe) */
export function CleatsIllustration({ size = 120 }: ShoeProps) {
  const height = size * 0.72;
  return (
    <View style={[styles.wrapper, { width: size, height }]}>
      <Svg width={size} height={height * 0.9} viewBox="0 0 140 100">
        <Defs>
          <LinearGradient id="cyanCleat" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="50%" stopColor="#0284C7" />
            <Stop offset="100%" stopColor="#0369A1" />
          </LinearGradient>
        </Defs>

        {/* Streamlined Synthetic Upper (Cyan/Blue Textured) */}
        <Path
          d="M 8 66 C 12 54 26 42 48 38 L 78 34 C 88 40 90 54 88 68 L 8 68 Z"
          fill="url(#cyanCleat)"
        />

        {/* Ribbed Ball-Control Textures */}
        <Path d="M 22 58 L 30 52 M 28 62 L 38 54 M 36 65 L 46 56" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" />

        {/* Soleplate Base (Black) */}
        <Path
          d="M 6 68 L 90 68 C 92 70 91 73 88 74 L 8 74 C 5 73 5 70 6 68 Z"
          fill="#0F172A"
        />

        {/* Studded Outsole Cleats */}
        <Path d="M 14 74 L 16 80 L 18 74 M 26 74 L 28 80 L 30 74 M 42 74 L 44 80 L 46 74 M 70 74 L 72 80 L 74 74 M 82 74 L 84 80 L 86 74" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      </Svg>
      <GroundShadow width={size * 0.9} height={12} />
    </View>
  );
}

const REAL_SHOE_IMAGES: Record<ShoeCategoryId, any> = {
  leather: require('../../assets/shoes/leather.png'),
  other: require('../../assets/shoes/sneakers.png'),
};

/** Unified ShoeIllustration Renderer */
export function ShoeIllustration({
  categoryId,
  size = 120,
}: {
  categoryId: ShoeCategoryId;
  size?: number;
}) {
  const realImage = REAL_SHOE_IMAGES[categoryId];
  if (realImage) {
    const imgHeight = size * 0.72;
    return (
      <View style={[styles.wrapper, { width: size, height: imgHeight }]}>
        <Image
          source={realImage}
          style={{ width: size, height: imgHeight * 0.86 }}
          resizeMode="contain"
        />
        <GroundShadow width={size * 0.85} height={8} />
      </View>
    );
  }

  switch (categoryId) {
    case 'leather':
      return <LeatherIllustration size={size} />;
    case 'other':
    default:
      return <SneakerIllustration size={size} />;
  }
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
