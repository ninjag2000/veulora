import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmationModal } from "@/components/confirmation-modal";
import { EmptyState } from "@/components/empty-state";
import { IconButton } from "@/components/icon-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useGenerationState } from "@/providers/app-provider";
import { deriveGenerationSnapshot } from "@/services/generation-service";
import { waitForMediaAssetReady } from "@/services/media-readiness-service";

type ProcessingCopy = {
  heroTitle: string;
  stageTitle: string;
  helperText: string;
};

const PROCESSING_ICON = require("../assets/processing-icon.png");
const LOGO_IDLE_OPACITY = 0.18;
const LOGO_FADE_OUT_OPACITY = 0.28;
const TEXT_IDLE_OPACITY = 0.08;
const TEXT_FADE_OUT_OPACITY = TEXT_IDLE_OPACITY;

type StageKey = "upload" | "prepare" | "render" | "finalize";

const PROCESSING_COPY = {
  upload: [
    {
      heroTitle: "Uploading",
      helperText: "Securing your source photo for a clean handoff.",
    },
    {
      heroTitle: "Syncing Assets",
      helperText: "Arranging the selected inputs before generation begins.",
    },
    {
      heroTitle: "Locking Input",
      helperText: "Saving your chosen frame so the render starts from the right source.",
    },
  ],
  prepare: [
    {
      heroTitle: "Preparing",
      helperText: "Warming up the model for this exact preset direction.",
    },
    {
      heroTitle: "Calibrating",
      helperText: "Aligning style, identity, and scene cues for a steadier result.",
    },
    {
      heroTitle: "Mapping Details",
      helperText: "Setting lighting, texture, and composition before the main pass.",
    },
  ],
  render: {
    image: [
      {
        heroTitle: "Styling",
        helperText: "Balancing light, texture, and facial detail for the final image.",
      },
      {
        heroTitle: "Composing",
        helperText: "Building the overall look from your chosen preset direction.",
      },
      {
        heroTitle: "Refining",
        helperText: "Bringing the image into sharper focus with cleaner small details.",
      },
      {
        heroTitle: "Polishing",
        helperText: "Smoothing the final visual pass before the reveal screen opens.",
      },
    ],
    video: [
      {
        heroTitle: "Animating",
        helperText: "Building smooth motion from the selected frame and prompt.",
      },
      {
        heroTitle: "Blending Motion",
        helperText: "Matching timing, movement, and scene continuity across the clip.",
      },
      {
        heroTitle: "Composing Motion",
        helperText: "Shaping a cleaner cinematic loop from the preset direction.",
      },
      {
        heroTitle: "Refining Frames",
        helperText: "Cleaning transitions before the final export is assembled.",
      },
    ],
  },
  finalize: [
    {
      heroTitle: "Finalizing",
      helperText: "Polishing the output and packaging the result for viewing.",
    },
    {
      heroTitle: "Cleaning Up",
      helperText: "Finishing edges, color, and the small corrections around the frame.",
    },
    {
      heroTitle: "Wrapping Up",
      helperText: "Getting everything ready for the result screen.",
    },
  ],
} as const;

function getStageKey(currentStage: string): StageKey {
  const normalized = currentStage.toLowerCase();

  if (normalized.includes("upload")) {
    return "upload";
  }

  if (normalized.includes("prepar")) {
    return "prepare";
  }

  if (normalized.includes("final")) {
    return "finalize";
  }

  return "render";
}

function getStageTitle(stageKey: StageKey, mode: "image" | "video") {
  if (stageKey === "upload") {
    return "Uploading assets";
  }

  if (stageKey === "prepare") {
    return "Preparing model";
  }

  if (stageKey === "finalize") {
    return "Finalizing result";
  }

  return mode === "video" ? "Rendering video" : "Creating image";
}

function getDynamicStatus(mode: "image" | "video", currentStage: string, tick: number): ProcessingCopy {
  const stageKey = getStageKey(currentStage);
  const stagedCopy =
    stageKey === "render" ? PROCESSING_COPY.render[mode] : PROCESSING_COPY[stageKey];

  const currentCopy = stagedCopy[tick % stagedCopy.length];

  return {
    heroTitle: currentCopy.heroTitle,
    stageTitle: getStageTitle(stageKey, mode),
    helperText: currentCopy.helperText,
  };
}

function getStageCopies(mode: "image" | "video", currentStage: string): ProcessingCopy[] {
  const stageKey = getStageKey(currentStage);
  const stageTitle = getStageTitle(stageKey, mode);
  const stagedCopy =
    stageKey === "render" ? PROCESSING_COPY.render[mode] : PROCESSING_COPY[stageKey];

  return stagedCopy.map((copy) => ({
    heroTitle: copy.heroTitle,
    stageTitle,
    helperText: copy.helperText,
  }));
}

export function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string; source?: string }>();
  const { history, isJobReady, jobs, retryGeneration } = useGenerationState();
  const [cycleIndex, setCycleIndex] = useState(0);
  const [displayedHelperText, setDisplayedHelperText] = useState("");
  const [logoWidth, setLogoWidth] = useState(0);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [isDeliveringResult, setIsDeliveringResult] = useState(false);
  const [isResultAssetReady, setIsResultAssetReady] = useState(false);
  const logoOpacity = useRef(new Animated.Value(LOGO_IDLE_OPACITY)).current;
  const textOpacity = useRef(new Animated.Value(TEXT_IDLE_OPACITY)).current;
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  const shimmerOpacity = useRef(new Animated.Value(0)).current;
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const openingFromHistory = params.source === "history";
  const historyItem = history.find((item) => item.jobId === params.jobId);
  const job = jobs.find((item) => item.id === params.jobId);
  const snapshot = job ? deriveGenerationSnapshot(job) : null;
  const mode = openingFromHistory
    ? historyItem?.type ?? job?.mode ?? "image"
    : job?.mode ?? "image";
  const previewAsset = openingFromHistory
    ? historyItem?.previewUrl ?? historyItem?.outputUrls[0]
    : job?.previewAsset;
  const primaryResultAsset = openingFromHistory
    ? historyItem?.outputUrls[0] ?? historyItem?.previewUrl
    : job?.outputs[0] ?? job?.previewAsset;
  const generationCompleted = openingFromHistory
    ? historyItem?.status === "completed"
    : snapshot?.status === "completed" || isJobReady(params.jobId);
  const currentStageKey = getStageKey(snapshot?.currentStage ?? "Preparing");
  const stageCopies = useMemo(
    () => (snapshot ? getStageCopies(mode, snapshot.currentStage) : []),
    [mode, snapshot?.currentStage]
  );
  const shouldAnimateCycles =
    !openingFromHistory &&
    !generationCompleted &&
    !isDeliveringResult &&
    !!snapshot &&
    snapshot.status !== "failed" &&
    stageCopies.length > 0;
  const topPadding = Math.max(insets.top + 8, theme.spacing.l);
  const bottomPadding = Math.max(insets.bottom + 12, theme.spacing.m);
  const previewHeight = Math.max(150, Math.min(230, screenHeight * 0.27));

  const transitionToResult = useCallback(() => {
    router.replace(
      openingFromHistory
        ? `/result/${params.jobId}?source=history&delivered=1`
        : `/result/${params.jobId}`
    );
  }, [openingFromHistory, params.jobId, router]);

  useEffect(() => {
    if (!shouldAnimateCycles || !snapshot) {
      return;
    }

    let cancelled = false;
    let nextCycleTimer: ReturnType<typeof setTimeout> | null = null;
    let phraseIndex = 0;

    const runCycle = () => {
      if (cancelled) {
        return;
      }

      const nextIndex = phraseIndex % stageCopies.length;
      const nextCopy = stageCopies[nextIndex];

      setCycleIndex(nextIndex);
      setDisplayedHelperText(nextCopy.helperText);
      logoOpacity.setValue(LOGO_IDLE_OPACITY);
      textOpacity.setValue(TEXT_IDLE_OPACITY);
      shimmerProgress.setValue(0);
      shimmerOpacity.setValue(0.94);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 1680,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 1680,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerProgress, {
            toValue: 1,
            duration: 1520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(shimmerOpacity, {
          toValue: 0,
          duration: 280,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: LOGO_FADE_OUT_OPACITY,
            duration: 920,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: TEXT_FADE_OUT_OPACITY,
            duration: 840,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1500),
      ]).start(({ finished }) => {
        if (!finished || cancelled) {
          return;
        }

        phraseIndex += 1;
        nextCycleTimer = setTimeout(runCycle, 0);
      });
    };

    runCycle();

    return () => {
      cancelled = true;
      if (nextCycleTimer) {
        clearTimeout(nextCycleTimer);
      }
      logoOpacity.stopAnimation();
      textOpacity.stopAnimation();
      shimmerProgress.stopAnimation();
      shimmerOpacity.stopAnimation();
    };
  }, [
    currentStageKey,
    generationCompleted,
    isDeliveringResult,
    logoOpacity,
    mode,
    openingFromHistory,
    shimmerOpacity,
    shimmerProgress,
    shouldAnimateCycles,
    stageCopies,
    snapshot?.status,
    textOpacity,
  ]);

  useEffect(() => {
    if (!generationCompleted) {
      setIsDeliveringResult(false);
      setIsResultAssetReady(false);
      return;
    }

    if (isResultAssetReady) {
      return;
    }

    setIsDeliveringResult(true);

    if (!primaryResultAsset) {
      return;
    }

    const controller = new AbortController();

    void waitForMediaAssetReady({
      mode,
      source: primaryResultAsset,
      signal: controller.signal,
    }).then((ready) => {
      if (ready) {
        setIsResultAssetReady(true);
      }
    });

    return () => {
      controller.abort();
    };
  }, [
    generationCompleted,
    isResultAssetReady,
    mode,
    params.jobId,
    primaryResultAsset,
  ]);

  useEffect(() => {
    if (isResultAssetReady) {
      transitionToResult();
    }
  }, [isResultAssetReady, transitionToResult]);

  useEffect(() => {
    if (shouldAnimateCycles) {
      return;
    }

    logoOpacity.setValue(1);
    textOpacity.setValue(1);
    shimmerOpacity.setValue(0);
    shimmerProgress.setValue(0);
  }, [logoOpacity, shimmerOpacity, shimmerProgress, shouldAnimateCycles, textOpacity]);

  if (openingFromHistory && !historyItem) {
    return (
      <Screen>
        <EmptyState
          title="Result not found"
          description="This generated result is no longer available in History."
          actionLabel="Back to history"
          onActionPress={() => router.replace("/history")}
        />
      </Screen>
    );
  }

  if (!openingFromHistory && (!job || !snapshot)) {
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

  if (!openingFromHistory && snapshot?.status === "failed" && job) {
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

  const dynamicStatus =
    openingFromHistory || !snapshot
      ? null
      : getDynamicStatus(mode, snapshot.currentStage, cycleIndex);
  const currentStatus =
    openingFromHistory
      ? {
          heroTitle: "Delivering",
          stageTitle: "Preparing result",
          helperText:
            mode === "video"
              ? "We found the saved generation and are waiting for the first playable frame before reopening the result."
              : "We found the saved generation and are waiting for the final image file to become fully visible before reopening the result.",
        }
      : isDeliveringResult && !isResultAssetReady
      ? {
          heroTitle: "Delivering",
          stageTitle: "Preparing result",
          helperText: primaryResultAsset
            ? mode === "video"
              ? "The clip is rendered. We are waiting for the first playable frame before opening the result."
              : "The image is rendered. We are waiting for the final file to become fully visible before opening the result."
            : "The generation is complete. We are waiting for the final asset package to arrive.",
        }
      : (dynamicStatus as ProcessingCopy);
  const helperText =
    shouldAnimateCycles && displayedHelperText
      ? displayedHelperText
      : currentStatus.helperText;
  const shimmerTravel = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [logoWidth ? -logoWidth * 0.24 : -28, logoWidth ? logoWidth * 1.02 : 122],
  });

  return (
    <>
      <ConfirmationModal
        visible={leaveModalVisible && !openingFromHistory}
        title="Leave this screen?"
        description="Generation will continue in the background."
        confirmLabel="Go to History"
        cancelLabel="Stay"
        onConfirm={() => {
          setLeaveModalVisible(false);
          router.replace("/history");
        }}
        onCancel={() => setLeaveModalVisible(false)}
      />

      <Screen
        scrollable={false}
        contentContainerStyle={{
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          gap: 12,
        }}
      >
        <View style={{ minHeight: 68, justifyContent: "center", gap: 4 }}>
          <View style={{ position: "absolute", left: 0, zIndex: 1 }}>
            <IconButton
              symbol="chevron.left"
              accessibilityLabel="Go back"
              onPress={() =>
                openingFromHistory
                  ? router.replace("/history")
                  : setLeaveModalVisible(true)
              }
            />
          </View>
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.title,
              fontWeight: "800",
              textAlign: "center",
              paddingHorizontal: 70,
            }}
          >
            {currentStatus.heroTitle}
          </Text>
          <Text
            selectable
            numberOfLines={1}
            style={{
              color: theme.colors.text.muted,
              fontSize: theme.typography.caption,
              textAlign: "center",
              letterSpacing: 0.4,
              paddingHorizontal: 82,
            }}
          >
            {currentStatus.stageTitle}
          </Text>
          <View style={{ position: "absolute", right: 0, zIndex: 1 }}>
            <IconButton
              symbol="gearshape.fill"
              accessibilityLabel="Open settings"
              onPress={() => router.push("/settings")}
            />
          </View>
        </View>

        <View
          style={{
            height: previewHeight,
            borderRadius: theme.radii.xl,
            overflow: "hidden",
            backgroundColor: theme.colors.bg.surface,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <Image
            source={resolveImageSource(previewAsset ?? primaryResultAsset ?? "")}
            contentFit="cover"
            style={{ width: "100%", height: "100%", opacity: 0.56 }}
          />
        </View>

        <View
          style={{
            alignItems: "center",
            gap: theme.spacing.l,
            marginTop: theme.spacing.m,
            paddingHorizontal: theme.spacing.l,
          }}
        >
          <Animated.View
            onLayout={(event) => {
              setLogoWidth(event.nativeEvent.layout.width);
            }}
            style={{
              width: 112,
              height: 112,
              opacity: logoOpacity,
              alignSelf: "center",
              marginBottom: theme.spacing.xs,
            }}
          >
            <Image
              source={PROCESSING_ICON}
              contentFit="contain"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
            <MaskedView
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              maskElement={
                <Image
                  source={PROCESSING_ICON}
                  contentFit="contain"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              }
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                }}
              >
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: -6,
                    bottom: -6,
                    width: logoWidth ? Math.max(20, logoWidth * 0.14) : 20,
                    opacity: shimmerOpacity,
                    transform: [{ translateX: shimmerTravel }],
                  }}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0)",
                      "rgba(255, 250, 244, 0.12)",
                      "rgba(255, 246, 236, 0.56)",
                      "rgba(255, 250, 244, 0.12)",
                      "rgba(255, 255, 255, 0)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{
                      flex: 1,
                      transform: [{ skewX: "-14deg" }],
                    }}
                  />
                </Animated.View>
              </View>
            </MaskedView>
          </Animated.View>

          <Animated.Text
            selectable
            style={{
              color: theme.colors.text.editorial,
              fontSize: 18,
              lineHeight: 28,
              textAlign: "center",
              maxWidth: 340,
              alignSelf: "center",
              opacity: textOpacity,
            }}
          >
            {helperText}
          </Animated.Text>
        </View>

        <View style={{ marginTop: "auto" }}>
          <PrimaryButton
            label={openingFromHistory ? "Back to History" : "Go to History"}
            secondary
            onPress={() => router.replace("/history")}
          />
        </View>
      </Screen>
    </>
  );
}
