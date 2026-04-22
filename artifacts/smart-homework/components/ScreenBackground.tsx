import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = ViewProps & {
  variant?: "default" | "hero" | "deep";
};

/**
 * Full-screen gradient backdrop with soft blue glows.
 * Matches the dark navy aesthetic with diagonal blue light wash.
 */
export function ScreenBackground({
  children,
  variant = "default",
  style,
  ...rest
}: Props) {
  const colors = useColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }, style]} {...rest}>
      {/* Base diagonal wash */}
      <LinearGradient
        colors={[
          variant === "hero" ? "#152255" : "#0c1430",
          colors.background,
          "#05081a",
        ]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top-left blue glow */}
      <LinearGradient
        colors={["#1d4ed833", "#1d4ed800"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={[
          StyleSheet.absoluteFill,
          { opacity: variant === "deep" ? 0.5 : 0.85 },
        ]}
      />
      {/* Bottom-right faint glow */}
      <LinearGradient
        colors={["#1d4ed800", "#3b82f622"]}
        start={{ x: 0.4, y: 0.4 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
