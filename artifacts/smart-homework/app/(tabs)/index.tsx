import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Pressable } from "@/components/Pressable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SubjectChip, subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Assignment, levelFromXp } from "@/lib/types";

const DAY = 86400000;

export default function CompassScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useApp();

  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  const { north, east, south, west } = useMemo(() => {
    const now = Date.now();
    const open = state.assignments.filter((a) => !a.done);
    // North: most urgent (overdue or <24h)
    const north = [...open]
      .filter((a) => a.dueAt - now < DAY)
      .sort((a, b) => a.dueAt - b.dueAt);
    // East: upcoming next 7 days
    const east = [...open]
      .filter((a) => a.dueAt - now >= DAY && a.dueAt - now < 7 * DAY)
      .sort((a, b) => a.dueAt - b.dueAt);
    // South: weak areas — subjects with lowest correct rate from flashcards, fallback to subjects with most overdue
    const subjectStats = new Map<string, { reviews: number; correct: number }>();
    for (const c of state.cards) {
      const deck = state.decks.find((d) => d.id === c.deckId);
      if (!deck) continue;
      const cur = subjectStats.get(deck.subject) ?? { reviews: 0, correct: 0 };
      cur.reviews += c.reviews;
      cur.correct += c.correct;
      subjectStats.set(deck.subject, cur);
    }
    const south = Array.from(subjectStats.entries())
      .filter(([, v]) => v.reviews >= 3)
      .map(([k, v]) => ({
        subject: k,
        rate: v.correct / Math.max(1, v.reviews),
      }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);
    // West: completed in last 7 days
    const west = state.assignments
      .filter(
        (a) =>
          a.done &&
          a.completedAt &&
          now - a.completedAt < 7 * DAY,
      )
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    return { north, east, south, west };
  }, [state.assignments, state.cards, state.decks]);

  const lvl = levelFromXp(state.stats.xp);
  const progress = Math.min(1, lvl.intoLevel / lvl.needed);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Your Compass"
        subtitle={greeting()}
        right={
          <Pressable
            haptic="selection"
            onPress={() => router.push("/tutor")}
            style={({ pressed }) => [
              styles.headerBtn,
              {
                backgroundColor: colors.secondary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="message-circle" size={18} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats hero */}
        <LinearGradient
          colors={["#4f46e5", "#7c3aed", "#f59e0b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroEyebrow}>Level {lvl.level}</Text>
              <Text style={styles.heroXp}>{state.stats.xp} XP</Text>
            </View>
            <View style={styles.streakBadge}>
              <Feather name="zap" size={14} color="#fbbf24" />
              <Text style={styles.streakText}>
                {state.stats.streak} day streak
              </Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.heroFoot}>
            {lvl.needed - lvl.intoLevel} XP to level {lvl.level + 1}
          </Text>
        </LinearGradient>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickAction
            label="Scan"
            icon="camera"
            color={colors.primary}
            onPress={() => router.push("/scan")}
          />
          <QuickAction
            label="Add Task"
            icon="plus-square"
            color={colors.accent}
            onPress={() => router.push("/assignment/new")}
          />
          <QuickAction
            label="Study"
            icon="layers"
            color={colors.success}
            onPress={() => router.push("/study")}
          />
          <QuickAction
            label="Ask"
            icon="message-circle"
            color={colors.info}
            onPress={() => router.push("/tutor")}
          />
        </View>

        <Quadrant
          dir="N"
          label="Priority"
          tag="Most urgent"
          color={colors.north}
          icon="alert-circle"
          empty="No urgent tasks. Breathe easy."
          items={north}
          onPress={(a) => router.push(`/assignment/${a.id}` as any)}
        />
        <Quadrant
          dir="E"
          label="Upcoming"
          tag="Due this week"
          color={colors.east}
          icon="sunrise"
          empty="Nothing on the horizon."
          items={east}
          onPress={(a) => router.push(`/assignment/${a.id}` as any)}
        />
        <WeakAreasCard items={south} />
        <Quadrant
          dir="W"
          label="Completed"
          tag="Recent wins"
          color={colors.west}
          icon="check-circle"
          empty="Finish a task to see it here."
          items={west.slice(0, 4)}
          onPress={(a) => router.push(`/assignment/${a.id}` as any)}
        />
      </ScrollView>
    </View>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning, scholar";
  if (h < 18) return "Good afternoon, scholar";
  return "Good evening, scholar";
}

function QuickAction({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      haptic="medium"
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickBtn,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.quickIcon,
          { backgroundColor: color + "22" },
        ]}
      >
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Quadrant({
  dir,
  label,
  tag,
  color,
  icon,
  empty,
  items,
  onPress,
}: {
  dir: "N" | "E" | "S" | "W";
  label: string;
  tag: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
  empty: string;
  items: Assignment[];
  onPress: (a: Assignment) => void;
}) {
  const colors = useColors();
  return (
    <Card>
      <View style={styles.qHeader}>
        <View style={[styles.qBadge, { backgroundColor: color + "22" }]}>
          <Text style={[styles.qDir, { color }]}>{dir}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.qLabel, { color: colors.foreground }]}>
            {label}
          </Text>
          <Text style={[styles.qTag, { color: colors.mutedForeground }]}>
            {tag}
          </Text>
        </View>
        <Feather name={icon} size={18} color={color} />
      </View>
      {items.length === 0 ? (
        <Text style={[styles.qEmpty, { color: colors.mutedForeground }]}>
          {empty}
        </Text>
      ) : (
        <View style={{ gap: 8, marginTop: 12 }}>
          {items.slice(0, 4).map((a) => (
            <Pressable
              key={a.id}
              haptic="selection"
              onPress={() => onPress(a)}
              style={({ pressed }) => [
                styles.qItem,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={[styles.qItemTitle, { color: colors.foreground }]}
                >
                  {a.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <SubjectChip subject={a.subject} small />
                  <Text style={[styles.qItemSub, { color: colors.mutedForeground }]}>
                    {dueLabel(a.dueAt)}
                  </Text>
                </View>
              </View>
              <Feather
                name="chevron-right"
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

function WeakAreasCard({
  items,
}: {
  items: Array<{ subject: string; rate: number }>;
}) {
  const colors = useColors();
  return (
    <Card>
      <View style={styles.qHeader}>
        <View
          style={[styles.qBadge, { backgroundColor: colors.south + "22" }]}
        >
          <Text style={[styles.qDir, { color: colors.south }]}>S</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.qLabel, { color: colors.foreground }]}>
            Weak Areas
          </Text>
          <Text style={[styles.qTag, { color: colors.mutedForeground }]}>
            From flashcard reviews
          </Text>
        </View>
        <Feather name="trending-down" size={18} color={colors.south} />
      </View>
      {items.length === 0 ? (
        <Text style={[styles.qEmpty, { color: colors.mutedForeground }]}>
          Review some flashcards to see where to focus.
        </Text>
      ) : (
        <View style={{ gap: 10, marginTop: 12 }}>
          {items.map((it) => {
            const hue = subjectColor(it.subject as any);
            return (
              <View key={it.subject} style={styles.weakRow}>
                <SubjectChip subject={it.subject as any} />
                <View style={[styles.weakTrack, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.weakFill,
                      {
                        width: `${Math.round(it.rate * 100)}%`,
                        backgroundColor: hue,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.weakPct,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {Math.round(it.rate * 100)}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

function dueLabel(dueAt: number): string {
  const ms = dueAt - Date.now();
  const d = Math.round(ms / DAY);
  if (ms < 0) {
    const od = Math.abs(d);
    if (od === 0) return "Overdue today";
    return `Overdue ${od}d`;
  }
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d}d`;
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
    overflow: "hidden",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroEyebrow: {
    color: "#ffffffcc",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 1,
  },
  heroXp: {
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#00000033",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  streakText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#ffffff33",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: "#fff",
  },
  heroFoot: {
    color: "#ffffffcc",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  qHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  qDir: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  qLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    letterSpacing: -0.3,
  },
  qTag: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  qEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 12,
    fontStyle: "italic",
  },
  qItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  qItemTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  qItemSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  weakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  weakTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  weakFill: {
    height: 6,
  },
  weakPct: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    width: 36,
    textAlign: "right",
  },
});
