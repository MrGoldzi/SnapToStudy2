import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SubjectChip, subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function DeckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteDeck, deleteCard } = useApp();

  const deck = state.decks.find((d) => d.id === id);
  const cards = state.cards.filter((c) => c.deckId === id);

  if (!deck) {
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
          Deck not found.
        </Text>
      </View>
    );
  }

  const due = cards.filter((c) => c.dueAt <= Date.now()).length;

  const remove = () => {
    Alert.alert(
      "Delete this deck?",
      `${cards.length} cards will be lost. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDeck(deck.id);
            router.back();
          },
        },
      ],
    );
  };

  const hue = subjectColor(deck.subject);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: insets.bottom + 32,
        gap: 14,
      }}
    >
      <Card>
        <View style={{ gap: 10 }}>
          <SubjectChip subject={deck.subject} />
          <Text style={[styles.title, { color: colors.foreground }]}>{deck.name}</Text>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Stat label="Cards" value={String(cards.length)} colors={colors} />
            <Stat label="Due now" value={String(due)} colors={colors} hue={hue} />
            <Stat
              label="Mastery"
              value={`${
                cards.reduce((a, c) => a + c.reviews, 0) === 0
                  ? 0
                  : Math.round(
                      (cards.reduce((a, c) => a + c.correct, 0) /
                        cards.reduce((a, c) => a + c.reviews, 0)) *
                        100,
                    )
              }%`}
              colors={colors}
            />
          </View>
        </View>
      </Card>

      <PrimaryButton
        title={due > 0 ? `Review ${due} cards` : "Review all"}
        icon="play"
        onPress={() => router.push(`/deck/${deck.id}/review` as any)}
        disabled={cards.length === 0}
        size="lg"
      />

      <Text style={[styles.section, { color: colors.foreground }]}>
        All cards
      </Text>
      {cards.map((c, i) => (
        <Card key={c.id}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                color: hue,
                width: 24,
              }}
            >
              {i + 1}
            </Text>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.q, { color: colors.foreground }]}>
                {c.question}
              </Text>
              <Text style={[styles.a, { color: colors.mutedForeground }]}>
                {c.answer}
              </Text>
            </View>
            <Pressable
              haptic="light"
              onPress={() => deleteCard(c.id)}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Feather name="trash-2" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </Card>
      ))}

      <Pressable
        haptic="medium"
        onPress={remove}
        style={({ pressed }) => [
          styles.dangerBtn,
          {
            borderColor: colors.destructive + "55",
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="trash-2" size={16} color={colors.destructive} />
        <Text
          style={{
            color: colors.destructive,
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
          }}
        >
          Delete deck
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  colors,
  hue,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  hue?: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: hue ?? colors.foreground,
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

const styles = StyleSheet.create({
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    letterSpacing: -0.4,
  },
  section: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 4,
  },
  q: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  a: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
  dangerBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
});
