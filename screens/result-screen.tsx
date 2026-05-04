import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { IconButton } from "@/components/icon-button";
import { PrimaryButton } from "@/components/primary-button";
import { ImageResultViewer, VideoResultViewer } from "@/components/result-viewer";
import { Screen } from "@/components/screen";
import { formatDate, getCurrentOutput } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import {
  useGenerationState,
  useToastState,
} from "@/providers/app-provider";
import {
  saveAssetToLibraryAsync,
  saveAssetsToLibraryAsync,
  shareAssetAsync,
} from "@/services/asset-service";
import {
  buildCompletedHistoryItem,
  buildFailedHistoryItem,
  buildProcessingHistoryItem,
  deriveGenerationSnapshot,
} from "@/services/generation-service";
import { isMediaSourceImmediatelyAvailable } from "@/services/media-readiness-service";

export function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    jobId: string;
    source?: string;
    delivered?: string;
  }>();
  const { deleteHistoryItem, history, jobs, retryGeneration } =
    useGenerationState();
  const { pushToast } = useToastState();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCurrentAssetReady, setIsCurrentAssetReady] = useState(false);
  const [busyAction, setBusyAction] = useState<"save" | "share" | "retry" | null>(null);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const historyItem = history.find((entry) => entry.jobId === params.jobId);
  const job = jobs.find((entry) => entry.id === params.jobId);
  const snapshot = job ? deriveGenerationSnapshot(job) : null;
  const primaryResultAsset =
    historyItem?.outputUrls[0] ??
    historyItem?.previewUrl ??
    job?.outputs[0] ??
    job?.previewAsset;
  const shouldRedirectToHistoryDelivery = Boolean(
    historyItem?.status === "completed" &&
      primaryResultAsset &&
      !isMediaSourceImmediatelyAvailable(primaryResultAsset) &&
      params.delivered !== "1" &&
      (params.source === "history" || !job)
  );
  const item =
    historyItem ??
    (job
      ? snapshot?.status === "completed"
        ? buildCompletedHistoryItem(job)
        : snapshot?.status === "failed"
        ? buildFailedHistoryItem(
            job,
            snapshot.errorMessage ?? "The output could not be loaded."
          )
        : buildProcessingHistoryItem(job)
      : undefined);
  const isCompactLayout = screenHeight <= 820;
  const topPadding = Math.max(insets.top + 6, isCompactLayout ? theme.spacing.m : theme.spacing.l);
  const bottomPadding = Math.max(insets.bottom + 10, isCompactLayout ? theme.spacing.s : theme.spacing.m);

  useEffect(() => {
    if (shouldRedirectToHistoryDelivery) {
      router.replace(`/processing/${params.jobId}?source=history`);
      return;
    }

    if (item?.status === "processing") {
      router.replace(`/processing/${item.jobId}`);
    }
  }, [
    item?.jobId,
    item?.status,
    params.jobId,
    router,
    shouldRedirectToHistoryDelivery,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
    setIsCurrentAssetReady(false);
  }, [item?.id]);

  useEffect(() => {
    setIsCurrentAssetReady(false);
  }, [item?.id, selectedIndex]);

  if (!item) {
    return (
      <Screen>
        <EmptyState
          title="Result not found"
          description="This generated result is no longer available."
          actionLabel="Back to history"
          onActionPress={() => router.replace("/history")}
        />
      </Screen>
    );
  }

  if (item.status === "processing") {
    return null;
  }

  if (shouldRedirectToHistoryDelivery) {
    return null;
  }

  if (item.status === "failed") {
    return (
      <Screen>
        <EmptyState
          title="Generation failed"
          description={item.errorMessage ?? "The output could not be loaded."}
          actionLabel="Try again"
          onActionPress={async () => {
            const result = await retryGeneration(item.jobId);
            if (result.kind === "success") {
              router.replace(`/processing/${result.jobId}`);
            }
          }}
        />
      </Screen>
    );
  }

  const contentGap = isCompactLayout ? 8 : 12;
  const hasImagePagination = item.type === "image" && item.outputUrls.length > 1;
  const reservedHeight =
    topPadding +
    bottomPadding +
    (isCompactLayout ? 56 : 64) +
    (isCompactLayout ? 96 : 106) +
    (isCompactLayout ? 104 : 116) +
    (hasImagePagination ? 24 : 0) +
    contentGap * 3 +
    (isCompactLayout ? 8 : 12);
  const mediaHeight = Math.max(
    isCompactLayout ? 196 : 248,
    Math.min(430, screenHeight - reservedHeight),
  );

  const currentAsset = getCurrentOutput(item, selectedIndex);
  const currentAssetUrl = typeof currentAsset === "string" ? currentAsset : null;
  const isPhotoSession = item.type === "image" && item.outputUrls.length > 1;
  const savablePackUrls = isPhotoSession
    ? item.outputUrls.filter((output): output is string => typeof output === "string")
    : [];
  const hasSaveTarget = isPhotoSession
    ? savablePackUrls.length > 0
    : Boolean(currentAssetUrl);

  const handleSave = async () => {
    if (!hasSaveTarget) {
      pushToast("This local preview cannot be saved.");
      return;
    }

    setBusyAction("save");
    try {
      if (isPhotoSession) {
        const saved = await saveAssetsToLibraryAsync(savablePackUrls);
        pushToast(`${saved.length} images saved.`);
        return;
      }

      await saveAssetToLibraryAsync(currentAssetUrl!);
      pushToast(item.type === "video" ? "Video saved." : "Image saved.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to save the file.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    if (!currentAssetUrl) {
      pushToast("This local preview cannot be shared.");
      return;
    }

    setBusyAction("share");
    try {
      await shareAssetAsync(currentAssetUrl);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to share the file.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRetry = async () => {
    setBusyAction("retry");
    try {
      const result = await retryGeneration(item.jobId);
      if (result.kind === "success") {
        router.replace(`/processing/${result.jobId}`);
      }
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Screen
      scrollable={false}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
        gap: contentGap,
      }}
    >
      <View style={{ minHeight: isCompactLayout ? 56 : 64, justifyContent: "center", gap: isCompactLayout ? 6 : 8 }}>
        <View style={{ position: "absolute", left: 0, zIndex: 1 }}>
          <IconButton
            symbol="chevron.left"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          />
        </View>
        <Text
          selectable
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.micro,
            fontWeight: "700",
            textAlign: "center",
            letterSpacing: 1.6,
            textTransform: "uppercase",
            paddingHorizontal: 76,
          }}
        >
          Delivered asset
        </Text>
        <Text
          selectable
          numberOfLines={1}
          style={{
            color: theme.colors.text.editorial,
            fontSize: theme.typography.title,
            fontWeight: "700",
            fontFamily: theme.fonts.editorial,
            textAlign: "center",
            paddingHorizontal: 76,
          }}
        >
          Result
        </Text>
        <View style={{ position: "absolute", right: 0, zIndex: 1 }}>
          <IconButton
            symbol="gearshape.fill"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>

      {item.type === "image" ? (
        <ImageResultViewer
          outputs={item.outputUrls}
          selectedIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
          height={mediaHeight}
          onSelectedAssetReadyChange={setIsCurrentAssetReady}
        />
      ) : (
        <VideoResultViewer
          source={currentAssetUrl ?? ""}
          height={mediaHeight}
          onReadyChange={setIsCurrentAssetReady}
        />
      )}

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.glass,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          paddingHorizontal: isCompactLayout ? theme.spacing.m : theme.spacing.l,
          paddingVertical: isCompactLayout ? theme.spacing.s : theme.spacing.m,
          gap: 4,
          boxShadow: theme.shadows.soft,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.muted,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.3,
            textTransform: "uppercase",
          }}
        >
          Creative direction
        </Text>
        <Text
          selectable
          numberOfLines={1}
          style={{
            color: theme.colors.text.editorial,
            fontSize: 18,
            lineHeight: 24,
            fontWeight: "700",
            fontFamily: theme.fonts.editorial,
          }}
        >
          {item.presetTitle}
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: 14,
            lineHeight: 16,
          }}
        >
          {formatDate(item.createdAt)} · {item.type.toUpperCase()}
        </Text>
      </View>

      <View
        style={{
          marginTop: "auto",
          gap: isCompactLayout ? 6 : theme.spacing.s,
          padding: isCompactLayout ? 4 : 6,
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.glass,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <View style={{ flexDirection: "row", gap: isCompactLayout ? 6 : theme.spacing.s }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={
                busyAction === "save"
                  ? "Saving..."
                  : isPhotoSession
                  ? "Save all"
                  : item.type === "video"
                  ? "Save video"
                  : "Save"
              }
              loading={busyAction === "save"}
              disabled={!hasSaveTarget || (!isPhotoSession && !isCurrentAssetReady)}
              onPress={handleSave}
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={busyAction === "share" ? "Sharing..." : "Share"}
              secondary
              loading={busyAction === "share"}
              disabled={!currentAssetUrl || !isCurrentAssetReady}
              onPress={handleShare}
              compact
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: isCompactLayout ? 6 : theme.spacing.s }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={busyAction === "retry" ? "Preparing..." : "Try again"}
              secondary
              onPress={handleRetry}
              loading={busyAction === "retry"}
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Delete"
              secondary
              compact
              onPress={() => {
                deleteHistoryItem(item.id);
                router.replace("/history");
              }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
