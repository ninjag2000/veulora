import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { formatDate, resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { HistoryItem } from "@/lib/types";

export function HistoryCard({
  item,
  onPress,
}: {
  item: HistoryItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.type} result ${item.status}`}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        flexBasis: "48%",
      })}
    >
      <View
        style={{
          borderRadius: theme.radii.l,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <View style={{ height: 180, backgroundColor: theme.colors.bg.card }}>
          <Image
            source={resolveImageSource(item.previewUrl)}
            contentFit="cover"
            style={{
              width: "100%",
              height: "100%",
              opacity: item.status === "failed" ? 0.42 : item.status === "processing" ? 0.68 : 1,
            }}
          />
        </View>

        <View
          style={{
            padding: theme.spacing.m,
            minHeight: 146,
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: theme.radii.pill,
              backgroundColor:
                item.status === "completed"
                  ? "rgba(135, 216, 175, 0.12)"
                  : item.status === "failed"
                  ? "rgba(230, 130, 158, 0.16)"
                  : "rgba(255, 255, 255, 0.08)",
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.micro,
                fontWeight: "700",
                textTransform: "capitalize",
              }}
            >
              {item.status}
            </Text>
          </View>

          <View style={{ gap: 8, minHeight: 72 }}>
            <Text
              selectable
              numberOfLines={2}
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.body,
                fontWeight: "700",
                lineHeight: 30,
              }}
            >
              {item.presetTitle}
            </Text>
            <Text
              selectable
              numberOfLines={2}
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption,
                lineHeight: 18,
              }}
            >
              {item.status === "failed"
                ? item.errorMessage ?? "This generation did not complete."
                : item.promptSnippet}
            </Text>
          </View>

          <Text
            selectable
            style={{
              color: theme.colors.text.muted,
              fontSize: theme.typography.micro,
            }}
          >
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
