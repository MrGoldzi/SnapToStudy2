import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Pressable } from "@/components/Pressable";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SubjectChip, subjectColor } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useApp();
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Study Groups"
        subtitle="Learn together, share resources"
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <PrimaryButton
            title="Create"
            icon="plus"
            onPress={() => router.push("/group/new")}
            style={{ flex: 1 }}
            size="lg"
          />
          <PrimaryButton
            title="Join with code"
            icon="user-plus"
            variant="secondary"
            onPress={() => router.push("/group/join")}
            style={{ flex: 1 }}
            size="lg"
          />
        </View>

        {state.groups.length === 0 ? (
          <EmptyState
            icon="users"
            title="No groups yet"
            message="Start a study circle for a class, or join one with an invite code from a classmate."
          />
        ) : (
          state.groups.map((g) => {
            const lastMsg = state.messages
              .filter((m) => m.groupId === g.id)
              .sort((a, b) => b.createdAt - a.createdAt)[0];
            const hue = subjectColor(g.subject);
            return (
              <Pressable
                key={g.id}
                haptic="selection"
                onPress={() => router.push(`/group/${g.id}` as any)}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <Card>
                  <View style={styles.row}>
                    <View
                      style={[
                        styles.gAvatar,
                        { backgroundColor: hue + "26" },
                      ]}
                    >
                      <Text
                        style={{
                          color: hue,
                          fontFamily: "Inter_700Bold",
                          fontSize: 17,
                        }}
                      >
                        {g.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.name, { color: colors.foreground }]}
                      >
                        {g.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.last, { color: colors.mutedForeground }]}
                      >
                        {lastMsg
                          ? `${lastMsg.authorName}: ${lastMsg.content}`
                          : `${g.members.length} member${g.members.length === 1 ? "" : "s"} · code ${g.inviteCode}`}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                        <SubjectChip subject={g.subject} small />
                        <View
                          style={[
                            styles.membersPill,
                            { backgroundColor: colors.surface },
                          ]}
                        >
                          <Feather name="users" size={11} color={colors.mutedForeground} />
                          <Text
                            style={{
                              color: colors.mutedForeground,
                              fontFamily: "Inter_500Medium",
                              fontSize: 11,
                            }}
                          >
                            {g.members.length}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  last: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  membersPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
});
