import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CircleAlert } from "lucide-react-native";

import { PhotoSourceSheet } from "@/components/photo-source-sheet";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { EmptyState } from "@/components/empty-state";
import {
  CompactRatioSelector,
  EffectRow,
  PresetGeneratorHeader,
  PromptInput,
  RequiredImageDropzone,
} from "@/components/upload-first-controls";
import { findTemplateByIdWithContentLabFallback } from "@/lib/catalog";
import { formatCredits } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { RatioOption } from "@/lib/types";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";
import {
  prepareReferenceImage,
  ReferenceImageError,
} from "@/services/reference-image-service";

interface PhotoGeneratorScreenProps {
  presetIdOverride?: string;
}

export function PhotoGeneratorScreen({
  presetIdOverride,
}: PhotoGeneratorScreenProps = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const { catalog, createGeneration, pushToast } = useAppState();
  const requestedPresetId = presetIdOverride ?? params.presetId;
  const preset = catalog
    ? findTemplateByIdWithContentLabFallback(catalog, requestedPresetId) ?? null
    : null;
  const [ratio, setRatio] = useState<RatioOption>("3:4");
  const [prompt, setPrompt] = useState(preset?.defaultPrompt ?? "");
  const [referenceImageUri, setReferenceImageUri] = useState<string | undefined>();
  const [referenceImageError, setReferenceImageError] = useState<string | undefined>();
  const [backendUnavailableMessage, setBackendUnavailableMessage] = useState<
    string | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (preset) {
      setPrompt(preset.defaultPrompt);
      setBackendUnavailableMessage(undefined);
    }
  }, [preset?.id]);

  if (!catalog) {
    return (
      <Screen>
        <EmptyState
          title="Loading preset"
          description="Please wait while we prepare your generator."
        />
      </Screen>
    );
  }

  if (!preset) {
    return (
      <Screen>
        <EmptyState
          title="Preset not found"
          description="This generator preset is currently unavailable."
          actionLabel="Back to image"
          onActionPress={() => router.replace("/image")}
        />
      </Screen>
    );
  }

  const supportsTextToImage = preset.id === "content-lab";
  const topPadding = Math.max(insets.top + 8, theme.spacing.l);
  const bottomPadding = Math.max(insets.bottom + 12, theme.spacing.m);
  const promptMinHeight = supportsTextToImage ? 196 : undefined;
  const uploadHeight = Math.max(
    supportsTextToImage ? 124 : 184,
    Math.min(
      supportsTextToImage ? 148 : 286,
      screenHeight -
        topPadding -
        bottomPadding -
        52 -
        76 -
        58 -
        (supportsTextToImage ? 118 : 48)
    )
  );

  const pickImage = async (source: "camera" | "library") => {
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 1 });

    if (!result.canceled) {
      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      try {
        setBackendUnavailableMessage(undefined);
        setReferenceImageError(undefined);
        const prepared = await prepareReferenceImage(asset, {
          referenceMode: preset.referenceMode,
        });
        setReferenceImageUri(prepared.uri);
        track("reference_upload_success", { preset_id: preset.id });
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
    if (!supportsTextToImage && !referenceImageUri) {
      pushToast(referenceImageError ?? "Add an image to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await createGeneration({
        templateId: preset.id,
        prompt,
        referenceImageUri,
        ratio,
        outputCount:
          preset.kind === "photoPack" ? preset.photoPackSize ?? 8 : undefined,
      });

      if (result.kind === "error") {
        if (result.temporaryBackendUnavailable) {
          setBackendUnavailableMessage(result.message);
        } else {
          pushToast(result.message);
        }
        return;
      }

      if (result.kind === "paywall") {
        const returnTo =
          preset.id === "content-lab" ? "/content-lab" : `/generator/${preset.id}`;
        router.push(
          `/paywall?mode=soft&source=${result.source}&returnTo=${encodeURIComponent(returnTo)}`
        );
        return;
      }

      track("generate_tap", {
        preset_id: preset.id,
        selected_ratio: ratio,
        has_reference_image: Boolean(referenceImageUri),
      });
      setBackendUnavailableMessage(undefined);
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
        subtitle="Add a reference from your camera or photo library."
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
          title={supportsTextToImage ? "Add Reference Image" : "Add Your Image"}
          placeholderText={supportsTextToImage ? "Optional" : "Required"}
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
          {supportsTextToImage ? (
            <PromptInput
              value={prompt}
              onChangeText={(value) => {
                setPrompt(value);
                setBackendUnavailableMessage(undefined);
              }}
              compact
              minHeight={promptMinHeight}
            />
          ) : null}

          {!supportsTextToImage ? <EffectRow template={preset} compact /> : null}

          <CompactRatioSelector
            value={ratio}
            onChange={(value) => {
              setRatio(value);
              setBackendUnavailableMessage(undefined);
            }}
          />
        </View>

        <View style={{ marginTop: "auto", gap: 12 }}>
          {backendUnavailableMessage ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: theme.spacing.m,
                paddingVertical: theme.spacing.m,
                borderRadius: theme.radii.xl,
                backgroundColor: "rgba(20, 14, 18, 0.96)",
                borderWidth: 1,
                borderColor: "rgba(238, 155, 151, 0.24)",
                boxShadow: theme.shadows.soft,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: theme.radii.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(238, 155, 151, 0.12)",
                }}
              >
                <CircleAlert size={18} color={theme.colors.feedback.error} />
              </View>
              <Text
                style={{
                  flex: 1,
                  color: theme.colors.text.primary,
                  fontSize: 14,
                  lineHeight: 21,
                  fontWeight: "500",
                }}
              >
                {backendUnavailableMessage}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            label={loading ? "Generating..." : `Generate for ${formatCredits(preset.generationCost)}`}
            onPress={handleGenerate}
            loading={loading}
          />
        </View>
      </Screen>
    </>
  );
}
