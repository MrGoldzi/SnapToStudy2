import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Markdownish } from "@/components/Markdownish";
import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SubjectChip } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiChat } from "@/lib/api";

export default function AssignmentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, toggleAssignment, deleteAssignment } = useApp();

  const a = state.assignments.find((x) => x.id === id);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  if (!a) {
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
          Assignment not found.
        </Text>
      </View>
    );
  }

  const askHint = async (mode: "hint" | "plan" | "concepts") => {
    setLoadingHint(true);
    setHint(null);
    try {
      const prompts: Record<typeof mode, string> = {
        hint: `Give me a small hint to start this assignment without revealing the full answer:\n\nTitle: ${a.title}\nSubject: ${a.subject}\nNotes: ${a.notes ?? "(none)"}`,
        plan: `Break this assignment into a 3-5 step study plan I can finish in one sitting:\n\nTitle: ${a.title}\nSubject: ${a.subject}\nNotes: ${a.notes ?? "(none)"}`,
        concepts: `List the 3 most important concepts I need to understand to complete this assignment, with a one-sentence explanation each:\n\nTitle: ${a.title}\nSubject: ${a.subject}\nNotes: ${a.notes ?? "(none)"}`,
      };
      const reply = await aiChat({
        messages: [{ role: "user", content: prompts[mode] }],
      });
      setHint(reply);
    } catch {
      setHint("Couldn't reach the tutor. Please try again.");
    } finally {
      setLoadingHint(false);
    }
  };

  const remove = () => {
    Alert.alert("Delete assignment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteAssignment(a.id);
          router.back();
        },
      },
    ]);
  };

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
          <SubjectChip subject={a.subject} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {a.title}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Due {new Date(a.dueAt).toLocaleString()}
          </Text>
          {a.notes ? (
            <Text style={[styles.notes, { color: colors.foreground }]}>
              {a.notes}
            </Text>
          ) : null}
        </View>
      </Card>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <PrimaryButton
          title={a.done ? "Mark active" : "Mark done"}
          icon={a.done ? "rotate-ccw" : "check"}
          onPress={() => toggleAssignment(a.id)}
          style={{ flex: 1 }}
        />
        <Pressable
          haptic="medium"
          onPress={remove}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      <Text style={[styles.section, { color: colors.foreground }]}>
        Step-by-step learning
      </Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <ToolBtn label="Hint me" icon="zap" onPress={() => askHint("hint")} loading={loadingHint} />
        <ToolBtn label="Study plan" icon="list" onPress={() => askHint("plan")} loading={loadingHint} />
        <ToolBtn label="Key concepts" icon="book" onPress={() => askHint("concepts")} loading={loadingHint} />
      </View>

      {loadingHint && (
        <Card style={{ alignItems: "center", paddingVertical: 24 }}>
          <ActivityIndicator color={colors.primary} />
        </Card>
      )}
      {hint && !loadingHint && (
        <Card>
          <Markdownish text={hint} size={14} />
        </Card>
      )}
    </ScrollView>
  );
}

function ToolBtn({
  label,
  icon,
  onPress,
  loading,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  loading?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      haptic="selection"
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.toolBtn,
        {
          backgroundColor: colors.secondary,
          opacity: loading ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.secondaryForeground }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: -0.4,
  },
  meta: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  notes: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  section: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginTop: 4,
  },
  iconBtn: {
    width: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
