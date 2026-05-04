import type { ReactNode } from "react";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Mail,
  RefreshCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Share, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/lib/theme";
import {
  useCatalogState,
  useEntitlementsState,
  useToastState,
} from "@/providers/app-provider";

const appVersion = "1.0.0";
const appBackgroundImage = require("../assets/photo-generated/app-background-v4.png");

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    accountId,
  } = useCatalogState();
  const {
    entitlements,
    restorePurchases,
    setNotificationsEnabled,
    settings,
  } = useEntitlementsState();
  const { pushToast } = useToastState();

  const copyAccountId = async () => {
    await Clipboard.setStringAsync(accountId);
    pushToast("Copied");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg.app }}>
      <Image
        source={appBackgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        style={{ position: "absolute", inset: 0 }}
      />
      <LinearGradient
        colors={[
          "rgba(9, 7, 11, 0.82)",
          "rgba(12, 9, 14, 0.72)",
          "rgba(9, 7, 11, 0.90)",
        ]}
        style={{ position: "absolute", inset: 0 }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: theme.spacing.l,
          paddingBottom: Math.max(insets.bottom, 20) + 18,
          gap: theme.spacing.xl,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 48,
            gap: theme.spacing.s,
          }}
        >
          <HeaderIconButton
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            icon={
              <ChevronLeft
                size={21}
                strokeWidth={2.5}
                color={theme.colors.text.editorial}
              />
            }
          />

          <Text
            selectable
            style={{
              color: theme.colors.text.editorial,
              fontSize: 30,
              lineHeight: 34,
              fontWeight: "700",
              fontFamily: theme.fonts.editorial,
              letterSpacing: -0.4,
            }}
          >
            Settings
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open premium offer"
            onPress={() =>
              router.push(
                entitlements.isPro
                  ? "/subscription"
                  : "/paywall?mode=soft&source=premium_feature"
              )
            }
            style={({ pressed }) => ({
              borderRadius: theme.radii.pill,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                minHeight: 44,
                paddingHorizontal: 14,
                borderRadius: theme.radii.pill,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255, 240, 220, 0.28)",
              }}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", inset: 0 }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 1,
                  left: 10,
                  right: 10,
                  height: 18,
                  borderRadius: theme.radii.pill,
                  backgroundColor: "rgba(255, 249, 241, 0.22)",
                }}
              />
              <Sparkles size={16} strokeWidth={2.2} color={theme.colors.text.dark} />
              <Text
                selectable
                style={{
                  color: theme.colors.text.dark,
                  fontSize: theme.typography.caption,
                  fontWeight: "800",
                  letterSpacing: 0.4,
                }}
              >
                PRO
              </Text>
            </View>
          </Pressable>
        </View>

        <SettingsCard>
          <SettingsActionRow
            icon={
              <WalletCards
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label={entitlements.isPro ? "Manage subscription" : "Upgrade plan"}
            onPress={() =>
              router.push(
                entitlements.isPro
                  ? "/subscription"
                  : "/paywall?mode=soft&source=premium_feature"
              )
            }
          />
          <SettingsActionRow
            icon={
              <RefreshCcw
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Restore purchases"
            showDivider
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
        </SettingsCard>

        <SettingsCard>
          <SettingsToggleRow
            icon={
              <Bell
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Notifications"
            value={settings.notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <SettingsActionRow
            icon={
              <Star
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Rate our app"
            showDivider
            onPress={() => Linking.openURL("https://example.com/app-store")}
          />
          <SettingsActionRow
            icon={
              <Share2
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Share with friends"
            showDivider
            onPress={() =>
              Share.share({
                message: "Check out Veloura AI for premium AI images and videos.",
              })
            }
          />
        </SettingsCard>

        <SettingsCard>
          <SettingsActionRow
            icon={
              <Mail
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Support"
            onPress={() => Linking.openURL("https://hollybit.app/support")}
          />
          <SettingsActionRow
            icon={
              <FileText
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Terms of use"
            showDivider
            onPress={() => Linking.openURL("https://hollybit.app/terms")}
          />
          <SettingsActionRow
            icon={
              <ShieldCheck
                size={22}
                strokeWidth={2}
                color={theme.colors.text.editorial}
              />
            }
            label="Privacy Policy"
            onPress={() => Linking.openURL("https://hollybit.app/privacy")}
          />
        </SettingsCard>

        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingTop: theme.spacing.s,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
            }}
          >
            Account ID:
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              maxWidth: "100%",
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.text.muted,
                fontSize: theme.typography.caption,
                textAlign: "center",
                flexShrink: 1,
              }}
            >
              {accountId}
            </Text>

            <HeaderIconButton
              accessibilityLabel="Copy account ID"
              onPress={() => {
                void copyAccountId();
              }}
              size={34}
              icon={<Copy size={16} strokeWidth={2.1} color={theme.colors.text.secondary} />}
            />
          </View>

          <Text
            selectable
            style={{
              color: theme.colors.text.muted,
              fontSize: theme.typography.caption,
            }}
          >
            App version: {appVersion}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function HeaderIconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 46,
}: {
  icon: ReactNode;
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        backgroundColor: pressed
          ? theme.colors.bg.glassStrong
          : theme.colors.bg.glass,
      })}
    >
      {icon}
    </Pressable>
  );
}

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        borderRadius: 28,
        backgroundColor: theme.colors.bg.glass,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        overflow: "hidden",
        paddingHorizontal: theme.spacing.l,
        boxShadow: theme.shadows.soft,
      }}
    >
      {children}
    </View>
  );
}

function SettingsActionRow({
  icon,
  label,
  onPress,
  showDivider = false,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 58,
        paddingVertical: 14,
        opacity: pressed ? 0.88 : 1,
        borderTopWidth: showDivider ? 1 : 0,
        borderTopColor: theme.colors.border.subtle,
      })}
    >
      <View style={{ width: 28, alignItems: "center" }}>{icon}</View>
      <Text
        selectable
        style={{
          flex: 1,
          color: theme.colors.text.editorial,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      <ChevronRight size={20} strokeWidth={2.2} color={theme.colors.text.muted} />
    </Pressable>
  );
}

function SettingsToggleRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: ReactNode;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 58,
        paddingVertical: 14,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ width: 28, alignItems: "center" }}>{icon}</View>
      <Text
        selectable
        style={{
          flex: 1,
          color: theme.colors.text.editorial,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      <View style={{ transform: [{ scaleX: 1.03 }, { scaleY: 1.03 }] }}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: theme.colors.bg.glassStrong,
            true: "rgba(241, 209, 171, 0.55)",
          }}
          thumbColor={theme.colors.text.editorial}
          ios_backgroundColor={theme.colors.bg.glassStrong}
        />
      </View>
    </Pressable>
  );
}
