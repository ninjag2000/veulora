import { useRouter } from "expo-router";
import { startTransition, useDeferredValue, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { HistoryCard } from "@/components/history-card";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import type { HistoryFilter } from "@/lib/types";
import {
  useEntitlementsState,
  useGenerationState,
} from "@/providers/app-provider";

export function HistoryScreen() {
  const router = useRouter();
  const { historyFeed } = useGenerationState();
  const { entitlements } = useEntitlementsState();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const deferredFilter = useDeferredValue(filter);
  const insets = useSafeAreaInsets();

  const filteredHistory = historyFeed.filter((item) => {
    if (deferredFilter === "all") {
      return true;
    }
    return item.type === deferredFilter;
  });

  return (
    <Screen
      contentContainerStyle={{
        paddingTop: theme.spacing.xxl,
        paddingBottom: Math.max(220, insets.bottom + 176),
      }}
    >
      <TopBar
        title="History"
        colorfulProBadge={entitlements.isPro}
        credits={entitlements.currentCredits}
        onPressPro={() =>
          router.push(
            entitlements.isPro
              ? "/subscription"
              : "/paywall?mode=soft&source=credit_limit"
          )
        }
        onPressSettings={() => router.push("/settings")}
      />

      <View style={{ flexDirection: "row", gap: theme.spacing.s }}>
        {([
          { id: "all", label: "All" },
          { id: "image", label: "Images" },
          { id: "video", label: "Videos" },
        ] as const).map((item) => {
          const selected = item.id === filter;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => startTransition(() => setFilter(item.id))}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: theme.radii.pill,
                backgroundColor: selected
                  ? "rgba(200, 107, 255, 0.18)"
                  : theme.colors.bg.surface,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontWeight: "700",
                  fontSize: theme.typography.caption,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filteredHistory.length === 0 ? (
        <EmptyState
          title={
            filter === "all"
              ? "Your generation history is empty"
              : filter === "image"
              ? "No images yet"
              : "No videos yet"
          }
          description="Create your first AI result and it will show up here automatically."
          actionLabel="Explore presets"
          onActionPress={() => router.replace("/image")}
        />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {filteredHistory.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onPress={() =>
                router.push(
                  item.status === "processing"
                    ? `/processing/${item.jobId}`
                    : `/processing/${item.jobId}?source=history`
                )
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
