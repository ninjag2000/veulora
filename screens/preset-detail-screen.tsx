import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { findTemplateById } from "@/lib/catalog";
import { isRestrictedPresetId } from "@/lib/catalog-safety";
import { useAppState } from "@/providers/app-provider";

export function PresetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const { catalog, pushToast } = useAppState();
  const isRestricted = isRestrictedPresetId(params.presetId);
  const preset = catalog ? findTemplateById(catalog, params.presetId) : null;

  useEffect(() => {
    if (!isRestricted) {
      return;
    }

    pushToast("This preset is no longer available.");
    router.replace("/image");
  }, [isRestricted, pushToast, router]);

  useEffect(() => {
    if (!preset || isRestricted) {
      return;
    }

    router.replace(
      preset.modeType === "video"
        ? `/video-generator/${preset.id}`
        : `/generator/${preset.id}`
    );
  }, [isRestricted, preset, router]);

  if (!catalog || preset || isRestricted) {
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
