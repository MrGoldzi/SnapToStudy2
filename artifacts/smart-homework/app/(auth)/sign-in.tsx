import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { GoogleAuthSheet } from "@/components/GoogleAuthSheet";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signInEmail, signInGoogle } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showGoogle, setShowGoogle] = useState(false);

  const submit = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    const u = signInEmail(email);
    if (!u) {
      Alert.alert("Sign in failed", "Please check your email.");
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
            gap: 22,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            haptic="light"
            onPress={() => router.back()}
            style={{ alignSelf: "flex-start", padding: 6, marginLeft: -6 }}
          >
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>

          <View style={{ gap: 8 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Sign in to pick up where you left off.
            </Text>
          </View>

          <Pressable
            haptic="medium"
            onPress={() => setShowGoogle(true)}
            style={({ pressed }) => [
              styles.googleBtn,
              { backgroundColor: colors.google, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={styles.gIcon}>
              <Text style={styles.gLetter}>G</Text>
            </View>
            <Text style={[styles.googleText, { color: colors.googleText }]}>
              Continue with Google
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <Text style={[styles.or, { color: colors.mutedForeground }]}>
              or
            </Text>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <View style={{ gap: 12 }}>
            <Field
              colors={colors}
              icon="mail"
              placeholder="Email"
              value={email}
              onChange={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              colors={colors}
              icon="lock"
              placeholder="Password"
              value={password}
              onChange={setPassword}
              secure
            />
          </View>

          <PrimaryButton title="Sign In" icon="log-in" onPress={submit} size="lg" />

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Text style={[styles.foot, { color: colors.mutedForeground }]}>
              New here?
            </Text>
            <Pressable
              haptic="selection"
              onPress={() => router.replace("/(auth)/sign-up")}
            >
              <Text style={[styles.footLink, { color: colors.primary }]}>
                Create an account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <GoogleAuthSheet
        visible={showGoogle}
        onClose={() => setShowGoogle(false)}
        onConfirm={(name, email) => {
          signInGoogle(name, email);
          setShowGoogle(false);
          router.replace("/(tabs)");
        }}
      />
    </View>
  );
}

function Field({
  colors,
  icon,
  placeholder,
  value,
  onChange,
  secure,
  autoCapitalize,
  keyboardType,
}: {
  colors: ReturnType<typeof useColors>;
  icon: keyof typeof Feather.glyphMap;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View
      style={[
        styles.fieldWrap,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize ?? "sentences"}
        keyboardType={keyboardType}
        style={[styles.fieldInput, { color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    letterSpacing: -0.6,
  },
  sub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14,
    borderRadius: 14,
  },
  gIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  gLetter: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  googleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: { flex: 1, height: 1 },
  or: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  foot: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  footLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
