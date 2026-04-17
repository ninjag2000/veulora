import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";
import { deriveGenerationSnapshot } from "@/services/generation-service";

const stages = [
  "Uploading assets",
  "Preparing model",
  "Creating your image",
  "Rendering your video",
  "Finalizing",
];

export function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string }>();
  const { jobs, retryGeneration } = useAppState();
  const [tick, setTick] = useState(0);

  const job = jobs.find((item) => item.id === params.jobId);
  const snapshot = job ? deriveGenerationSnapshot(job) : null;

  const transitionToResult = useCallback(() => {
    router.replace(`/result/${params.jobId}`);
  }, [params.jobId, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (snapshot?.status === "completed") {
      transitionToResult();
    }
  }, [snapshot?.status, transitionToResult]);

  if (!job || !snapshot) {
    return (
      <Screen>
        <EmptyState
          title="Generation not found"
          description="This job is no longer available."
          actionLabel="Back to history"
          onActionPress={() => router.replace("/history")}
        />
      </Screen>
    );
  }

  if (snapshot.status === "failed") {
    return (
      <Screen>
        <TopBar
          showBack
          onBack={() => router.replace("/history")}
          showBrand={false}
          title="Generation failed"
          onPressSettings={() => router.push("/settings")}
        />
        <EmptyState
          title="Something went wrong"
          description={snapshot.errorMessage ?? "The generation did not complete."}
          actionLabel="Try again"
          onActionPress={async () => {
            const result = await retryGeneration(job.id);
            if (result.kind === "success") {
              router.replace(`/processing/${result.jobId}`);
            }
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label="Go to History"
          secondary
          onPress={() => router.replace("/history")}
        />
      }
    >
      <TopBar
        showBack
        onBack={() =>
          Alert.alert("Leave this screen?", "Generation will continue in the background.", [
            { text: "Stay", style: "cancel" },
            { text: "Go to History", onPress: () => router.replace("/history") },
          ])
        }
        showBrand={false}
        title="Creating..."
        onPressSettings={() => router.push("/settings")}
      />

      <View
        style={{
          height: 320,
          borderRadius: theme.radii.xl,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Image
          source={job.previewAsset}
          contentFit="cover"
          style={{ width: "100%", height: "100%", opacity: 0.56 }}
        />
      </View>

      <View
        style={{
          gap: theme.spacing.m,
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xl,
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
          {snapshot.currentStage}
        </Text>

        <View
          style={{
            height: 8,
            borderRadius: theme.radii.pill,
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${snapshot.progressPercent}%`,
              height: "100%",
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.accent.start,
            }}
          />
        </View>

        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body,
            lineHeight: 22,
          }}
        >
          {snapshot.helperText}
        </Text>

        <View style={{ gap: 10 }}>
          {stages.map((stage) => {
            const active =
              snapshot.currentStage === stage ||
              (stage === "Creating your image" &&
                snapshot.currentStage === "Rendering your video");
            return (
              <Text
                key={`${stage}_${tick}`}
                selectable
                style={{
                  color: active ? theme.colors.text.primary : theme.colors.text.muted,
                  fontSize: theme.typography.caption,
                }}
              >
                {stage}
              </Text>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
