import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Subject, SUBJECTS } from "@/lib/types";

const SUBJECT_HUES: Record<Subject, string> = {
  math: "#6366f1",
  science: "#10b981",
  english: "#f59e0b",
  history: "#ef4444",
  language: "#8b5cf6",
  art: "#ec4899",
  other: "#64748b",
};

export function subjectColor(s: Subject): string {
  return SUBJECT_HUES[s];
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
  const colors = useColors();
  const meta = subjectMeta(subject);
  const hue = subjectColor(subject);
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: hue + "22",
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
        style={[
          styles.text,
          { color: hue, fontSize: small ? 11 : 12 },
        ]}
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
