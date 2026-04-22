import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Subject, SUBJECTS } from "@/lib/types";

const SUBJECT_HUES: Record<Subject, string> = {
  math: "#8b5cf6",
  physics: "#3b82f6",
  chemistry: "#22d3ee",
  biology: "#22c55e",
  science: "#10b981",
  english: "#f59e0b",
  history: "#ef4444",
  language: "#a78bfa",
  art: "#ec4899",
  other: "#94a3b8",
};

export function subjectColor(s: Subject): string {
  return SUBJECT_HUES[s] ?? SUBJECT_HUES.other;
}

export function subjectMeta(s: Subject) {
  return SUBJECTS.find((x) => x.key === s) ?? SUBJECTS[SUBJECTS.length - 1];
}

export function SubjectChip({
  subject,
  small,
}: {
  subject: Subject;
  small?: boolean;
}) {
  const meta = subjectMeta(subject);
  const hue = subjectColor(subject);
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: hue + "26",
          paddingVertical: small ? 4 : 6,
          paddingHorizontal: small ? 8 : 10,
        },
      ]}
    >
      <Feather
        name={meta.icon as keyof typeof Feather.glyphMap}
        size={small ? 11 : 13}
        color={hue}
      />
      <Text
        style={[styles.text, { color: hue, fontSize: small ? 11 : 12 }]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_500Medium",
  },
});

export { SUBJECT_HUES };
