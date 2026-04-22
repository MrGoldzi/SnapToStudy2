import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

/**
 * Lightweight markdown-ish renderer (no native deps).
 * Supports: # / ## / ### headings, - / * bullets, 1. numbered,
 * **bold**, *italic*, `code`, blank-line paragraphs.
 */
export function Markdownish({
  text,
  size = 15,
}: {
  text: string;
  size?: number;
}) {
  const colors = useColors();
  const lines = text.split(/\r?\n/);

  const blocks: React.ReactNode[] = [];
  let listItems: { content: string; ordered: boolean; idx?: number }[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <View key={`list-${blocks.length}`} style={{ gap: 6, marginVertical: 4 }}>
        {listItems.map((it, i) => (
          <View key={i} style={styles.li}>
            <Text
              style={{
                color: colors.primary,
                fontFamily: "Inter_600SemiBold",
                fontSize: size,
                width: 22,
              }}
            >
              {it.ordered ? `${it.idx}.` : "•"}
            </Text>
            <View style={{ flex: 1 }}>{renderInline(it.content, size, colors)}</View>
          </View>
        ))}
      </View>,
    );
    listItems = [];
  };

  for (let raw of lines) {
    const line = raw;
    if (/^\s*$/.test(line)) {
      flushList();
      blocks.push(<View key={`sp-${blocks.length}`} style={{ height: 6 }} />);
      continue;
    }
    const h3 = line.match(/^###\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1 || h2 || h3) {
      flushList();
      const content = (h1?.[1] ?? h2?.[1] ?? h3?.[1] ?? "").trim();
      const fs = h1 ? size + 6 : h2 ? size + 4 : size + 2;
      blocks.push(
        <Text
          key={`h-${blocks.length}`}
          style={{
            color: colors.foreground,
            fontFamily: "Inter_700Bold",
            fontSize: fs,
            marginTop: 8,
            marginBottom: 4,
            letterSpacing: -0.3,
          }}
        >
          {content}
        </Text>,
      );
      continue;
    }
    const num = line.match(/^\s*(\d+)\.\s+(.*)$/);
    const bul = line.match(/^\s*[-*]\s+(.*)$/);
    if (num) {
      listItems.push({
        content: num[2],
        ordered: true,
        idx: Number(num[1]),
      });
      continue;
    }
    if (bul) {
      listItems.push({ content: bul[1], ordered: false });
      continue;
    }
    flushList();
    blocks.push(
      <View key={`p-${blocks.length}`} style={{ marginVertical: 2 }}>
        {renderInline(line, size, colors)}
      </View>,
    );
  }
  flushList();
  return <View>{blocks}</View>;
}

function renderInline(
  text: string,
  size: number,
  colors: ReturnType<typeof useColors>,
): React.ReactNode {
  // Split by inline markers, preserving them
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <Text
      style={{
        color: colors.foreground,
        fontFamily: "Inter_400Regular",
        fontSize: size,
        lineHeight: size * 1.45,
      }}
    >
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) {
          return (
            <Text
              key={i}
              style={{
                fontFamily: "Inter_700Bold",
                color: colors.foreground,
              }}
            >
              {p.slice(2, -2)}
            </Text>
          );
        }
        if (/^\*[^*]+\*$/.test(p)) {
          return (
            <Text
              key={i}
              style={{
                fontStyle: "italic",
                color: colors.foreground,
              }}
            >
              {p.slice(1, -1)}
            </Text>
          );
        }
        if (/^`[^`]+`$/.test(p)) {
          return (
            <Text
              key={i}
              style={{
                fontFamily: "Inter_500Medium",
                backgroundColor: colors.secondary,
                color: colors.secondaryForeground,
                fontSize: size - 1,
              }}
            >
              {" " + p.slice(1, -1) + " "}
            </Text>
          );
        }
        return (
          <Text key={i} style={{ color: colors.foreground }}>
            {p}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  li: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
});
