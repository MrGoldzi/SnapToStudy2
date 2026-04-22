import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { Pressable } from "@/components/Pressable";
import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  onPress,
  icon,
  loading,
  disabled,
  variant = "primary",
  size = "md",
  style,
}: Props) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const padV = size === "lg" ? 16 : 13;
  const padH = size === "lg" ? 24 : 18;

  if (variant === "primary") {
    return (
      <Pressable
        haptic="medium"
        onPress={isDisabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.btnWrap,
          {
            opacity: isDisabled ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: colors.primary,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={["#60a5fa", "#3b82f6", "#1d4ed8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { paddingVertical: padV, paddingHorizontal: padH },
          ]}
        >
          <View style={styles.row}>
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : icon ? (
              <Feather name={icon} size={18} color={colors.primaryForeground} />
            ) : null}
            <Text
              style={[
                styles.text,
                {
                  color: colors.primaryForeground,
                  fontSize: size === "lg" ? 17 : 15,
                },
              ]}
            >
              {title}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  let bg = colors.secondary;
  let fg = colors.secondaryForeground;
  let border = "transparent";
  if (variant === "ghost") {
    bg = "transparent";
    fg = colors.foreground;
    border = colors.border;
  }

  return (
    <Pressable
      haptic="medium"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btnFlat,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: padV,
          paddingHorizontal: padH,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : icon ? (
          <Feather name={icon} size={18} color={fg} />
        ) : null}
        <Text
          style={[
            styles.text,
            { color: fg, fontSize: size === "lg" ? 17 : 15 },
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btnWrap: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowOpacity: 0.32,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  btnFlat: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.1,
  },
});
