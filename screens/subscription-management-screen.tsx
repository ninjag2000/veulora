import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Platform, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import { useEntitlementsState, useToastState } from "@/providers/app-provider";

function getManageSubscriptionUrl() {
  if (Platform.OS === "ios") {
    // Prefer deep link; fall back to https if it fails on some devices.
    return "itms-apps://apps.apple.com/account/subscriptions";
  }

  if (Platform.OS === "android") {
    return "https://play.google.com/store/account/subscriptions";
  }

  return "https://apps.apple.com/account/subscriptions";
}

export function SubscriptionManagementScreen() {
  const router = useRouter();
  const { entitlements, restorePurchases } = useEntitlementsState();
  const { pushToast } = useToastState();

  const manageLabel =
    Platform.OS === "ios"
      ? "Manage in App Store"
      : Platform.OS === "android"
      ? "Manage in Play Store"
      : "Manage subscription";

  return (
    <Screen>
      <TopBar
        showBack
        onBack={() => router.back()}
        showBrand={false}
        showProBadge={false}
        title="Subscription"
        onPressSettings={() => router.push("/settings")}
      />

      <View style={{ gap: theme.spacing.m }}>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body,
            lineHeight: 22,
          }}
        >
          {entitlements.isPro
            ? "StudioBloom Pro is active on this account."
            : "No active subscription is linked to this account."}
        </Text>

        <Text
          selectable
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.caption,
            lineHeight: 18,
          }}
        >
          Change, pause, or cancel your plan in the store where you subscribed.
        </Text>
      </View>

      <View style={{ gap: theme.spacing.s }}>
        <PrimaryButton
          label={manageLabel}
          onPress={async () => {
            try {
              await Linking.openURL(getManageSubscriptionUrl());
            } catch {
              // Fallback for iOS deep link failures.
              await Linking.openURL("https://apps.apple.com/account/subscriptions");
            }
          }}
        />

        <PrimaryButton
          label="Restore purchases"
          secondary
          compact
          onPress={async () => {
            try {
              await restorePurchases();
              pushToast("Purchases restored.");
            } catch (error) {
              pushToast(
                error instanceof Error
                  ? error.message
                  : "Unable to restore purchases."
              );
            }
          }}
        />

        {!entitlements.isPro ? (
          <PrimaryButton
            label="Upgrade"
            secondary
            compact
            onPress={() => router.push("/paywall?mode=soft&source=premium_feature")}
          />
        ) : null}
      </View>
    </Screen>
  );
}

