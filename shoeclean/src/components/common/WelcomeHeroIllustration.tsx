import React from 'react';
import { View } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

interface WelcomeHeroIllustrationProps {
  size?: number;
}

export function WelcomeHeroIllustration({ size = 260 }: WelcomeHeroIllustrationProps) {
  return (
    <View style={{ width: size, height: size * 0.9, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size * 0.9} viewBox="0 0 260 234">
        <Defs>
          <LinearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#1E526B" />
            <Stop offset="100%" stopColor="#0D2C3D" />
          </LinearGradient>
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="100%" stopColor="#F1F5F9" />
          </LinearGradient>
          <LinearGradient id="tealGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#00E5FF" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
          <LinearGradient id="phoneFrame" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#334155" />
            <Stop offset="100%" stopColor="#1E293B" />
          </LinearGradient>
        </Defs>

        {/* Ambient background glow */}
        <Circle cx="130" cy="115" r="90" fill="#0284C7" opacity="0.18" />

        {/* Kiosk / Tablet Stand Base */}
        <Path d="M70 215 L190 215 L175 205 L85 205 Z" fill="#1E293B" opacity="0.8" />
        <Rect x="122" y="165" width="16" height="42" rx="4" fill="#334155" />

        {/* Floating Digital Kiosk Device Display */}
        <G transform="translate(45, 25)">
          {/* Bezel */}
          <Rect
            x="0"
            y="0"
            width="170"
            height="145"
            rx="16"
            fill="url(#phoneFrame)"
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Screen Content */}
          <Rect
            x="7"
            y="7"
            width="156"
            height="131"
            rx="12"
            fill="url(#screenGrad)"
          />

          {/* Screen Header Bar */}
          <Rect x="15" y="16" width="65" height="7" rx="3.5" fill="#38BDF8" opacity="0.8" />
          <Circle cx="145" cy="19.5" r="4.5" fill="#00E5FF" />

          {/* Product Mini Cards inside Kiosk display */}
          {/* Card 1 */}
          <Rect x="15" y="32" width="65" height="92" rx="8" fill="url(#cardGrad)" />
          {/* Mini Sneaker Red in Card 1 */}
          <Path
            d="M24 74 Q32 62 48 64 Q62 65 68 76 Q60 84 32 84 Z"
            fill="#EF4444"
          />
          <Path
            d="M22 83 L70 83 L68 87 L24 87 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />
          <Rect x="22" y="93" width="35" height="4" rx="2" fill="#1E293B" />
          <Rect x="22" y="101" width="22" height="4" rx="2" fill="#0284C7" />
          <Rect x="60" y="98" width="14" height="14" rx="4" fill="#0284C7" />

          {/* Card 2 */}
          <Rect x="88" y="32" width="68" height="92" rx="8" fill="url(#cardGrad)" />
          {/* Mini Canvas Blue in Card 2 */}
          <Path
            d="M97 74 Q105 60 125 64 Q138 67 146 76 Q138 84 105 84 Z"
            fill="#0284C7"
          />
          <Path
            d="M95 83 L148 83 L146 87 L97 87 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />
          <Rect x="95" y="93" width="35" height="4" rx="2" fill="#1E293B" />
          <Rect x="95" y="101" width="22" height="4" rx="2" fill="#0284C7" />
          <Rect x="136" y="98" width="14" height="14" rx="4" fill="#0284C7" />
        </G>

        {/* Cleaning Bubble 1 */}
        <Circle cx="35" cy="80" r="14" fill="#00E5FF" opacity="0.3" />
        <Circle cx="31" cy="76" r="4" fill="#FFFFFF" opacity="0.6" />

        {/* Cleaning Bubble 2 */}
        <Circle cx="225" cy="65" r="18" fill="#38BDF8" opacity="0.35" />
        <Circle cx="220" cy="59" r="6" fill="#FFFFFF" opacity="0.7" />

        {/* Cleaning Bubble 3 */}
        <Circle cx="228" cy="140" r="11" fill="#00E5FF" opacity="0.25" />

        {/* Sparkles */}
        <Path
          d="M38 140 L40 148 L48 150 L40 152 L38 160 L36 152 L28 150 L36 148 Z"
          fill="#38BDF8"
        />
        <Path
          d="M210 185 L211.5 190 L217 191.5 L211.5 193 L210 198 L208.5 193 L203 191.5 L208.5 190 Z"
          fill="#00E5FF"
        />
      </Svg>
    </View>
  );
}
