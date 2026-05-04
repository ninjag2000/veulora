import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/primary-button";
import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { OnboardingSlide } from "@/lib/types";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HORIZONTAL_PADDING = theme.spacing.l;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const CARD_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.5, 420), 560);

function OnboardingVisual({ slide }: { slide: OnboardingSlide }) {
  const insetSize = slide.theme === "fashion" ? 82 : 76;

  return (
    <View
      style={{
        width: CARD_WIDTH,
        alignSelf: "center",
        gap: slide.subtitle ? theme.spacing.s : 0,
      }}
    >
      <View
        style={{
          height: CARD_HEIGHT,
          borderRadius: theme.radii.xl,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.card,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          boxShadow: theme.shadows.hero,
        }}
      >
        <Image
          source={resolveImageSource(slide.heroAsset)}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
        />

        <LinearGradient
          colors={
            slide.theme === "motion"
              ? ["rgba(8,7,10,0.02)", "rgba(8,7,10,0.10)", "rgba(8,7,10,0.40)"]
              : ["rgba(8,7,10,0.00)", "rgba(8,7,10,0.08)", "rgba(8,7,10,0.24)"]
          }
          style={{ position: "absolute", inset: 0 }}
        />

        {slide.insetAsset ? (
          <View
            style={{
              position: "absolute",
              left: theme.spacing.m,
              bottom: slide.theme === "editorial" ? theme.spacing.m : theme.spacing.xl,
              width: insetSize,
              height: insetSize,
              borderRadius: theme.radii.pill,
              padding: 3,
              backgroundColor: "rgba(255, 192, 220, 0.82)",
              boxShadow: "0 14px 26px rgba(0, 0, 0, 0.28)",
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: theme.radii.pill,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.92)",
                backgroundColor: theme.colors.bg.surface,
              }}
            >
              <Image
                source={resolveImageSource(slide.insetAsset)}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </View>
        ) : null}
      </View>

      {slide.subtitle ? (
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: 12,
            lineHeight: 16,
            textAlign: "center",
            paddingHorizontal: theme.spacing.s,
          }}
        >
          {slide.subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function OnboardingPage({ slide }: { slide: OnboardingSlide }) {
  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        paddingHorizontal: HORIZONTAL_PADDING,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "100%",
          alignItems: "center",
          gap: theme.spacing.xl,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.accent.blush,
            fontSize: 31,
            lineHeight: 35,
            fontWeight: "700",
            textAlign: "center",
            maxWidth: 340,
          }}
        >
          {slide.title}
        </Text>

        <OnboardingVisual slide={slide} />
      </View>
    </View>
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const lastTrackedIndex = useRef(0);
  const { catalog, completeOnboarding } = useAppState();
  const slides = useMemo(() => catalog?.onboardingSlides ?? [], [catalog]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) {
      return;
    }

    track("onboarding_view");
    track("onboarding_slide_view", {
      slide_id: slides[0]?.id ?? "step-1",
      slide_index: 1,
    });
  }, [slides]);

  const finish = () => {
    completeOnboarding();
    track("onboarding_complete", {
      slide_id: slides[activeIndex]?.id ?? "unknown",
      slide_index: activeIndex + 1,
    });
    router.replace("/paywall?mode=hard&source=onboarding");
  };

  const handleSkip = () => {
    track("onboarding_skip_tap", {
      slide_id: slides[activeIndex]?.id ?? "unknown",
      slide_index: activeIndex + 1,
    });
    finish();
  };

  const handleContinue = () => {
    const currentSlide = slides[activeIndex];

    track("onboarding_continue_tap", {
      slide_id: currentSlide?.id ?? "unknown",
      slide_index: activeIndex + 1,
    });

    if (activeIndex >= slides.length - 1) {
      finish();
      return;
    }

    listRef.current?.scrollToIndex({
      index: activeIndex + 1,
      animated: true,
    });
    setActiveIndex((current) => Math.min(current + 1, slides.length - 1));
  };

  const trackSlideView = (nextIndex: number) => {
    if (nextIndex === lastTrackedIndex.current || !slides[nextIndex]) {
      return;
    }

    lastTrackedIndex.current = nextIndex;
    track("onboarding_slide_view", {
      slide_id: slides[nextIndex].id,
      slide_index: nextIndex + 1,
    });
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );

    if (Number.isNaN(nextIndex)) {
      return;
    }

    setActiveIndex(nextIndex);
    trackSlideView(nextIndex);
  };

  const dots = slides.length ? slides : new Array(4).fill(null);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.black }}>
      <LinearGradient
        colors={["#000000", "#09070B", "#000000"]}
        style={{ position: "absolute", inset: 0 }}
      />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + theme.spacing.l,
          paddingBottom: insets.bottom + theme.spacing.l,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: insets.top + theme.spacing.l,
            right: HORIZONTAL_PADDING,
            zIndex: 3,
          }}
        >
          <Pressable accessibilityRole="button" onPress={handleSkip}>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontWeight: "700",
                fontSize: theme.typography.caption,
              }}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingTop: theme.spacing.s,
            paddingBottom: theme.spacing.l,
          }}
        >
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <OnboardingPage slide={item} />}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={handleMomentumEnd}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        </View>

        <View
          style={{
            paddingHorizontal: HORIZONTAL_PADDING,
            gap: theme.spacing.l,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: theme.spacing.s,
            }}
          >
            {dots.map((slide, index) => {
              const isActive = index === activeIndex;

              return (
                <View
                  key={slide?.id ?? `dot_${index}`}
                  style={{
                    width: isActive ? 28 : 8,
                    height: 8,
                    borderRadius: theme.radii.pill,
                    backgroundColor: isActive
                      ? theme.colors.accent.blush
                      : "rgba(255,255,255,0.18)",
                  }}
                />
              );
            })}
          </View>

          <PrimaryButton label="Continue" onPress={handleContinue} />
        </View>
      </View>
    </View>
  );
}
