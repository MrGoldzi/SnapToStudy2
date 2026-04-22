import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
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

  let bg = colors.primary;
  let fg = colors.primaryForeground;
  let border = "transparent";
  if (variant === "secondary") {
    bg = colors.secondary;
    fg = colors.secondaryForeground;
  } else if (variant === "ghost") {
    bg = "transparent";
    fg = colors.foreground;
    border = colors.border;
  }

  return (
    <Pressable
      haptic="medium"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: size === "lg" ? 16 : 12,
          paddingHorizontal: size === "lg" ? 24 : 18,
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
  btn: {
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
    fontFamily: "Inter_600SemiBold",
  },
});
