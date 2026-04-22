import { Feather } from "@expo/vector-icons";
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

import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function JoinGroupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { joinGroupByCode, state } = useApp();
  const [code, setCode] = useState("");

  const submit = () => {
    if (code.trim().length < 4) {
      Alert.alert("Invalid code", "Invite codes are 6 characters long.");
      return;
    }
    const g = joinGroupByCode(code);
    if (g) router.replace(`/group/${g.id}` as any);
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
      <Card>
        <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
          <View
            style={[
              styles.bigIcon,
              { backgroundColor: colors.primary + "1f" },
            ]}
          >
            <Feather name="users" size={28} color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18 }}>
            Join with an invite code
          </Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>
            Ask a classmate for their group's 6-character code.
          </Text>
        </View>
      </Card>

      <Text style={[styles.label, { color: colors.mutedForeground }]}>Invite code</Text>
      <TextInput
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="ABC123"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={6}
        style={[
          styles.codeInput,
          {
            color: colors.foreground,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        autoFocus
      />

      <PrimaryButton
        title="Join group"
        icon="log-in"
        onPress={submit}
        disabled={code.trim().length < 4}
        size="lg"
      />

      {state.groups.length > 0 && (
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" }}>
          You're already in {state.groups.length} group{state.groups.length === 1 ? "" : "s"}.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bigIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  codeInput: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: 8,
    textAlign: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 18,
  },
});
