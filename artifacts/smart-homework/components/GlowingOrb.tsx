import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgLG, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

export type OrbState = "idle" | "listening" | "processing" | "speaking";

type Props = {
  size?: number;
  maxFraction?: number;
  maxSize?: number;
  state?: OrbState;
};

function computeSize(
  size: number | undefined,
  maxFraction: number,
  maxSize: number,
): number {
  const screen = Dimensions.get("window");
  const minSide = Math.min(screen.width, screen.height);
  const cap = Math.min(minSide * maxFraction, maxSize);
  if (typeof size === "number") return Math.min(size, cap);
  return Math.max(140, cap);
}

export function GlowingOrb({
  size,
  maxFraction = 0.55,
  maxSize = 260,
  state = "idle",
}: Props) {
  const colors = useColors();
  const final = computeSize(size, maxFraction, maxSize);
  const rings = 7;
  const center = final / 2;

  const pulse = useSharedValue(1);
  const halo = useSharedValue(1);
  const rot = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);
    cancelAnimation(halo);
    cancelAnimation(rot);
    if (state === "idle") {
      pulse.value = withRepeat(
        withTiming(1.04, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      halo.value = withRepeat(
        withTiming(0.9, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      rot.value = withRepeat(
        withTiming(360, { duration: 28000, easing: Easing.linear }),
        -1,
        false,
      );
    } else if (state === "listening") {
      pulse.value = withRepeat(
        withTiming(1.18, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      halo.value = withRepeat(
        withTiming(1.25, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      rot.value = withRepeat(
        withTiming(360, { duration: 16000, easing: Easing.linear }),
        -1,
        false,
      );
    } else if (state === "processing") {
      pulse.value = withRepeat(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      halo.value = withRepeat(
        withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      rot.value = withRepeat(
        withTiming(360, { duration: 2200, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      // speaking
      pulse.value = withRepeat(
        withTiming(1.12, { duration: 380, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      halo.value = withRepeat(
        withTiming(1.18, { duration: 380, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
      rot.value = withRepeat(
        withTiming(360, { duration: 6000, easing: Easing.linear }),
        -1,
        false,
      );
    }
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(halo);
      cancelAnimation(rot);
    };
  }, [state, pulse, halo, rot]);

  const ringsStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }, { scale: pulse.value }],
  }));
  const haloOuterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: halo.value }],
    opacity: state === "idle" ? 0.85 : 1,
  }));
  const haloInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      style={{
        width: final,
        height: final,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloOuterStyle,
          {
            width: final * 1.08,
            height: final * 1.08,
            borderRadius: final,
            backgroundColor: colors.glowOuter + "26",
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          haloInnerStyle,
          {
            width: final * 0.92,
            height: final * 0.92,
            borderRadius: final,
            backgroundColor: colors.glowInner + "20",
          },
        ]}
      />
      <Animated.View
        style={[
          { width: final, height: final, position: "absolute" },
          ringsStyle,
        ]}
      >
        <Svg width={final} height={final}>
          <Defs>
            <SvgLG id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={colors.glowInner} stopOpacity="0.95" />
              <Stop offset="100%" stopColor={colors.glowOuter} stopOpacity="0.45" />
            </SvgLG>
          </Defs>
          {Array.from({ length: rings }).map((_, i) => {
            const t = i / (rings - 1);
            const r = (final / 2) * (0.32 + t * 0.55);
            const rotDeg = (i * 360) / rings;
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
                transform={`rotate(${rotDeg} ${center} ${center}) scale(1 ${0.55 + t * 0.45})`}
                origin={`${center}, ${center}`}
              />
            );
          })}
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.core, coreStyle]}>
        <LinearGradient
          colors={[colors.glowInner, colors.glowOuter]}
          style={{
            width: final * 0.18,
            height: final * 0.18,
            borderRadius: final,
          }}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
        />
      </Animated.View>
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
