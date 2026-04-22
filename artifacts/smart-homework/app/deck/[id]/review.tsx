import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Flashcard } from "@/lib/types";

export default function ReviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, reviewCard } = useApp();

  const allCards = useMemo(
    () => state.cards.filter((c) => c.deckId === id),
    [state.cards, id],
  );

  // Snapshot the queue at mount so completed cards (whose due date jumps
  // forward) don't re-enter the session.
  const [queue] = useState<Flashcard[]>(() => {
    const due = allCards.filter((c) => c.dueAt <= Date.now());
    return due.length > 0 ? due : allCards;
  });
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState({ ok: 0, hard: 0, miss: 0 });

  if (queue.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            color: colors.mutedForeground,
          }}
        >
          No cards in this deck yet.
        </Text>
      </View>
    );
  }

  if (idx >= queue.length) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 18,
        }}
      >
        <View
          style={[
            styles.celebrate,
            { backgroundColor: colors.success + "22" },
          ]}
        >
          <Feather name="check-circle" size={40} color={colors.success} />
        </View>
        <Text style={[styles.celebrateTitle, { color: colors.foreground }]}>
          Session complete!
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            color: colors.mutedForeground,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          Got it: {done.ok}   ·   Hard: {done.hard}   ·   Missed: {done.miss}
        </Text>
        <PrimaryButton
          title="Done"
          icon="arrow-left"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const card = queue[idx];

  const score = (quality: 0 | 3 | 5) => {
    reviewCard(card.id, quality);
    setDone((d) => ({
      ok: d.ok + (quality === 5 ? 1 : 0),
      hard: d.hard + (quality === 3 ? 1 : 0),
      miss: d.miss + (quality === 0 ? 1 : 0),
    }));
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      <View style={[styles.progress, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((idx + 1) / queue.length) * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <Text
        style={[styles.counter, { color: colors.mutedForeground }]}
      >
        Card {idx + 1} of {queue.length}
      </Text>
      <Pressable
        haptic="selection"
        onPress={() => setRevealed((r) => !r)}
        style={{ flex: 1, marginTop: 16 }}
      >
        <Card style={{ flex: 1, justifyContent: "center", padding: 24 }}>
          <Text
            style={[styles.qLabel, { color: colors.mutedForeground }]}
          >
            QUESTION
          </Text>
          <Text style={[styles.q, { color: colors.foreground }]}>
            {card.question}
          </Text>
          {revealed && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />
              <Text
                style={[styles.qLabel, { color: colors.mutedForeground }]}
              >
                ANSWER
              </Text>
              <Text style={[styles.a, { color: colors.foreground }]}>
                {card.answer}
              </Text>
            </>
          )}
          {!revealed && (
            <Text
              style={[styles.tap, { color: colors.mutedForeground }]}
            >
              Tap to reveal
            </Text>
          )}
        </Card>
      </Pressable>
      {revealed ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <RatingBtn
            label="Missed"
            color={colors.destructive}
            onPress={() => score(0)}
          />
          <RatingBtn
            label="Hard"
            color={colors.warning}
            onPress={() => score(3)}
          />
          <RatingBtn
            label="Got it"
            color={colors.success}
            onPress={() => score(5)}
          />
        </View>
      ) : (
        <PrimaryButton
          title="Reveal answer"
          icon="eye"
          onPress={() => setRevealed(true)}
          style={{ marginTop: 16 }}
          size="lg"
        />
      )}
    </View>
  );
}

function RatingBtn({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      haptic="medium"
      onPress={onPress}
      style={({ pressed }) => [
        styles.rate,
        {
          backgroundColor: color,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontFamily: "Inter_700Bold",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
  },
  counter: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 8,
  },
  qLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  q: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 30,
    marginTop: 8,
    letterSpacing: -0.4,
  },
  a: {
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    lineHeight: 25,
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 22,
  },
  tap: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 24,
    fontStyle: "italic",
    textAlign: "center",
  },
  rate: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  celebrate: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  celebrateTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.4,
  },
});
