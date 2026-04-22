import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiFlashcards } from "@/lib/api";
import { Subject, SUBJECTS } from "@/lib/types";

export default function NewDeckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addDeck, addCards, awardXp } = useApp();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    if (!topic.trim() && !notes.trim()) {
      Alert.alert(
        "Add a topic or notes",
        "I need something to base the cards on.",
      );
      return;
    }
    setBusy(true);
    try {
      const cards = await aiFlashcards({
        topic: topic.trim() || name.trim(),
        notes: notes.trim() || undefined,
        count: 8,
      });
      if (cards.length === 0) {
        Alert.alert("No cards generated", "Try a different topic or longer notes.");
        return;
      }
      const deck = addDeck(name.trim(), subject);
      addCards(deck.id, cards);
      awardXp(20);
      router.replace(`/deck/${deck.id}` as any);
    } catch (err) {
      Alert.alert(
        "Couldn't create deck",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 24),
        gap: 18,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        Deck name
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Photosynthesis basics"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        autoFocus
      />
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Subject</Text>
      <View style={styles.chipsWrap}>
        {SUBJECTS.map((s) => {
          const active = subject === s.key;
          const hue = subjectColor(s.key);
          return (
            <Pressable
              key={s.key}
              haptic="selection"
              onPress={() => setSubject(s.key)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? hue : colors.card,
                  borderColor: active ? hue : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: active ? "#fff" : colors.foreground }}>
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Topic</Text>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="What should the cards cover?"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
      />
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Paste class notes or definitions to base cards on…"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.card,
            height: 140,
            textAlignVertical: "top",
            paddingTop: 14,
          },
        ]}
        multiline
      />
      <PrimaryButton
        title={busy ? "Generating cards…" : "Generate flashcards"}
        icon="zap"
        onPress={create}
        loading={busy}
        disabled={!name.trim()}
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: -8,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
