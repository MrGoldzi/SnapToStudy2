import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { Pressable } from "@/components/Pressable";
import { SubjectChip, subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { GroupMessage } from "@/lib/types";

export default function GroupChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, postMessage, leaveGroup } = useApp();
  const group = state.groups.find((g) => g.id === id);
  const [text, setText] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const listRef = useRef<FlatList<GroupMessage>>(null);

  const messages = useMemo(
    () =>
      state.messages
        .filter((m) => m.groupId === id)
        .sort((a, b) => a.createdAt - b.createdAt)
        .reverse(),
    [state.messages, id],
  );

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          icon="alert-circle"
          title="Group not found"
          message="It may have been removed."
        />
      </View>
    );
  }

  const send = () => {
    const t = text.trim();
    if (!t) return;
    postMessage(group.id, t);
    setText("");
  };

  const shareDeck = (deckId: string, label: string) => {
    postMessage(group.id, `Shared a deck: ${label}`, {
      kind: "deck",
      refId: deckId,
      label,
    });
    setShowShare(false);
  };

  const shareScan = (scanId: string, label: string) => {
    postMessage(group.id, `Shared a scan: ${label}`, {
      kind: "scan",
      refId: scanId,
      label,
    });
    setShowShare(false);
  };

  const copyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(group.inviteCode);
      }
    } catch {
      // ignore – we still show the code in the alert
    }
    Alert.alert("Invite code", group.inviteCode);
  };

  const onLeave = () => {
    Alert.alert("Leave group?", "You'll need a new invite to rejoin.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => {
          leaveGroup(group.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <Pressable
              haptic="light"
              onPress={() => setShowInfo(true)}
              hitSlop={8}
              style={{ padding: 6 }}
            >
              <Feather name="info" size={20} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <View style={[styles.subBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <SubjectChip subject={group.subject} small />
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
          {group.members.length} member{group.members.length === 1 ? "" : "s"}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable
          haptic="selection"
          onPress={copyCode}
          style={({ pressed }) => [
            styles.codePill,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="copy" size={11} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1 }}>
            {group.inviteCode}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          ref={listRef}
          data={messages}
          inverted={messages.length > 0}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            padding: 14,
            gap: 8,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center" }}>
              <EmptyState
                icon="message-square"
                title="Start the conversation"
                message="Say hi, share a deck, or post a scan to get help from the group."
              />
            </View>
          }
          renderItem={({ item }) => {
            const isYou = item.authorId === (state.user?.id ?? "you");
            return (
              <View
                style={[
                  styles.bubble,
                  {
                    alignSelf: isYou ? "flex-end" : "flex-start",
                    backgroundColor: isYou ? colors.primary : colors.card,
                    borderColor: isYou ? colors.primary : colors.border,
                  },
                ]}
              >
                {!isYou && (
                  <Text
                    style={{
                      color: subjectColor(group.subject),
                      fontFamily: "Inter_700Bold",
                      fontSize: 11,
                      marginBottom: 4,
                    }}
                  >
                    {item.authorName}
                  </Text>
                )}
                <Text
                  style={{
                    color: isYou ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {item.content}
                </Text>
                {item.attachment && (
                  <View
                    style={[
                      styles.attach,
                      {
                        borderColor: isYou
                          ? "#ffffff44"
                          : colors.border,
                        backgroundColor: isYou ? "#ffffff22" : colors.surface,
                      },
                    ]}
                  >
                    <Feather
                      name={item.attachment.kind === "deck" ? "layers" : "image"}
                      size={13}
                      color={isYou ? colors.primaryForeground : colors.primary}
                    />
                    <Text
                      style={{
                        color: isYou ? colors.primaryForeground : colors.foreground,
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                      }}
                    >
                      {item.attachment.label}
                    </Text>
                  </View>
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
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          <Pressable
            haptic="medium"
            onPress={() => setShowShare(true)}
            style={({ pressed }) => [
              styles.attachBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="paperclip" size={18} color={colors.primary} />
          </Pressable>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message the group…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
              multiline
              maxLength={500}
              onSubmitEditing={send}
            />
            <Pressable
              haptic="medium"
              onPress={send}
              disabled={!text.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !text.trim() ? 0.4 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="arrow-up" size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Info modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={modalStyles.backdrop}>
          <View
            style={[
              modalStyles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={modalStyles.handle} />
            <View style={modalStyles.headerRow}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>
                {group.name}
              </Text>
              <Pressable
                haptic="light"
                onPress={() => setShowInfo(false)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {group.description ? (
              <Text style={[modalStyles.desc, { color: colors.mutedForeground }]}>
                {group.description}
              </Text>
            ) : null}

            <View style={[modalStyles.codeBox, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 1.5 }}>
                INVITE CODE
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <Text
                  style={{
                    color: colors.primary,
                    fontFamily: "Inter_700Bold",
                    fontSize: 28,
                    letterSpacing: 6,
                  }}
                >
                  {group.inviteCode}
                </Text>
                <Pressable
                  haptic="medium"
                  onPress={copyCode}
                  style={({ pressed }) => [
                    modalStyles.copyBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="copy" size={14} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                    Copy
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={[modalStyles.section, { color: colors.mutedForeground }]}>
              MEMBERS
            </Text>
            {group.members.map((m) => (
              <View key={m.id} style={modalStyles.memberRow}>
                <View
                  style={[
                    modalStyles.memberAvatar,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: "Inter_700Bold",
                      fontSize: 13,
                    }}
                  >
                    {m.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}>
                  {m.name}
                </Text>
                {m.isYou && (
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
                    you
                  </Text>
                )}
              </View>
            ))}

            <Pressable
              haptic="medium"
              onPress={() => {
                setShowInfo(false);
                onLeave();
              }}
              style={({ pressed }) => [
                modalStyles.leaveBtn,
                {
                  borderColor: colors.destructive + "55",
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="log-out" size={16} color={colors.destructive} />
              <Text style={{ color: colors.destructive, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                Leave group
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Share resource modal */}
      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <View style={modalStyles.backdrop}>
          <View
            style={[
              modalStyles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={modalStyles.handle} />
            <View style={modalStyles.headerRow}>
              <Text style={[modalStyles.title, { color: colors.foreground }]}>
                Share a resource
              </Text>
              <Pressable
                haptic="light"
                onPress={() => setShowShare(false)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[modalStyles.section, { color: colors.mutedForeground }]}>
              MY DECKS
            </Text>
            {state.decks.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, paddingVertical: 8 }}>
                No decks yet.
              </Text>
            ) : (
              state.decks.slice(0, 5).map((d) => (
                <Pressable
                  key={d.id}
                  haptic="selection"
                  onPress={() => shareDeck(d.id, d.name)}
                  style={({ pressed }) => [
                    modalStyles.shareRow,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="layers" size={16} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}
                  >
                    {d.name}
                  </Text>
                  <Feather name="send" size={14} color={colors.mutedForeground} />
                </Pressable>
              ))
            )}

            <Text style={[modalStyles.section, { color: colors.mutedForeground }]}>
              RECENT SCANS
            </Text>
            {state.scans.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, paddingVertical: 8 }}>
                No scans yet.
              </Text>
            ) : (
              state.scans.slice(0, 5).map((s) => (
                <Pressable
                  key={s.id}
                  haptic="selection"
                  onPress={() =>
                    shareScan(
                      s.id,
                      firstLine(s.content),
                    )
                  }
                  style={({ pressed }) => [
                    modalStyles.shareRow,
                    { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="image" size={16} color={colors.primary} />
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}
                  >
                    {firstLine(s.content)}
                  </Text>
                  <Feather name="send" size={14} color={colors.mutedForeground} />
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function firstLine(s: string): string {
  const line = s.split("\n").map((l) => l.trim()).find((l) => l.length > 0);
  return line ? line.replace(/^#+\s*/, "").slice(0, 60) : "Scan";
}

const styles = StyleSheet.create({
  subBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: "84%",
  },
  attach: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderWidth: 1,
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
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

const modalStyles = StyleSheet.create({
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
    gap: 8,
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
  title: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  desc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 4,
  },
  codeBox: {
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  section: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 16,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
