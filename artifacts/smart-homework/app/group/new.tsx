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
import { Subject, SUBJECTS } from "@/lib/types";

export default function NewGroupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createGroup } = useApp();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [description, setDescription] = useState("");

  const submit = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your study circle a name.");
      return;
    }
    const g = createGroup({
      name: name.trim(),
      subject,
      description: description.trim() || undefined,
    });
    router.replace(`/group/${g.id}` as any);
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
        Group name
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Algebra study buddies"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
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

      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        Description (optional)
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What will this group focus on?"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.card,
            height: 100,
            textAlignVertical: "top",
            paddingTop: 14,
          },
        ]}
        multiline
      />

      <PrimaryButton
        title="Create group"
        icon="users"
        onPress={submit}
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
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
