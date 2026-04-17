import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BrandLogo } from "@/components/brand-logo";
import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

export function LaunchScreen() {
  const router = useRouter();
  const {
    accountId,
    bootstrapError,
    bootstrapStatus,
    onboardingCompleted,
    pushToast,
    retryBootstrap,
  } = useAppState();
  const [progress, setProgress] = useState(0.04);
  const progressRef = useRef(progress);
  const hasNavigatedRef = useRef(false);

  const finishNavigation = useCallback(() => {
    track("splash_loaded");
    router.replace(onboardingCompleted ? "/image" : "/onboarding");
  }, [onboardingCompleted, router]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    track("splash_view");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (bootstrapStatus === "ready" && progressRef.current >= 1) {
        clearInterval(timer);
        return;
      }

      setProgress((current) => {
        if (bootstrapStatus === "ready") {
          return Math.min(1, current + 0.08);
        }

        if (bootstrapStatus === "error") {
          return current;
        }

        if (current < 0.35) {
          return current + 0.03;
        }
        if (current < 0.65) {
          return current + 0.015;
        }
        if (current < 0.9) {
          return current + 0.006;
        }
        return current;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [bootstrapStatus]);

  useEffect(() => {
    if (
      bootstrapStatus === "ready" &&
      progress >= 1 &&
      !hasNavigatedRef.current
    ) {
      hasNavigatedRef.current = true;
      finishNavigation();
    }
  }, [bootstrapStatus, finishNavigation, progress]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(accountId);
    pushToast("Copied");
    track("account_id_copied");
  };

  const statusText =
    bootstrapStatus === "error"
      ? "Something went wrong while loading"
      : progress < 0.5
      ? "Loading content..."
      : progress < 0.82
      ? "Preparing your experience..."
      : "Syncing assets...";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.black,
        paddingHorizontal: theme.spacing.xxl,
        paddingTop: 110,
        paddingBottom: 44,
        justifyContent: "space-between",
      }}
    >
      <View />

      <View style={{ gap: theme.spacing.xxl }}>
        <View style={{ alignItems: "center" }}>
          <BrandLogo large />
        </View>

        <View style={{ gap: theme.spacing.s }}>
          <View
            accessibilityLabel="Loading"
            style={{
              height: 8,
              borderRadius: theme.radii.pill,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.max(progress, 0.04) * 100}%`,
                height: "100%",
                backgroundColor: theme.colors.accent.start,
                borderRadius: theme.radii.pill,
              }}
            />
          </View>

          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              textAlign: "center",
              fontSize: theme.typography.caption,
            }}
          >
            {statusText}
          </Text>

          {bootstrapError ? (
            <View style={{ marginTop: theme.spacing.l }}>
              <PrimaryButton label="Try again" onPress={retryBootstrap} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ gap: theme.spacing.l }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy account ID"
          onPress={handleCopy}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.spacing.s,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
            }}
          >
            Account ID {accountId}
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.text.primary,
              fontWeight: "700",
              fontSize: theme.typography.caption,
            }}
          >
            Copy
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
