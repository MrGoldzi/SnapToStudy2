import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLG, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

export function GlowingOrb({ size = 220 }: { size?: number }) {
  const colors = useColors();
  const rings = 7;
  const center = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer halo */}
      <View
        style={[
          styles.halo,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: size,
            backgroundColor: colors.glowOuter + "33",
          },
        ]}
      />
      <View
        style={[
          styles.halo,
          {
            width: size * 0.95,
            height: size * 0.95,
            borderRadius: size,
            backgroundColor: colors.glowInner + "26",
          },
        ]}
      />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLG id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.glowInner} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={colors.glowOuter} stopOpacity="0.45" />
          </SvgLG>
        </Defs>
        {Array.from({ length: rings }).map((_, i) => {
          const t = i / (rings - 1);
          const r = (size / 2) * (0.32 + t * 0.55);
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
      {/* Inner core */}
      <LinearGradient
        colors={[colors.glowInner, colors.glowOuter]}
        style={[
          styles.core,
          {
            width: size * 0.18,
            height: size * 0.18,
            borderRadius: size,
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
