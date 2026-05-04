import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { findTemplateById } from "@/lib/catalog";
import { useAppState } from "@/providers/app-provider";

export function PresetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const { catalog } = useAppState();
  const preset = catalog ? findTemplateById(catalog, params.presetId) : null;

  useEffect(() => {
    if (!preset) {
      return;
    }

    router.replace(
      preset.modeType === "video"
        ? `/video-generator/${preset.id}`
        : `/generator/${preset.id}`
    );
  }, [preset, router]);

  if (!catalog || preset) {
    return null;
  }

  return (
    <Screen>
      <EmptyState
        title="Preset not found"
        description="This collection item is no longer available."
        actionLabel="Back to home"
        onActionPress={() => router.replace("/image")}
      />
    </Screen>
  );
}
