import { Feather } from "@expo/vector-icons";
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
import { EmptyState } from "@/components/EmptyState";
import { Pressable } from "@/components/Pressable";
import { ScreenBackground } from "@/components/ScreenBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SubjectChip, subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const STUDY_MODES: {
  id: string;
  title: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
  prompt: string;
}[] = [
  {
    id: "explain",
    title: "Concept Explanation",
    desc: "Break any topic down step by step",
    icon: "book-open",
    prompt: "I want a clear, step-by-step explanation of a concept. Ask me what topic.",
  },
  {
    id: "practice",
    title: "Practice Questions",
    desc: "Get tailored problems with hints",
    icon: "edit-3",
    prompt: "Generate 5 practice questions on a topic I'll specify, with hints and answers at the end.",
  },
  {
    id: "quiz",
    title: "Quick Quiz",
    desc: "Multiple choice on any subject",
    icon: "help-circle",
    prompt: "Quiz me with 5 multiple-choice questions on a topic I'll specify. Reveal answers after I respond.",
  },
  {
    id: "summary",
    title: "Summarize Notes",
    desc: "Turn long notes into key points",
    icon: "list",
    prompt: "Summarize the notes I'm about to paste into a clean bulleted study sheet.",
  },
];

export default function StudyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addChatTurn } = useApp();
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  const summaries = useMemo(() => {
    return state.decks.map((d) => {
      const cards = state.cards.filter((c) => c.deckId === d.id);
      const due = cards.filter((c) => c.dueAt <= Date.now()).length;
      const reviews = cards.reduce((acc, c) => acc + c.reviews, 0);
      const correct = cards.reduce((acc, c) => acc + c.correct, 0);
      const mastery =
        reviews === 0 ? 0 : Math.round((correct / reviews) * 100);
      return { deck: d, total: cards.length, due, mastery };
    });
  }, [state.decks, state.cards]);

  const startMode = (prompt: string) => {
    addChatTurn({ role: "user", content: prompt });
    router.push("/tutor?send=1");
  };

  return (
    <ScreenBackground style={{ flex: 1 }}>
      <ScreenHeader
        title="Study"
        subtitle="Pick a mode or open a deck"
        right={
          <Pressable
            haptic="medium"
            onPress={() => router.push("/deck/new")}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color={colors.primaryForeground} />
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
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          AI STUDY MODES
        </Text>
        {STUDY_MODES.map((m) => (
          <Pressable
            key={m.id}
            haptic="selection"
            onPress={() => startMode(m.prompt)}
            style={({ pressed }) => [
              styles.modeRow,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.modeIcon, { backgroundColor: colors.primary + "1f" }]}>
              <Feather name={m.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.modeTitle, { color: colors.foreground }]}>
                {m.title}
              </Text>
              <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>
                {m.desc}
              </Text>
            </View>
            <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
              <Feather name="arrow-up-right" size={16} color={colors.primaryForeground} />
            </View>
          </Pressable>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 10 }]}>
          MY DECKS
        </Text>
        {summaries.length === 0 ? (
          <EmptyState
            icon="layers"
            title="No decks yet"
            message="Tap + to make a deck. We'll generate cards from any topic or pasted notes."
          />
        ) : (
          summaries.map((s) => (
            <Pressable
              key={s.deck.id}
              haptic="selection"
              onPress={() => router.push(`/deck/${s.deck.id}` as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <Card>
                <View style={styles.deckHead}>
                  <View
                    style={[
                      styles.deckIcon,
                      { backgroundColor: subjectColor(s.deck.subject) + "26" },
                    ]}
                  >
                    <Feather name="layers" size={20} color={subjectColor(s.deck.subject)} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      numberOfLines={1}
                      style={[styles.deckName, { color: colors.foreground }]}
                    >
                      {s.deck.name}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <SubjectChip subject={s.deck.subject} small />
                      <Text style={[styles.deckMeta, { color: colors.mutedForeground }]}>
                        {s.total} cards
                      </Text>
                    </View>
                  </View>
                  {s.due > 0 ? (
                    <View style={[styles.duePill, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.duePillText, { color: colors.primaryForeground }]}>
                        {s.due} due
                      </Text>
                    </View>
                  ) : (
                    <Feather name="check-circle" size={20} color={colors.success} />
                  )}
                </View>
                {s.total > 0 && (
                  <View style={{ marginTop: 14, gap: 6 }}>
                    <View style={[styles.masteryTrack, { backgroundColor: colors.muted }]}>
                      <View
                        style={[
                          styles.masteryFill,
                          {
                            width: `${s.mastery}%`,
                            backgroundColor: subjectColor(s.deck.subject),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.masteryText, { color: colors.mutedForeground }]}>
                      Mastery {s.mastery}%
                    </Text>
                  </View>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 6,
    marginLeft: 2,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  modeDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deckHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deckIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  deckName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  deckMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  duePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  duePillText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
  masteryTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  masteryFill: {
    height: 6,
  },
  masteryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
});
