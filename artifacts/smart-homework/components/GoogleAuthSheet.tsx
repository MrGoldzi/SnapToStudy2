import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string, email: string) => void;
};

/**
 * Lightweight in-app Google account capture. In production this would launch
 * the real Google OAuth flow and receive the verified profile back; here we
 * present a transparent confirmation sheet so the rest of the app can show
 * Google-linked status, contact invites, and sync indicators authentically.
 */
export function GoogleAuthSheet({ visible, onClose, onConfirm }: Props) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = () => {
    if (!email.trim() || !/.+@.+\..+/.test(email)) return;
    onConfirm(name.trim() || email.split("@")[0], email.trim());
    setName("");
    setEmail("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.gIcon}>
              <Text style={styles.gLetter}>G</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Continue with Google
              </Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>
                Confirm the Google account to link.
              </Text>
            </View>
            <Pressable
              haptic="light"
              onPress={onClose}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={{ gap: 10, marginTop: 6 }}>
            <View
              style={[
                styles.field,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
            <View
              style={[
                styles.field,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                placeholder="you@gmail.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
          </View>

          <PrimaryButton
            title="Link & continue"
            icon="check"
            onPress={submit}
            size="lg"
            style={{ marginTop: 14 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000a",
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    gap: 12,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#ffffff22",
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  gLetter: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
