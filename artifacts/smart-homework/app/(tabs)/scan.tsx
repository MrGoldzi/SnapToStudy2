import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiChat } from "@/lib/api";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addScan, deleteScan } = useApp();
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
        title="Scanner"
        subtitle="Snap a problem, get a solution"
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={["#1d4ed8", "#0b1130"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={{ alignItems: "center", padding: 28, gap: 16 }}>
            <Pressable
              haptic="medium"
              onPress={takePhoto}
              disabled={busy}
              style={({ pressed }) => [
                styles.shutter,
                {
                  borderColor: "#ffffff44",
                  opacity: busy ? 0.6 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <View style={[styles.shutterInner, { backgroundColor: "#ffffffea" }]}>
                {busy ? (
                  <ActivityIndicator color="#0b1130" size="large" />
                ) : (
                  <Feather name="camera" size={34} color="#0b1130" />
                )}
              </View>
            </Pressable>
            <Text style={styles.shutterTitle}>
              {busy ? "Reading your homework…" : "Tap to scan"}
            </Text>
            <Text style={styles.shutterSub}>
              Math, science, essays, worksheets — point and learn.
            </Text>
            <Pressable
              haptic="selection"
              onPress={pickPhoto}
              disabled={busy}
              style={({ pressed }) => [
                styles.galleryBtn,
                {
                  backgroundColor: "#ffffff1c",
                  opacity: busy ? 0.6 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="image" size={16} color="#fff" />
              <Text style={styles.galleryText}>Choose from gallery</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, marginTop: 6 }}>
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
            message="Your scanned problems and step-by-step solutions will appear here."
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
                style={[styles.thumb, { backgroundColor: colors.surface }]}
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
  heroWrap: {
    borderRadius: 24,
    overflow: "hidden",
  },
  shutter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
  },
  shutterInner: {
    width: 102,
    height: 102,
    borderRadius: 51,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterTitle: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  shutterSub: {
    color: "#ffffffbb",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  galleryText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  section: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 4,
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
  },
  scanLine: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
