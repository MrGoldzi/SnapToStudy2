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

import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Subject, SUBJECTS } from "@/lib/types";

const QUICK_DUE: { label: string; offsetMs: number }[] = [
  { label: "Today", offsetMs: 0 },
  { label: "Tomorrow", offsetMs: 86400000 },
  { label: "+3 days", offsetMs: 3 * 86400000 },
  { label: "Next week", offsetMs: 7 * 86400000 },
];

export default function NewAssignmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addAssignment } = useApp();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [dueOffset, setDueOffset] = useState(86400000);

  const save = () => {
    if (!title.trim()) return;
    const startOfDay = new Date();
    startOfDay.setHours(20, 0, 0, 0);
    addAssignment({
      title: title.trim(),
      subject,
      dueAt: startOfDay.getTime() + dueOffset,
      notes: notes.trim() || undefined,
    });
    router.back();
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
      <Field label="Title" colors={colors}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Algebra worksheet, Chapter 4"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          autoFocus
        />
      </Field>

      <Field label="Subject" colors={colors}>
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
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                    color: active ? "#fff" : colors.foreground,
                  }}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Due" colors={colors}>
        <View style={styles.chipsWrap}>
          {QUICK_DUE.map((q) => {
            const active = dueOffset === q.offsetMs;
            return (
              <Pressable
                key={q.label}
                haptic="selection"
                onPress={() => setDueOffset(q.offsetMs)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                    color: active ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {q.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label="Notes (optional)" colors={colors}>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Pages, instructions, links…"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              color: colors.foreground,
              borderColor: colors.border,
              backgroundColor: colors.card,
              height: 110,
              textAlignVertical: "top",
              paddingTop: 14,
            },
          ]}
          multiline
        />
      </Field>

      <PrimaryButton
        title="Add to planner"
        icon="check"
        onPress={save}
        disabled={!title.trim()}
        size="lg"
      />
    </ScrollView>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
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
