import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GoogleAuthSheet } from "@/components/GoogleAuthSheet";
import { Pressable } from "@/components/Pressable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, signOut, linkGoogle, unlinkGoogle, updateProfile } = useApp();
  const [showGoogle, setShowGoogle] = useState(false);
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  const user = state.user;

  const onSignOut = () => {
    Alert.alert("Sign out?", "You'll need to sign in again to come back.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          signOut();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  const decks = state.decks.length;
  const cards = state.cards.length;
  const tasks = state.assignments.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Profile" subtitle="Account & preferences" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "26", borderColor: colors.primary },
              ]}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: "Inter_700Bold",
                  fontSize: 22,
                }}
              >
                {(user?.name || "G").slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {user?.name || "Guest"}
              </Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>
                {user?.email || (user?.isGuest ? "Guest mode" : "")}
              </Text>
            </View>
            {user?.isGuest && (
              <Pressable
                haptic="selection"
                onPress={() => router.push("/(auth)/sign-up")}
                style={({ pressed }) => [
                  styles.upgrade,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                  Upgrade
                </Text>
              </Pressable>
            )}
          </View>

          <View style={{ flexDirection: "row", marginTop: 16, gap: 14 }}>
            <Stat label="Decks" value={String(decks)} />
            <Stat label="Cards" value={String(cards)} />
            <Stat label="Tasks" value={String(tasks)} />
          </View>
        </Card>

        <SectionLabel>CONNECTIONS</SectionLabel>
        <Card>
          <View style={styles.connRow}>
            <View style={styles.gIcon}>
              <Text style={styles.gLetter}>G</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.connTitle, { color: colors.foreground }]}>
                Google Account
              </Text>
              <Text
                style={[
                  styles.connSub,
                  {
                    color: user?.googleLinked
                      ? colors.success
                      : colors.mutedForeground,
                  },
                ]}
              >
                {user?.googleLinked
                  ? `Connected${user.email ? " · " + user.email : ""}`
                  : "Not connected"}
              </Text>
            </View>
            {user?.googleLinked ? (
              <Pressable
                haptic="light"
                onPress={() =>
                  Alert.alert("Disconnect Google?", "You can reconnect any time.", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Disconnect",
                      style: "destructive",
                      onPress: () => unlinkGoogle(),
                    },
                  ])
                }
                style={({ pressed }) => [
                  styles.connBtn,
                  {
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                  Disconnect
                </Text>
              </Pressable>
            ) : (
              <Pressable
                haptic="medium"
                onPress={() => setShowGoogle(true)}
                style={({ pressed }) => [
                  styles.connBtn,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 12 }}>
                  Connect
                </Text>
              </Pressable>
            )}
          </View>
          <Text style={[styles.help, { color: colors.mutedForeground }]}>
            Connect Google to invite contacts to study groups and sync your account.
          </Text>
        </Card>

        <SectionLabel>SETTINGS</SectionLabel>
        <Card>
          <SettingRow
            icon="bell"
            label="Notifications"
            sub="Reminders for tasks and reviews"
            colors={colors}
          />
          <Divider />
          <SettingRow
            icon="moon"
            label="Appearance"
            sub="Dark theme"
            colors={colors}
          />
          <Divider />
          <SettingRow
            icon="shield"
            label="Privacy"
            sub="Your scans and notes stay on this device"
            colors={colors}
          />
          <Divider />
          <SettingRow
            icon="help-circle"
            label="Help & support"
            sub="Tips, FAQs, contact"
            colors={colors}
          />
        </Card>

        <Pressable
          haptic="medium"
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.signOut,
            {
              backgroundColor: colors.card,
              borderColor: colors.destructive + "55",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={{ color: colors.destructive, fontFamily: "Inter_700Bold", fontSize: 14 }}>
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
      <GoogleAuthSheet
        visible={showGoogle}
        onClose={() => setShowGoogle(false)}
        onConfirm={(name, email) => {
          linkGoogle(email);
          if (user?.isGuest && name) {
            updateProfile({ name });
          }
          setShowGoogle(false);
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "Inter_700Bold",
          fontSize: 22,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.mutedForeground,
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Text
      style={{
        color: colors.mutedForeground,
        fontFamily: "Inter_600SemiBold",
        fontSize: 11,
        letterSpacing: 1.5,
        marginTop: 6,
        marginLeft: 4,
      }}
    >
      {children}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  sub,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.surface }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
          {label}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
          {sub}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.4,
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  upgrade: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  connRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  gLetter: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  connTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  connSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  connBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  help: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 12,
    lineHeight: 17,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginVertical: 4,
    marginLeft: 44,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
