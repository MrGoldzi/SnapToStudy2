import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLG, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

type Props = {
  size?: number;
  maxFraction?: number;
  maxSize?: number;
};

function computeSize(size: number | undefined, maxFraction: number, maxSize: number): number {
  const screen = Dimensions.get("window");
  const minSide = Math.min(screen.width, screen.height);
  const cap = Math.min(minSide * maxFraction, maxSize);
  if (typeof size === "number") return Math.min(size, cap);
  return Math.max(140, cap);
}

export function GlowingOrb({ size, maxFraction = 0.55, maxSize = 260 }: Props) {
  const colors = useColors();
  const final = computeSize(size, maxFraction, maxSize);
  const rings = 7;
  const center = final / 2;
  // Outer halo extends slightly beyond `final`; use a wrapping container that
  // matches `final` exactly so the orb's footprint never exceeds what's allotted.
  return (
    <View
      style={{
        width: final,
        height: final,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: final * 1.08,
            height: final * 1.08,
            borderRadius: final,
            backgroundColor: colors.glowOuter + "26",
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            width: final * 0.92,
            height: final * 0.92,
            borderRadius: final,
            backgroundColor: colors.glowInner + "20",
          },
        ]}
      />
      <Svg width={final} height={final} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLG id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.glowInner} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={colors.glowOuter} stopOpacity="0.45" />
          </SvgLG>
        </Defs>
        {Array.from({ length: rings }).map((_, i) => {
          const t = i / (rings - 1);
          const r = (final / 2) * (0.32 + t * 0.55);
          const rot = (i * 360) / rings;
          return (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              stroke="url(#ringGrad)"
              strokeWidth={1.6}
              fill="transparent"
              opacity={0.55 + t * 0.4}
              transform={`rotate(${rot} ${center} ${center}) scale(1 ${0.55 + t * 0.45})`}
              origin={`${center}, ${center}`}
            />
          );
        })}
      </Svg>
      <LinearGradient
        colors={[colors.glowInner, colors.glowOuter]}
        style={[
          styles.core,
          {
            width: final * 0.18,
            height: final * 0.18,
            borderRadius: final,
          },
        ]}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.8, y: 0.8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: "absolute",
  },
  core: {
    position: "absolute",
  },
});
