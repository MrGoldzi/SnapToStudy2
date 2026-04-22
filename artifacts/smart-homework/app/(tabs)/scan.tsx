import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiChat } from "@/lib/api";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addScan, deleteScan, awardXp } = useApp();
  const [busy, setBusy] = useState(false);
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  const handleAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      Alert.alert("Couldn't read image", "Please try again.");
      return;
    }
    setBusy(true);
    try {
      const mime = asset.mimeType ?? "image/jpeg";
      const content = await aiChat({
        messages: [],
        imageBase64: asset.base64,
        imageMimeType: mime,
      });
      const scan = addScan({ imageUri: asset.uri, content });
      awardXp(15);
      router.push(`/scan-result?id=${scan.id}` as any);
    } catch (err) {
      Alert.alert(
        "Scan failed",
        err instanceof Error ? err.message : "Try again with a clearer photo.",
      );
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Camera access needed",
        "Enable camera access in Settings to scan homework.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Scan Homework"
        subtitle="Snap a photo, get step-by-step solutions"
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ padding: 24, alignItems: "center" }}>
          <View
            style={[
              styles.scanIcon,
              { backgroundColor: colors.primary + "1f" },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : (
              <Feather name="camera" size={36} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.scanTitle, { color: colors.foreground }]}>
            {busy ? "Reading your homework…" : "Capture a problem"}
          </Text>
          <Text style={[styles.scanSub, { color: colors.mutedForeground }]}>
            {busy
              ? "Our tutor is breaking it down step by step."
              : "Works for math, science, essays, worksheets, and more."}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18, width: "100%" }}>
            <PrimaryButton
              title="Camera"
              icon="camera"
              onPress={takePhoto}
              loading={busy}
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title="Gallery"
              icon="image"
              variant="secondary"
              onPress={pickPhoto}
              disabled={busy}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
          <Text style={[styles.section, { color: colors.foreground }]}>
            Recent scans
          </Text>
          {state.scans.length > 0 && (
            <Text style={[styles.subtle, { color: colors.mutedForeground }]}>
              {state.scans.length}
            </Text>
          )}
        </View>

        {state.scans.length === 0 ? (
          <EmptyState
            icon="camera"
            title="No scans yet"
            message="Your scanned problems and solutions will appear here for quick review."
          />
        ) : (
          state.scans.map((s) => (
            <Pressable
              key={s.id}
              haptic="selection"
              onPress={() => router.push(`/scan-result?id=${s.id}` as any)}
              style={({ pressed }) => [
                styles.scanItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Image
                source={{ uri: s.imageUri }}
                style={styles.thumb}
                contentFit="cover"
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  numberOfLines={2}
                  style={[styles.scanLine, { color: colors.foreground }]}
                >
                  {firstLine(s.content)}
                </Text>
                <Text style={[styles.subtle, { color: colors.mutedForeground }]}>
                  {timeAgo(s.createdAt)}
                </Text>
              </View>
              <Pressable
                haptic="light"
                onPress={() => deleteScan(s.id)}
                hitSlop={8}
                style={{ padding: 6 }}
              >
                <Feather name="trash-2" size={16} color={colors.mutedForeground} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function firstLine(s: string): string {
  const line = s.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return line ? line.replace(/^#+\s*/, "") : "Solution";
}

function timeAgo(ts: number): string {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  scanIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  scanTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  scanSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  section: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 6,
  },
  subtle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#0001",
  },
  scanLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
