import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Animated, Pressable, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandLogo } from "@/components/brand-logo";
import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

const CARD_HEIGHT = 220;
const CARD_WIDTH = 156;
const CARD_GAP = 18;

function buildBackgroundAssets(paywallAssets: string[], fallbackAssets: string[]) {
  const source = paywallAssets.length ? paywallAssets : fallbackAssets;
  const uniqueAssets = source.filter(
    (asset, index) => source.indexOf(asset) === index
  );

  return uniqueAssets.length ? uniqueAssets : fallbackAssets;
}

function splitColumns(assets: string[]) {
  const left = assets.filter((_, index) => index % 2 === 0);
  const right = assets.filter((_, index) => index % 2 !== 0);

  return {
    left: left.length ? [...left, ...left] : assets,
    right: right.length ? [...right, ...right] : [...assets, ...assets],
  };
}

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const leftTrack = useRef(new Animated.Value(0)).current;
  const rightTrack = useRef(new Animated.Value(0)).current;
  const { catalog, completeOnboarding } = useAppState();

  const slides = catalog?.onboardingSlides ?? [];
  const fallbackAssets = slides.flatMap((slide) =>
    slide.insetAsset ? [slide.heroAsset, slide.insetAsset] : [slide.heroAsset]
  );
  const backgroundAssets = buildBackgroundAssets(
    catalog?.paywallHeroAssets ?? [],
    fallbackAssets
  );
  const { left: leftColumnAssets, right: rightColumnAssets } =
    splitColumns(backgroundAssets);

  useEffect(() => {
    track("onboarding_view");
    track("onboarding_slide_view", {
      slide_id: "single-page",
      slide_index: 1,
    });
  }, []);

  useEffect(() => {
    const leftAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(leftTrack, {
          toValue: 1,
          duration: 16000,
          useNativeDriver: true,
        }),
        Animated.timing(leftTrack, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    const rightAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rightTrack, {
          toValue: 1,
          duration: 18000,
          useNativeDriver: true,
        }),
        Animated.timing(rightTrack, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    leftAnimation.start();
    rightAnimation.start();

    return () => {
      leftAnimation.stop();
      rightAnimation.stop();
    };
  }, [leftTrack, rightTrack]);

  const finish = () => {
    completeOnboarding();
    track("onboarding_complete");
    router.replace("/paywall?mode=hard&source=onboarding");
  };

  const handleContinue = () => {
    track("onboarding_continue_tap", {
      slide_id: "single-page",
      slide_index: 1,
    });
    finish();
  };

  const handleSkip = () => {
    track("onboarding_skip_tap", { slide_index: 1 });
    finish();
  };

  const highlights = [
    "Try yourself in different looks and styles",
    "Change outfit, scene, and mood in one tap",
    "Turn photos into realistic AI videos",
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.black }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            left: -28,
            top: insets.top + 84,
            transform: [
              {
                translateY: leftTrack.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -1 * (CARD_HEIGHT + CARD_GAP)],
                }),
              },
              { rotate: "-7deg" },
            ],
          }}
        >
          {leftColumnAssets.map((asset, index) => (
            <View
              key={`left_${asset}_${index}`}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 34,
                overflow: "hidden",
                marginBottom: CARD_GAP,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: theme.colors.bg.card,
              }}
            >
              <Image
                source={asset}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ))}
        </Animated.View>

        <Animated.View
          style={{
            position: "absolute",
            right: -26,
            top: insets.top + 36,
            transform: [
              {
                translateY: rightTrack.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-1 * (CARD_HEIGHT + CARD_GAP), 0],
                }),
              },
              { rotate: "6deg" },
            ],
          }}
        >
          {rightColumnAssets.map((asset, index) => (
            <View
              key={`right_${asset}_${index}`}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                borderRadius: 34,
                overflow: "hidden",
                marginBottom: CARD_GAP,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: theme.colors.bg.card,
              }}
            >
              <Image
                source={asset}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ))}
        </Animated.View>

        <LinearGradient
          colors={["rgba(11,7,17,0.92)", "rgba(11,7,17,0.45)", "rgba(11,7,17,0.88)"]}
          style={{ position: "absolute", inset: 0 }}
        />
        <LinearGradient
          colors={["rgba(11,7,17,0.00)", "rgba(11,7,17,0.78)", "#0B0711"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "54%",
          }}
        />
      </View>

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + theme.spacing.l,
          paddingHorizontal: theme.spacing.l,
          paddingBottom: insets.bottom + theme.spacing.l,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <BrandLogo />
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
            gap: theme.spacing.l,
            padding: theme.spacing.xl,
            borderRadius: 30,
            backgroundColor: "rgba(13, 9, 20, 0.78)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View style={{ gap: theme.spacing.s }}>
            <Text
              selectable
              style={{
                color: theme.colors.accent.end,
                fontSize: theme.typography.caption,
                fontWeight: "700",
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              AI photo and video studio
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: 36,
                fontWeight: "800",
                lineHeight: 40,
              }}
            >
              Create premium looks in seconds
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.body,
                lineHeight: 22,
              }}
            >
              Generate portraits, transformations, and motion clips from one
              photo or a simple prompt.
            </Text>
          </View>

          <View style={{ gap: theme.spacing.s }}>
            {highlights.map((item) => (
              <View
                key={item}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: theme.spacing.s,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    marginTop: 7,
                    borderRadius: 999,
                    backgroundColor: theme.colors.accent.end,
                  }}
                />
                <Text
                  selectable
                  style={{
                    flex: 1,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.body,
                    lineHeight: 22,
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <PrimaryButton label="Continue" onPress={handleContinue} />
        </View>
      </View>
    </View>
  );
}
