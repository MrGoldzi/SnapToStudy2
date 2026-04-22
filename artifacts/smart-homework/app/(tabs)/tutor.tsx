import { Feather } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { Markdownish } from "@/components/Markdownish";
import { Pressable } from "@/components/Pressable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiChat } from "@/lib/api";
import { ChatTurn } from "@/lib/types";

const QUICK_PROMPTS = [
  "Explain this in simpler words",
  "Give me a worked example",
  "Quiz me on the last topic",
  "Help me start an essay outline",
];

export default function TutorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, addChatTurn, clearChat } = useApp();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatTurn>>(null);
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  // Inverted list — newest first
  const data = [...state.chat].reverse();

  const send = useCallback(
    async (textArg?: string) => {
      const text = (textArg ?? input).trim();
      if (!text || sending) return;
      setInput("");
      setSending(true);
      const userTurn = addChatTurn({ role: "user", content: text });
      // Build messages from history (after add)
      const history = [...state.chat, userTurn].slice(-12).map((t) => ({
        role: t.role,
        content: t.content,
      }));
      try {
        const reply = await aiChat({ messages: history });
        addChatTurn({ role: "assistant", content: reply || "(no response)" });
      } catch (err) {
        addChatTurn({
          role: "assistant",
          content:
            "Sorry, I couldn't reach the tutor right now. Please try again.",
        });
      } finally {
        setSending(false);
      }
    },
    [input, sending, addChatTurn, state.chat],
  );

  const onClear = () => {
    if (state.chat.length === 0) return;
    Alert.alert("Clear conversation?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => clearChat(),
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="AI Tutor"
        subtitle="Ask anything about your studies"
        right={
          <Pressable
            haptic="light"
            onPress={onClear}
            style={({ pressed }) => [
              styles.headerBtn,
              {
                backgroundColor: colors.secondary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="rotate-ccw" size={18} color={colors.primary} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(t) => t.id}
          inverted={data.length > 0}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
            gap: 10,
            flexGrow: 1,
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            sending ? (
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    alignSelf: "flex-start",
                  },
                ]}
              >
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center" }}>
              <EmptyState
                icon="message-circle"
                title="Meet your tutor"
                message="Ask for help on any homework problem, request a worked example, or get a custom quiz."
              />
              <View style={styles.suggestRow}>
                {QUICK_PROMPTS.map((p) => (
                  <Pressable
                    key={p}
                    haptic="selection"
                    onPress={() => send(p)}
                    style={({ pressed }) => [
                      styles.suggestion,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name="zap"
                      size={13}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 13,
                      }}
                    >
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isUser ? colors.primary : colors.card,
                    borderColor: isUser ? colors.primary : colors.border,
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                  },
                ]}
              >
                {isUser ? (
                  <Text
                    style={[
                      styles.userText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {item.content}
                  </Text>
                ) : (
                  <Markdownish text={item.content} size={14} />
                )}
              </View>
            );
          }}
        />
        <View
          style={[
            styles.composer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? tabBarHeight : 8),
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your tutor anything…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              multiline
              maxLength={1000}
              onSubmitEditing={() => send()}
              editable={!sending}
            />
            <Pressable
              haptic="medium"
              onPress={() => send()}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !input.trim() || sending ? 0.4 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="arrow-up" size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  userText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
  },
  suggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginTop: -16,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 8,
    maxHeight: 120,
    minHeight: 32,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
