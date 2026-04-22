import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { Pressable } from "@/components/Pressable";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SubjectChip } from "@/components/SubjectChip";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { Assignment } from "@/lib/types";

type Filter = "today" | "week" | "all" | "done";

const DAY = 86400000;

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, toggleAssignment } = useApp();
  const [filter, setFilter] = useState<Filter>("today");
  const tabBarHeight = Platform.OS === "web" ? 84 : 90;

  const sections = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const t0 = startOfToday.getTime();

    let list = [...state.assignments];
    if (filter === "today") {
      list = list.filter((a) => !a.done && a.dueAt < t0 + DAY);
    } else if (filter === "week") {
      list = list.filter((a) => !a.done && a.dueAt < t0 + 7 * DAY);
    } else if (filter === "all") {
      list = list.filter((a) => !a.done);
    } else {
      list = list.filter((a) => a.done);
    }
    list.sort((a, b) => a.dueAt - b.dueAt);

    const groups = new Map<string, Assignment[]>();
    for (const a of list) {
      const key = bucketLabel(a.dueAt, now, a.done);
      const cur = groups.get(key) ?? [];
      cur.push(a);
      groups.set(key, cur);
    }
    return Array.from(groups.entries());
  }, [state.assignments, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Planner"
        subtitle="Stay ahead of every deadline"
        right={
          <Pressable
            haptic="medium"
            onPress={() => router.push("/assignment/new")}
            style={({ pressed }) => [
              styles.headerBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color={colors.primaryForeground} />
          </Pressable>
        }
      />
      <View style={styles.filters}>
        {(["today", "week", "all", "done"] as Filter[]).map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              haptic="selection"
              onPress={() => setFilter(f)}
              style={({ pressed }) => [
                styles.filterBtn,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: active ? colors.primaryForeground : colors.foreground,
                  textTransform: "capitalize",
                }}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {sections.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Nothing here yet"
            message={
              filter === "done"
                ? "Completed work will land here."
                : "Tap + to add an assignment, or scan one with the camera."
            }
          />
        ) : (
          sections.map(([label, items]) => (
            <View key={label} style={{ gap: 10 }}>
              <Text style={[styles.bucket, { color: colors.mutedForeground }]}>
                {label}
              </Text>
              {items.map((a) => (
                <AssignmentRow
                  key={a.id}
                  a={a}
                  onPress={() => router.push(`/assignment/${a.id}` as any)}
                  onToggle={() => toggleAssignment(a.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AssignmentRow({
  a,
  onPress,
  onToggle,
}: {
  a: Assignment;
  onPress: () => void;
  onToggle: () => void;
}) {
  const colors = useColors();
  const overdue = !a.done && a.dueAt < Date.now();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: overdue ? colors.destructive + "55" : colors.border,
        },
      ]}
    >
      <Pressable haptic="medium" onPress={onToggle} hitSlop={8}>
        <View
          style={[
            styles.check,
            {
              borderColor: a.done ? colors.success : colors.border,
              backgroundColor: a.done ? colors.success : "transparent",
            },
          ]}
        >
          {a.done && (
            <Feather name="check" size={14} color={colors.primaryForeground} />
          )}
        </View>
      </Pressable>
      <Pressable haptic="selection" onPress={onPress} style={{ flex: 1, gap: 6 }}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            {
              color: colors.foreground,
              textDecorationLine: a.done ? "line-through" : "none",
              opacity: a.done ? 0.6 : 1,
            },
          ]}
        >
          {a.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <SubjectChip subject={a.subject} small />
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 12,
              color: overdue ? colors.destructive : colors.mutedForeground,
            }}
          >
            {dueLabel(a.dueAt, a.done)}
          </Text>
        </View>
      </Pressable>
      <Feather
        name="chevron-right"
        size={18}
        color={colors.mutedForeground}
      />
    </View>
  );
}

function bucketLabel(ts: number, now: number, done: boolean): string {
  if (done) {
    const d = Math.round((now - ts) / DAY);
    if (d <= 1) return "Recently";
    if (d <= 7) return "This week";
    return "Earlier";
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  if (ts < t0) return "Overdue";
  if (ts < t0 + DAY) return "Today";
  if (ts < t0 + 2 * DAY) return "Tomorrow";
  if (ts < t0 + 7 * DAY) return "This week";
  return "Later";
}

function dueLabel(dueAt: number, done: boolean): string {
  if (done) {
    return "Done";
  }
  const ms = dueAt - Date.now();
  const d = Math.round(ms / DAY);
  if (ms < 0) {
    const od = Math.abs(d);
    if (od === 0) return "Overdue today";
    return `Overdue ${od}d`;
  }
  if (d === 0) {
    const h = Math.max(1, Math.round(ms / 3600000));
    return `Due in ${h}h`;
  }
  if (d === 1) return "Due tomorrow";
  return `Due in ${d}d`;
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  bucket: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
