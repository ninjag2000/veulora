import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

import {
  PromptComposer,
  RatioSelector,
  ReferenceImageCard,
} from "@/components/generator-controls";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { findTemplateById } from "@/lib/catalog";
import { formatCredits } from "@/lib/helpers";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

export function PhotoGeneratorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const { catalog, createGeneration, entitlements, pushToast } = useAppState();
  const preset = catalog ? findTemplateById(catalog, params.presetId) : null;
  const [prompt, setPrompt] = useState(preset?.defaultPrompt ?? "");
  const [ratio, setRatio] = useState<"1:1" | "3:4" | "4:5" | "9:16">("3:4");
  const [referenceImageUri, setReferenceImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  if (!preset) {
    return null;
  }

  const pickImage = async (source: "camera" | "library") => {
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 1 });

    if (!result.canceled) {
      const asset = result.assets[0];
      setReferenceImageUri(asset.uri);
      track("reference_upload_success", { preset_id: preset.id });
    }
  };

  const handlePick = () => {
    Alert.alert("Choose source", "Select how you want to add your reference photo.", [
      { text: "Camera", onPress: () => void pickImage("camera") },
      { text: "Photo library", onPress: () => void pickImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleGenerate = async () => {
    if (!referenceImageUri) {
      pushToast("Add a reference photo first.");
      return;
    }

    setLoading(true);
    try {
      const result = await createGeneration({
        templateId: preset.id,
        prompt,
        referenceImageUri,
        ratio,
      });

      if (result.kind === "error") {
        pushToast(result.message);
        return;
      }

      if (result.kind === "paywall") {
        router.push(`/paywall?mode=soft&source=${result.source}`);
        return;
      }

      track("generate_tap", { preset_id: preset.id, selected_ratio: ratio });
      router.push(`/processing/${result.jobId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      footer={
        <PrimaryButton
          label={loading ? "Generating..." : `Generate for ${formatCredits(preset.generationCost)}`}
          onPress={handleGenerate}
          loading={loading}
        />
      }
    >
      <TopBar
        showBack
        onBack={() => router.back()}
        showBrand={false}
        title={preset.title}
        credits={entitlements.currentCredits}
        onPressPro={() => router.push("/paywall?mode=soft&source=premium_feature")}
        onPressSettings={() => router.push("/settings")}
      />

      <PromptComposer
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Describe the look you want to create."
      />

      <RatioSelector value={ratio} onChange={setRatio} />

      <ReferenceImageCard
        title="Reference photo"
        hint="Use a clear portrait with one visible face."
        imageUri={referenceImageUri}
        onPick={handlePick}
        onDelete={() => setReferenceImageUri(undefined)}
      />
    </Screen>
  );
}
