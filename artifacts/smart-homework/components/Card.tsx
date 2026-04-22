import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = ViewProps & {
  variant?: "default" | "raised" | "glow";
};

export function Card({ style, children, variant = "default", ...rest }: Props) {
  const colors = useColors();
  if (variant === "glow") {
    return (
      <View
        {...rest}
        style={[
          styles.card,
          styles.glowWrap,
          { borderColor: colors.primary + "55" },
          style,
        ]}
      >
        <LinearGradient
          colors={["#15214a", "#0d1330"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ position: "relative" }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor:
            variant === "raised" ? colors.surface : colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  glowWrap: {
    overflow: "hidden",
    borderWidth: 1,
  },
});
