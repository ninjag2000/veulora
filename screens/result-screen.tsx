import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { PrimaryButton } from "@/components/primary-button";
import { ImageResultViewer, VideoResultViewer } from "@/components/result-viewer";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { formatDate, getCurrentOutput } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";
import { saveAssetToLibraryAsync, shareAssetAsync } from "@/services/asset-service";

export function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string }>();
  const { deleteHistoryItem, history, pushToast, retryGeneration } = useAppState();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [busyAction, setBusyAction] = useState<"save" | "share" | "retry" | null>(null);

  const item = history.find((entry) => entry.jobId === params.jobId);

  useEffect(() => {
    if (item?.status === "processing") {
      router.replace(`/processing/${item.jobId}`);
    }
  }, [item?.jobId, item?.status, router]);

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

  const currentAsset = getCurrentOutput(item, selectedIndex);

  const handleSave = async () => {
    setBusyAction("save");
    try {
      await saveAssetToLibraryAsync(currentAsset);
      pushToast(item.type === "video" ? "Video saved." : "Image saved.");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Unable to save the file.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    setBusyAction("share");
    try {
      await shareAssetAsync(currentAsset);
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
    <Screen>
      <TopBar
        showBack
        onBack={() => router.back()}
        showBrand={false}
        title="Result"
        onPressSettings={() => router.push("/settings")}
      />

      {item.type === "image" ? (
        <ImageResultViewer
          outputs={item.outputUrls}
          selectedIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
        />
      ) : (
        <VideoResultViewer source={currentAsset} />
      )}

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xl,
          gap: theme.spacing.s,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.section,
            fontWeight: "800",
          }}
        >
          {item.presetTitle}
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption,
            lineHeight: 18,
          }}
        >
          {item.promptSnippet}
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.micro,
          }}
        >
          {formatDate(item.createdAt)} · {item.type.toUpperCase()}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.s }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={busyAction === "save" ? "Saving..." : item.type === "video" ? "Save video" : "Save"}
            loading={busyAction === "save"}
            onPress={handleSave}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={busyAction === "share" ? "Sharing..." : "Share"}
            secondary
            loading={busyAction === "share"}
            onPress={handleShare}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.s }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={busyAction === "retry" ? "Preparing..." : "Try again"}
            secondary
            onPress={handleRetry}
            loading={busyAction === "retry"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Delete"
            secondary
            onPress={() => {
              deleteHistoryItem(item.id);
              router.replace("/history");
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
