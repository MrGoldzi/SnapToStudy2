import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Markdownish } from "@/components/Markdownish";
import { PrimaryButton } from "@/components/PrimaryButton";
import { VoiceMode } from "@/components/VoiceMode";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ScanResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, addChatTurn } = useApp();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const scan = state.scans.find((s) => s.id === id);

  if (!scan) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            color: colors.mutedForeground,
          }}
        >
          Scan not found.
        </Text>
      </View>
    );
  }

  const askTutor = () => {
    addChatTurn({
      role: "user",
      content:
        "I have a follow-up question about the scan you just analyzed:",
    });
    router.replace("/tutor");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 32,
          gap: 14,
        }}
      >
        <Image
          source={{ uri: scan.imageUri }}
          style={[styles.preview, { backgroundColor: colors.muted }]}
          contentFit="cover"
        />
        <Card>
          <Markdownish text={scan.content} />
        </Card>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PrimaryButton
            title="Talk it through"
            icon="mic"
            onPress={() => setVoiceOpen(true)}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            title="Ask follow-up"
            icon="message-circle"
            variant="secondary"
            onPress={askTutor}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
      <VoiceMode
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        title="Talk about this scan"
        context={scan.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
});
