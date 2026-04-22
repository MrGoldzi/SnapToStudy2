import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowingOrb } from "@/components/GlowingOrb";
import { Markdownish } from "@/components/Markdownish";
import { Pressable } from "@/components/Pressable";
import { ScreenBackground } from "@/components/ScreenBackground";
import { VoiceMode } from "@/components/VoiceMode";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiChat, aiFlashcards } from "@/lib/api";
import { ChatTurn, type Subject } from "@/lib/types";

type QuickAction = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  prompt: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Flashcards",
    icon: "layers",
    prompt: "Make me 8 flashcards on photosynthesis",
  },
  {
    label: "Solve Math",
    icon: "hash",
    prompt: "I want to solve a math problem. Ask me to share it step by step.",
  },
  {
    label: "Explain",
    icon: "feather",
    prompt: "Explain a tricky concept to me in simple words with an example.",
  },
  {
    label: "Quiz me",
    icon: "help-circle",
    prompt:
      "Quiz me with 3 short questions on the last topic we studied (or pick one I should know).",
  },
];

const FLASHCARD_RE =
  /\b(?:make|create|generate|build|give\s+me|prepare)\s+(?:some\s+|a\s+set\s+of\s+|a\s+deck\s+of\s+)?(\d+\s+)?flash\s?cards?(?:\s+(?:on|about|for|of|covering|from|to\s+study)\s+(.+?))?\s*[.!?]?$/i;

function guessSubject(text: string): Subject {
  const t = text.toLowerCase();
  if (/\b(math|algebra|calculus|geometry|trig|equation|number)\b/.test(t)) return "math";
  if (/\b(physics|force|energy|motion|gravity)\b/.test(t)) return "physics";
  if (/\b(chem|chemistry|reaction|molecule|atom|bond)\b/.test(t)) return "chemistry";
  if (/\b(bio|biology|cell|dna|gene|organism|photosynth)\b/.test(t)) return "biology";
  if (/\b(history|war|ancient|empire|revolution|king|queen|treaty)\b/.test(t)) return "history";
  if (/\b(english|grammar|literature|poem|essay|writing)\b/.test(t)) return "english";
  if (/\b(spanish|french|german|chinese|japanese|language|vocabulary|verb|noun)\b/.test(t)) return "language";
  if (/\b(art|paint|music|sculpt)\b/.test(t)) return "art";
  if (/\b(science)\b/.test(t)) return "science";
  return "other";
}

function titleCase(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function TutorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, addChatTurn, clearChat, addDeck, addCards } = useApp();
  const params = useLocalSearchParams<{ send?: string }>();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const listRef = useRef<FlatList<ChatTurn>>(null);
  const autoSentRef = useRef(false);

  const data = [...state.chat].reverse();
  const isEmpty = state.chat.length === 0;
  const greetingName =
    state.user?.name?.split(" ")[0] || state.user?.name || "there";

  const sendChat = useCallback(
    async (history: { role: "user" | "assistant"; content: string }[]) => {
      setSending(true);
      try {
        const reply = await aiChat({
          messages: history,
          systemPrompt:
            "You are SmartHomework AI, a kind and clear tutor. Use short paragraphs, numbered steps, and bold key terms with **bold**. Be encouraging.",
        });
        addChatTurn({ role: "assistant", content: reply || "(no response)" });
      } catch {
        addChatTurn({
          role: "assistant",
          content:
            "Sorry, I couldn't reach the tutor right now. Please try again.",
        });
      } finally {
        setSending(false);
      }
    },
    [addChatTurn],
  );

  const buildFlashcards = useCallback(
    async (rawTopic: string, count: number) => {
      setSending(true);
      try {
        const cards = await aiFlashcards({
          topic: rawTopic,
          count: Math.min(Math.max(count, 3), 20),
        });
        if (!cards.length) {
          addChatTurn({
            role: "assistant",
            content:
              "I couldn't generate flashcards for that. Try giving me a more specific topic.",
          });
          return;
        }
        const subject = guessSubject(rawTopic);
        const deckName = titleCase(rawTopic).slice(0, 60) || "New Deck";
        const deck = addDeck(deckName, subject);
        addCards(deck.id, cards);
        addChatTurn({
          role: "assistant",
          content: `Done! I created **${deckName}** with ${cards.length} cards.\n\nOpen the **Study** tab to start reviewing, or tap the deck to jump in.\n\n_Sample card:_\n**Q:** ${cards[0].question}\n**A:** ${cards[0].answer}`,
        });
      } catch {
        addChatTurn({
          role: "assistant",
          content:
            "Sorry, I couldn't make flashcards just now. Please try again.",
        });
      } finally {
        setSending(false);
      }
    },
    [addCards, addChatTurn, addDeck],
  );

  const send = useCallback(
    async (textArg?: string) => {
      const text = (textArg ?? input).trim();
      if (!text || sending) return;
      setInput("");
      addChatTurn({ role: "user", content: text });

      // Detect "make flashcards on X" intent
      const m = text.match(FLASHCARD_RE);
      if (m) {
        const count = m[1] ? parseInt(m[1].trim(), 10) : 8;
        const topic = (m[2] ?? "")
          .trim()
          .replace(/^["'`]|["'`]$/g, "")
          .replace(/\s+please$/i, "");
        if (topic) {
          await buildFlashcards(topic, count);
          return;
        }
        // No topic — ask for one
        addChatTurn({
          role: "assistant",
          content:
            "Sure — what topic should the flashcards cover? (e.g. *photosynthesis*, *WW2 timeline*, *limits in calculus*)",
        });
        return;
      }

      const history = [
        ...state.chat,
        { role: "user" as const, content: text },
      ]
        .slice(-12)
        .map((t) => ({ role: t.role, content: t.content }));
      await sendChat(history);
    },
    [input, sending, addChatTurn, state.chat, sendChat, buildFlashcards],
  );

  // Auto-respond when navigated with ?send=1
  useEffect(() => {
    if (autoSentRef.current) return;
    if (params.send !== "1") return;
    if (sending) return;
    const last = state.chat[state.chat.length - 1];
    if (!last || last.role !== "user") return;
    autoSentRef.current = true;
    const history = state.chat.slice(-12).map((t) => ({
      role: t.role,
      content: t.content,
    }));
    void sendChat(history);
  }, [params.send, state.chat, sending, sendChat]);

  const onClear = () => {
    if (state.chat.length === 0) return;
    Alert.alert("Clear conversation?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearChat() },
    ]);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <ScreenBackground variant="hero" style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border + "55",
          },
        ]}
      >
        <Pressable
          haptic="light"
          onPress={goBack}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.topTitle, { color: colors.foreground }]}>
            AI Tutor
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            haptic="light"
            onPress={onClear}
            disabled={isEmpty}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: isEmpty ? 0.4 : pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="rotate-ccw" size={16} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {isEmpty ? (
          <EmptyHero
            name={greetingName}
            onPick={(p) => send(p)}
            onVoice={() => setVoiceOpen(true)}
          />
        ) : (
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(t) => t.id}
            inverted
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 16,
              gap: 10,
            }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              sending ? (
                <Animated.View
                  entering={FadeIn.duration(220)}
                  style={[
                    styles.bubble,
                    styles.bubbleAi,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <ActivityIndicator color={colors.primary} size="small" />
                </Animated.View>
              ) : null
            }
            renderItem={({ item }) => {
              const isUser = item.role === "user";
              return (
                <Animated.View
                  entering={(isUser ? FadeInUp : FadeInDown)
                    .duration(280)
                    .easing(Easing.out(Easing.cubic))}
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleAi,
                    {
                      backgroundColor: isUser ? colors.primary : colors.card,
                      borderColor: isUser
                        ? colors.primary
                        : colors.border,
                      alignSelf: isUser ? "flex-end" : "flex-start",
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
                </Animated.View>
              );
            }}
          />
        )}

        {/* Composer */}
        <View
          style={[
            styles.composerWrap,
            { paddingBottom: insets.bottom + 10 },
          ]}
        >
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Pressable
              haptic="light"
              onPress={() => setVoiceOpen(true)}
              style={({ pressed }) => [
                styles.pillIcon,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="mic" size={18} color={colors.mutedForeground} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              multiline
              maxLength={1000}
              editable={!sending}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
            <Pressable
              haptic="medium"
              onPress={() => send()}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    !input.trim() || sending ? 0.45 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather
                name="arrow-up"
                size={18}
                color={colors.primaryForeground}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <VoiceMode
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        title="Voice Tutor"
      />
    </ScreenBackground>
  );
}

function EmptyHero({
  name,
  onPick,
  onVoice,
}: {
  name: string;
  onPick: (prompt: string) => void;
  onVoice: () => void;
}) {
  const colors = useColors();
  return (
    <Animated.ScrollView
      entering={FadeIn.duration(260)}
      contentContainerStyle={styles.heroScroll}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.duration(380)}
        style={styles.heroHeader}
      >
        <Text style={[styles.heroGreeting, { color: colors.mutedForeground }]}>
          Hello {name}, I am your virtual tutor
        </Text>
        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          How can I help you today?
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(120).duration(420)}
        style={styles.heroOrb}
      >
        <GlowingOrb maxFraction={0.62} maxSize={240} state="idle" />
      </Animated.View>

      <Animated.Text
        entering={FadeIn.delay(220).duration(360)}
        style={[styles.heroCaption, { color: colors.mutedForeground }]}
      >
        Ask anything about a subject, paste a problem, or tap an idea below.
      </Animated.Text>

      <Animated.View
        entering={FadeInUp.delay(280).duration(420)}
        style={styles.actionGrid}
      >
        {QUICK_ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            haptic="selection"
            onPress={() => onPick(a.prompt)}
            style={({ pressed }) => [
              styles.actionChip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.actionIconWrap,
                { backgroundColor: colors.primary + "1f" },
              ]}
            >
              <Feather name={a.icon} size={14} color={colors.primary} />
            </View>
            <Text
              style={[styles.actionLabel, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {a.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(360).duration(360)}
        style={styles.voiceCta}
      >
        <Pressable
          haptic="medium"
          onPress={onVoice}
          style={({ pressed }) => [
            styles.voiceBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Feather name="mic" size={16} color={colors.primaryForeground} />
          <Text
            style={[
              styles.voiceLabel,
              { color: colors.primaryForeground },
            ]}
          >
            Start voice tutor
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  topTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  // Chat
  bubble: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: "88%",
  },
  bubbleUser: {
    borderBottomRightRadius: 6,
  },
  bubbleAi: {
    borderBottomLeftRadius: 6,
  },
  userText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
  },
  // Hero (empty state)
  heroScroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    alignItems: "center",
    gap: 18,
  },
  heroHeader: {
    alignItems: "center",
    gap: 6,
  },
  heroGreeting: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.1,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    letterSpacing: -0.6,
    textAlign: "center",
  },
  heroOrb: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  heroCaption: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 320,
  },
  actionGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  actionChip: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  voiceCta: {
    marginTop: 6,
  },
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  voiceLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: -0.1,
  },
  // Composer
  composerWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    borderWidth: 1,
    borderRadius: 28,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.18,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingHorizontal: 4,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
