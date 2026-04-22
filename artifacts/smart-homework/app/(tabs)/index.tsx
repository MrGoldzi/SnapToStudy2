import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { GlowingOrb } from "@/components/GlowingOrb";
import { Pressable } from "@/components/Pressable";
import { SubjectChip } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const QUICK = [
  { label: "Study", icon: "book-open" as const, target: "/study" },
  { label: "Solve Math", icon: "hash" as const, target: "/scan" },
  { label: "Physics", icon: "zap" as const, target: "/study" },
  { label: "Quiz me", icon: "help-circle" as const, target: "/study" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addChatTurn } = useApp();
  const [ask, setAsk] = useState("");
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  const today = state.assignments
    .filter((a) => !a.done)
    .sort((a, b) => a.dueAt - b.dueAt)
    .slice(0, 3);

  const recent = state.scans.slice(0, 2);

  const sendAsk = () => {
    const text = ask.trim();
    if (!text) return;
    addChatTurn({ role: "user", content: text });
    setAsk("");
    router.push("/tutor?send=1");
  };

  const firstName = (state.user?.name || "there").split(" ")[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#0d1840", "#070b1a"]}
        style={[StyleSheet.absoluteFill, { height: 360 }]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          paddingHorizontal: 20,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            haptic="selection"
            onPress={() => router.push("/profile")}
            style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(state.user?.name || "G").slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
              Hello {firstName}, I'm your study companion
            </Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>
              How can I help you today?
            </Text>
          </View>
        </View>

        <Pressable
          haptic="medium"
          onPress={() => router.push("/tutor")}
          style={({ pressed }) => [
            styles.orbWrap,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <GlowingOrb size={240} />
          <Text style={[styles.orbHint, { color: colors.mutedForeground }]}>
            Tap to start a tutor chat
          </Text>
        </Pressable>

        <View style={styles.quickGrid}>
          {QUICK.map((q) => (
            <Pressable
              key={q.label}
              haptic="selection"
              onPress={() => router.push(q.target as any)}
              style={({ pressed }) => [
                styles.quickPill,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.quickIcon,
                  { backgroundColor: colors.primary + "22" },
                ]}
              >
                <Feather name={q.icon} size={14} color={colors.primary} />
              </View>
              <Text
                style={[styles.quickLabel, { color: colors.foreground }]}
              >
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Section
          title="Today's tasks"
          actionLabel="Add"
          onAction={() => router.push("/assignment/new")}
        />
        {today.length === 0 ? (
          <Card style={{ alignItems: "center", paddingVertical: 22 }}>
            <Feather name="check-circle" size={22} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 8, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              You're all caught up.
            </Text>
          </Card>
        ) : (
          today.map((a) => (
            <Pressable
              key={a.id}
              haptic="selection"
              onPress={() => router.push(`/assignment/${a.id}` as any)}
              style={({ pressed }) => [
                styles.taskRow,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={[styles.taskTitle, { color: colors.foreground }]}
                >
                  {a.title}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <SubjectChip subject={a.subject} small />
                  <Text style={[styles.taskMeta, { color: colors.mutedForeground }]}>
                    {dueLabel(a.dueAt)}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))
        )}

        {recent.length > 0 && (
          <>
            <Section title="Recent scans" actionLabel="See all" onAction={() => router.push("/scan")} />
            {recent.map((s) => (
              <Pressable
                key={s.id}
                haptic="selection"
                onPress={() => router.push(`/scan-result?id=${s.id}` as any)}
                style={({ pressed }) => [
                  styles.scanRow,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <View style={[styles.scanThumb, { backgroundColor: colors.surface }]}>
                  <Feather name="image" size={18} color={colors.mutedForeground} />
                </View>
                <Text
                  numberOfLines={2}
                  style={{ color: colors.foreground, flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18 }}
                >
                  {firstLine(s.content)}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Sticky Ask composer */}
      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.background + "ee",
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + tabBarHeight + 8,
          },
        ]}
      >
        <View
          style={[
            styles.composerInner,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={ask}
            onChangeText={setAsk}
            placeholder="Ask me anything…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            onSubmitEditing={sendAsk}
            returnKeyType="send"
          />
          <Pressable
            haptic="medium"
            onPress={sendAsk}
            disabled={!ask.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                opacity: !ask.trim() ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="arrow-up" size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
      <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 17, letterSpacing: -0.3 }}>
        {title}
      </Text>
      {actionLabel && (
        <Pressable haptic="selection" onPress={onAction}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function dueLabel(dueAt: number): string {
  const ms = dueAt - Date.now();
  const d = Math.round(ms / 86400000);
  if (ms < 0) return `Overdue ${Math.abs(d)}d`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d}d`;
}

function firstLine(s: string): string {
  const line = s.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return line ? line.replace(/^#+\s*/, "") : "Solution";
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  heading: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  orbWrap: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  orbHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexBasis: "48%",
  },
  quickIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  taskMeta: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  scanThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  composer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  composerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 26,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
