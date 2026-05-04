import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoSourceSheet } from "@/components/photo-source-sheet";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import {
  EffectRow,
  PresetGeneratorHeader,
  PromptInput,
  RequiredImageDropzone,
  ResolutionSelector,
} from "@/components/upload-first-controls";
import { findTemplateByIdWithContentLabFallback } from "@/lib/catalog";
import { formatCredits } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { VideoResolution } from "@/lib/types";
import { useAppState } from "@/providers/app-provider";
import {
  prepareReferenceImage,
  ReferenceImageError,
} from "@/services/reference-image-service";

interface VideoGeneratorScreenProps {
  presetIdOverride?: string;
}

export function VideoGeneratorScreen({
  presetIdOverride,
}: VideoGeneratorScreenProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const {
    catalog,
    createGeneration,
    entitlements,
    pushToast,
  } = useAppState();
  const requestedPresetId = presetIdOverride ?? params.presetId;
  const preset = catalog
    ? findTemplateByIdWithContentLabFallback(
        catalog,
        requestedPresetId,
        "video"
      ) ?? null
    : null;
  const [prompt, setPrompt] = useState(preset?.defaultPrompt ?? "");
  const [referenceImageUri, setReferenceImageUri] = useState<string | undefined>();
  const [referenceImageError, setReferenceImageError] = useState<string | undefined>();
  const [resolution, setResolution] = useState<VideoResolution>("720p");
  const [loading, setLoading] = useState(false);
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!entitlements.isPro && resolution !== "720p") {
      setResolution("720p");
    }
  }, [entitlements.isPro, resolution]);

  useEffect(() => {
    if (preset) {
      setPrompt(preset.defaultPrompt);
    }
  }, [preset?.id]);

  if (!preset || !catalog) {
    return null;
  }

  const isVideoContentLab = preset.id === "content-lab-video";
  const topPadding = Math.max(insets.top + 8, theme.spacing.l);
  const bottomPadding = Math.max(insets.bottom + 12, theme.spacing.m);
  const promptMinHeight = isVideoContentLab ? 196 : undefined;
  const uploadHeight = Math.max(
    isVideoContentLab ? 124 : 184,
    Math.min(
      isVideoContentLab ? 148 : 286,
      screenHeight -
        topPadding -
        bottomPadding -
        52 -
        76 -
        58 -
        (isVideoContentLab ? 118 : 48)
    )
  );

  const pickImage = async (source: "camera" | "library") => {
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: "images",
            quality: 1,
          });

    if (!result.canceled) {
      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      try {
        setReferenceImageError(undefined);
        const prepared = await prepareReferenceImage(asset, {
          minSide: entitlements.isPro ? 360 : 720,
          referenceMode: preset.referenceMode,
        });
        setReferenceImageUri(prepared.uri);
      } catch (error) {
        const message =
          error instanceof ReferenceImageError
            ? error.message
            : "Could not prepare this image.";
        setReferenceImageUri(undefined);
        setReferenceImageError(message);
        pushToast(message);
      }
    }
  };

  const handlePick = () => {
    setSourceSheetVisible(true);
  };

  const handlePickSource = (source: "camera" | "library") => {
    setSourceSheetVisible(false);
    void pickImage(source);
  };

  const handleGenerate = async () => {
    if (!isVideoContentLab && !referenceImageUri) {
      pushToast(referenceImageError ?? "Add an image to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await createGeneration({
        templateId: preset.id,
        prompt,
        referenceImageUri,
        resolution: entitlements.isPro ? resolution : "720p",
      });

      if (result.kind === "error") {
        pushToast(result.message);
        return;
      }

      if (result.kind === "paywall") {
        const returnTo =
          preset.id === "content-lab-video"
            ? "/video-content-lab"
            : `/video-generator/${preset.id}`;
        router.push(
          `/paywall?mode=soft&source=${result.source}&returnTo=${encodeURIComponent(returnTo)}`
        );
        return;
      }

      router.push(`/processing/${result.jobId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PhotoSourceSheet
        visible={sourceSheetVisible}
        title="Choose photo"
        subtitle="Upload a clear front-facing portrait from your camera or photo library."
        showCamera
        onCamera={() => handlePickSource("camera")}
        onLibrary={() => handlePickSource("library")}
        onClose={() => setSourceSheetVisible(false)}
      />

      <Screen
        scrollable={false}
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          gap: 12,
        }}
      >
        <PresetGeneratorHeader title={preset.title} onBack={() => router.back()} />

        <RequiredImageDropzone
          imageUri={referenceImageUri}
          onPress={handlePick}
          errorText={referenceImageError}
          title={isVideoContentLab ? "Add Reference Image" : "Add Your Image"}
          placeholderText={isVideoContentLab ? "Optional" : "Required"}
          height={uploadHeight}
        />

        <View
          style={{
            gap: 12,
            padding: theme.spacing.m,
            borderRadius: theme.radii.xl,
            backgroundColor: theme.colors.bg.glass,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            boxShadow: theme.shadows.soft,
          }}
        >
          {isVideoContentLab ? (
            <PromptInput
              value={prompt}
              onChangeText={setPrompt}
              compact
              minHeight={promptMinHeight}
            />
          ) : (
            <EffectRow template={preset} compact />
          )}

          <ResolutionSelector
            value={entitlements.isPro ? resolution : "720p"}
            onChange={setResolution}
            compact
            premiumLocked={!entitlements.isPro}
            economyResolution="720p"
            options={entitlements.isPro ? undefined : ["720p", "1080p"]}
            onPremiumPress={() =>
              router.push(
                `/paywall?mode=soft&source=video_generation&returnTo=${encodeURIComponent(
                  preset.id === "content-lab-video"
                    ? "/video-content-lab"
                    : `/video-generator/${preset.id}`
                )}`
              )
            }
          />
        </View>

        <View style={{ marginTop: "auto" }}>
          <PrimaryButton
            label={loading ? "Generating..." : `Generate for ${formatCredits(preset.generationCost)}`}
            loading={loading}
            onPress={handleGenerate}
          />
        </View>
      </Screen>
    </>
  );
}
