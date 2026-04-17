import type { ReactNode } from "react";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Share, Switch, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

const appVersion = "1.0.0";

export function SettingsScreen() {
  const router = useRouter();
  const {
    accountId,
    entitlements,
    pushToast,
    restorePurchases,
    setNotificationsEnabled,
    settings,
  } = useAppState();

  const copyAccountId = async () => {
    await Clipboard.setStringAsync(accountId);
    pushToast("Copied");
  };

  return (
    <Screen>
      <TopBar
        showBack
        onBack={() => router.back()}
        showBrand={false}
        title="Settings"
        credits={entitlements.currentCredits}
        onPressPro={() => router.push("/paywall?mode=soft&source=premium_feature")}
      />

      <SettingsSection title="Subscription">
        <SettingsActionRow
          label={entitlements.isPro ? "Manage subscription" : "Upgrade plan"}
          onPress={() => router.push("/paywall?mode=soft&source=premium_feature")}
        />
        <SettingsActionRow
          label="Restore purchases"
          onPress={async () => {
            try {
              await restorePurchases();
            } catch (error) {
              pushToast(
                error instanceof Error
                  ? error.message
                  : "Unable to restore purchases."
              );
            }
          }}
        />
      </SettingsSection>

      <SettingsSection title="App">
        <SettingsToggleRow
          label="Notifications"
          value={settings.notificationsEnabled}
          onValueChange={setNotificationsEnabled}
        />
        <SettingsActionRow
          label="Rate our app"
          onPress={() => Linking.openURL("https://example.com/app-store")}
        />
        <SettingsActionRow
          label="Share with friends"
          onPress={() =>
            Share.share({
              message: "Check out Veloura AI for premium AI images and videos.",
            })
          }
        />
      </SettingsSection>

      <SettingsSection title="Support & legal">
        <SettingsActionRow
          label="Support"
          onPress={() => Linking.openURL("mailto:support@veloura.ai")}
        />
        <SettingsActionRow
          label="Terms of use"
          onPress={() => Linking.openURL("https://example.com/terms")}
        />
        <SettingsActionRow
          label="Privacy policy"
          onPress={() => Linking.openURL("https://example.com/privacy")}
        />
      </SettingsSection>

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xl,
          gap: theme.spacing.m,
        }}
      >
        <View style={{ gap: 6 }}>
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
            }}
          >
            Account ID
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.body,
              fontWeight: "700",
            }}
          >
            {accountId}
          </Text>
        </View>
        <PrimaryButton label="Copy account ID" secondary compact onPress={copyAccountId} />
        <Text
          selectable
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.micro,
          }}
        >
          App version {appVersion}
        </Text>
      </View>
    </Screen>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.bg.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: "hidden",
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption,
          fontWeight: "700",
          paddingHorizontal: theme.spacing.xl,
          paddingTop: theme.spacing.xl,
          paddingBottom: theme.spacing.s,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function SettingsActionRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Text
      selectable
      onPress={onPress}
      style={{
        color: theme.colors.text.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.l,
        fontSize: theme.typography.body,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.subtle,
      }}
    >
      {label}
    </Text>
  );
}

function SettingsToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.l,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.subtle,
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.primary,
          fontSize: theme.typography.body,
        }}
      >
        {label}
      </Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
