import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowingOrb } from "@/components/GlowingOrb";
import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInGuest } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#1d4ed8", "#070b1a", "#070b1a"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <View
            style={[
              styles.brandPill,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="zap" size={13} color={colors.primary} />
            <Text style={[styles.brandText, { color: colors.foreground }]}>
              SnapToStudy
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 36 }}>
          <GlowingOrb size={260} />
          <View style={{ alignItems: "center", gap: 14 }}>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              Your Smart{"\n"}Study Companion
            </Text>
            <Text
              style={[styles.sub, { color: colors.mutedForeground }]}
            >
              Snap a problem, learn a concept, study with friends.
              Calm, focused, and powered by AI.
            </Text>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <PrimaryButton
            title="Get Started"
            icon="arrow-right"
            onPress={() => router.push("/(auth)/sign-up")}
            size="lg"
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <PrimaryButton
              title="Sign In"
              variant="secondary"
              onPress={() => router.push("/(auth)/sign-in")}
              style={{ flex: 1 }}
            />
            <Pressable
              haptic="light"
              onPress={() => {
                signInGuest();
                router.replace("/(tabs)");
              }}
              style={({ pressed }) => [
                styles.guest,
                {
                  backgroundColor: "transparent",
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                  flex: 1,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  color: colors.mutedForeground,
                  fontSize: 14,
                }}
              >
                Continue as Guest
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  brandText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    letterSpacing: -0.8,
    textAlign: "center",
    lineHeight: 40,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  guest: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
