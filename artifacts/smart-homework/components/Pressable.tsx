import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable as RNPressable,
  type PressableProps,
} from "react-native";

type Props = PressableProps & {
  haptic?: "light" | "medium" | "heavy" | "selection" | "none";
};

export function Pressable({ haptic = "light", onPress, ...rest }: Props) {
  return (
    <RNPressable
      {...rest}
      onPress={(e) => {
        if (haptic !== "none" && Platform.OS !== "web") {
          if (haptic === "selection") {
            Haptics.selectionAsync().catch(() => {});
          } else {
            const map = {
              light: Haptics.ImpactFeedbackStyle.Light,
              medium: Haptics.ImpactFeedbackStyle.Medium,
              heavy: Haptics.ImpactFeedbackStyle.Heavy,
            } as const;
            Haptics.impactAsync(map[haptic]).catch(() => {});
          }
        }
        onPress?.(e);
      }}
    />
  );
}
