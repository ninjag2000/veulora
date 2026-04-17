import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { GuidelinesModal } from "@/components/guidelines-modal";
import { PromptComposer, ReferenceImageCard } from "@/components/generator-controls";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { findTemplateById } from "@/lib/catalog";
import { formatCredits } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

export function VideoGeneratorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const {
    catalog,
    createGeneration,
    entitlements,
    markVideoGuidelinesSeen,
    pushToast,
    settings,
  } = useAppState();
  const preset = catalog ? findTemplateById(catalog, params.presetId) : null;
  const [referenceImageUri, setReferenceImageUri] = useState<string | undefined>();
  const [prompt, setPrompt] = useState(preset?.defaultPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(!settings.videoGuidelinesSeen);

  if (!preset || !catalog) {
    return null;
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 1,
    });

    if (!result.canceled) {
      setReferenceImageUri(result.assets[0]?.uri);
    }
  };

  const handlePick = () => {
    Alert.alert("Choose photo", "Upload a clear front-facing portrait.", [
      { text: "Choose photo", onPress: () => void pickImage() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleGenerate = async () => {
    if (!referenceImageUri) {
      pushToast("Choose a person photo first.");
      return;
    }

    setLoading(true);
    try {
      const result = await createGeneration({
        templateId: preset.id,
        prompt,
        referenceImageUri,
      });

      if (result.kind === "error") {
        pushToast(result.message);
        return;
      }

      if (result.kind === "paywall") {
        router.push(`/paywall?mode=soft&source=${result.source}`);
        return;
      }

      router.push(`/processing/${result.jobId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GuidelinesModal
        visible={showGuidelines}
        content={catalog.photoGuidelines}
        onContinue={() => {
          setShowGuidelines(false);
          markVideoGuidelinesSeen();
        }}
      />

      <Screen
        footer={
          <PrimaryButton
            label={loading ? "Generating..." : `Generate for ${formatCredits(preset.generationCost)}`}
            loading={loading}
            onPress={handleGenerate}
          />
        }
      >
        <TopBar
          showBack
          onBack={() => router.back()}
          showBrand={false}
          title={preset.title}
          credits={entitlements.currentCredits}
          onPressPro={() => router.push("/paywall?mode=soft&source=video_generation")}
          onPressSettings={() => router.push("/settings")}
        />

        <View
          style={{
            height: 260,
            borderRadius: theme.radii.xl,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            backgroundColor: theme.colors.bg.surface,
          }}
        >
          <Image source={preset.coverUrl} contentFit="cover" style={{ width: "100%", height: "100%" }} />
        </View>

        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body,
            lineHeight: 22,
          }}
        >
          Upload a clear photo of one person. We will animate it with the {preset.motionPreset} motion preset.
        </Text>

        <PromptComposer
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Add optional motion guidance."
        />

        <ReferenceImageCard
          title="Person photo"
          hint="Use a bright, front-facing photo with one visible face."
          imageUri={referenceImageUri}
          onPick={handlePick}
          onDelete={() => setReferenceImageUri(undefined)}
        />
      </Screen>
    </>
  );
}
