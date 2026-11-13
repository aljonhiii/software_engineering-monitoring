import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

interface OnboardingIllustrationProps {
  width?: number;
  height?: number;
}

export function OnboardingIllustration({ width = 260, height = 220 }: OnboardingIllustrationProps) {
  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 260 220" fill="none">
        <Defs>
          {/* Soft background oval gradient */}
          <LinearGradient id="bgWash" x1="130" y1="20" x2="130" y2="200" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#F1F5F9" />
            <Stop offset="100%" stopColor="#E2E8F0" />
          </LinearGradient>
          {/* Shirt gradient */}
          <LinearGradient id="shirtGrad" x1="100" y1="120" x2="160" y2="210" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#6366F1" />
            <Stop offset="100%" stopColor="#4F46E5" />
          </LinearGradient>
          {/* Sneaker cyan accent */}
          <LinearGradient id="shoeAccent" x1="70" y1="90" x2="130" y2="130" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#00D2B4" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
        </Defs>

        {/* 1. Organic soft background circle / blob wash */}
        <Path
          d="M60,110 C50,55 95,25 145,28 C195,30 225,65 220,120 C215,175 175,200 125,198 C75,195 70,165 60,110 Z"
          fill="url(#bgWash)"
        />

        {/* Subtle fresh bubbles / sparkles floating */}
        <Circle cx="50" cy="85" r="5" fill="#00D2B4" opacity={0.5} />
        <Circle cx="62" cy="70" r="3" fill="#6366F1" opacity={0.4} />
        <Circle cx="215" cy="75" r="4" fill="#6366F1" opacity={0.35} />
        <Circle cx="205" cy="95" r="6" fill="#00D2B4" opacity={0.4} />

        {/* Sparkle star top-right */}
        <Path
          d="M210,48 L212,54 L218,56 L212,58 L210,64 L208,58 L202,56 L208,54 Z"
          fill="#F59E0B"
          opacity={0.8}
        />

        {/* 2. Character Body & Torso */}
        <Path
          d="M95,210 C92,160 102,126 128,124 C154,126 166,160 165,210 Z"
          fill="url(#shirtGrad)"
        />
        {/* Collar neckline */}
        <Path
          d="M118,124 C124,132 134,132 140,124 Z"
          fill="#FDDEC0"
        />

        {/* 3. Character Neck & Head */}
        <Rect x="123" y="108" width="14" height="18" rx="4" fill="#FDDEC0" />
        {/* Head oval */}
        <Path
          d="M112,68 C112,50 148,50 148,68 C148,84 140,94 130,94 C120,94 112,84 112,68 Z"
          fill="#FDDEC0"
        />
        {/* Character Hair */}
        <Path
          d="M110,64 C112,46 126,42 138,42 C148,42 150,52 150,60 C146,59 140,58 135,62 C130,66 120,62 110,64 Z"
          fill="#1E293B"
        />
        {/* Ears */}
        <Circle cx="112" cy="70" r="3.5" fill="#FBCFB0" />
        <Circle cx="148" cy="70" r="3.5" fill="#FBCFB0" />
        {/* Friendly eyes & gentle smile */}
        <Circle cx="123" cy="68" r="1.5" fill="#1E293B" />
        <Circle cx="137" cy="68" r="1.5" fill="#1E293B" />
        <Path d="M127,76 Q130,80 133,76" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* 4. Left Arm & Hand reaching out */}
        <Path
          d="M102,142 C92,144 80,154 75,166 C72,174 76,178 84,172 C92,166 102,156 108,150 Z"
          fill="#6366F1"
        />
        <Circle cx="74" cy="170" r="6" fill="#FDDEC0" />

        {/* 5. Clean Sneaker in Hand */}
        <G transform="translate(68, 120)">
          {/* Sneaker Sole */}
          <Path
            d="M8,44 C16,43 38,43 56,43 C64,43 68,40 70,36 C64,36 30,37 8,38 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          {/* Sole cushion tread */}
          <Path
            d="M12,44 L16,42 M26,44 L30,42 M40,44 L44,42 M54,44 L58,42"
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Sneaker Upper Body */}
          <Path
            d="M8,38 C10,26 22,22 34,22 C42,22 48,27 54,30 C58,32 64,32 70,36 C60,37 20,38 8,38 Z"
            fill="url(#shoeAccent)"
          />
          {/* Heel counter & collar */}
          <Path
            d="M12,25 C14,16 22,12 28,15 C30,17 32,22 34,22 C26,22 16,24 12,25 Z"
            fill="#FFFFFF"
          />
          {/* Swoosh / stripe detail */}
          <Path
            d="M20,32 Q35,32 50,26"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Laces */}
          <Path
            d="M32,21 L38,25 M35,18 L41,22 M38,15 L44,19"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </G>

        {/* 6. Right Arm & Microfiber Cleaning Cloth */}
        <Path
          d="M152,142 C162,148 170,158 174,170 C172,176 164,174 158,168 C152,162 146,152 142,146 Z"
          fill="#4F46E5"
        />
        {/* Right Hand */}
        <Circle cx="152" cy="162" r="5.5" fill="#FDDEC0" />
        {/* Soft cyan cleaning cloth wiping sneaker */}
        <Path
          d="M136,150 C132,144 140,138 146,142 C150,145 146,154 140,156 C137,156 138,152 136,150 Z"
          fill="#00D2B4"
          opacity={0.9}
        />

        {/* Polished shine glint over sneaker */}
        <Path
          d="M110,132 L112,136 L116,137 L112,139 L110,144 L108,139 L104,137 L108,136 Z"
          fill="#FFFFFF"
        />

        {/* Shadow base underneath */}
        <Path
          d="M80,212 C100,210 160,210 180,212 C160,215 100,215 80,212 Z"
          fill="#CBD5E1"
          opacity={0.4}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
