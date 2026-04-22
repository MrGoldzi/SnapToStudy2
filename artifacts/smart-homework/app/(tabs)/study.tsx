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
import { ScreenHeader } from "@/components/ScreenHeader";
import { SubjectChip, subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function StudyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useApp();
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Study"
        subtitle="Flashcards with spaced repetition"
        right={
          <Pressable
            haptic="medium"
            onPress={() => router.push("/deck/new")}
            style={({ pressed }) => [
              styles.headerBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
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
        {summaries.length === 0 ? (
          <EmptyState
            icon="layers"
            title="No decks yet"
            message="Tap + to create a deck. We'll generate cards from any topic or your notes."
          />
        ) : (
          summaries.map((s) => (
            <Pressable
              key={s.deck.id}
              haptic="selection"
              onPress={() => router.push(`/deck/${s.deck.id}` as any)}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Card>
                <View style={styles.deckHead}>
                  <View
                    style={[
                      styles.deckIcon,
                      {
                        backgroundColor: subjectColor(s.deck.subject) + "22",
                      },
                    ]}
                  >
                    <Feather
                      name="layers"
                      size={20}
                      color={subjectColor(s.deck.subject)}
                    />
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
                      <Text
                        style={[styles.deckMeta, { color: colors.mutedForeground }]}
                      >
                        {s.total} cards
                      </Text>
                    </View>
                  </View>
                  {s.due > 0 ? (
                    <View
                      style={[styles.duePill, { backgroundColor: colors.accent }]}
                    >
                      <Text
                        style={[
                          styles.duePillText,
                          { color: colors.accentForeground },
                        ]}
                      >
                        {s.due} due
                      </Text>
                    </View>
                  ) : (
                    <Feather
                      name="check-circle"
                      size={20}
                      color={colors.success}
                    />
                  )}
                </View>
                {s.total > 0 && (
                  <View style={{ marginTop: 14, gap: 6 }}>
                    <View
                      style={[
                        styles.masteryTrack,
                        { backgroundColor: colors.muted },
                      ]}
                    >
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
                    <Text
                      style={[
                        styles.masteryText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Mastery {s.mastery}%
                    </Text>
                  </View>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
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
