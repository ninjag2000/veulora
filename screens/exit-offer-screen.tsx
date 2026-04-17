import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { formatTimer } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

export function ExitOfferScreen() {
  const router = useRouter();
  const { catalog, purchasePlan, pushToast, restorePurchases } = useAppState();
  const [remainingMs, setRemainingMs] = useState(catalog?.exitOffer.durationMs ?? 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    track("exit_offer_view");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingMs((current) => Math.max(0, current - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!catalog) {
    return null;
  }

  const offer = catalog.exitOffer;

  const dismiss = () => {
    track("exit_offer_dismiss_tap", { offer_id: offer.id });
    router.replace("/image");
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      track("exit_offer_continue_tap", {
        offer_id: offer.id,
        time_remaining_seconds: Math.floor(remainingMs / 1000),
      });
      await purchasePlan(offer.planId);
      router.replace("/image");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Unable to start purchase flow."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      footer={
        <View style={{ gap: theme.spacing.m }}>
          <PrimaryButton
            label={loading ? "Starting purchase..." : "Continue"}
            loading={loading}
            disabled={remainingMs <= 0}
            onPress={handleContinue}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: theme.spacing.m,
            }}
          >
            <Text
              selectable
              onPress={async () => {
                try {
                  await restorePurchases();
                  router.replace("/image");
                } catch (error) {
                  pushToast(
                    error instanceof Error
                      ? error.message
                      : "Unable to restore purchases."
                  );
                }
              }}
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.micro,
                fontWeight: "600",
              }}
            >
              Restore
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.micro,
              }}
            >
              Privacy Policy
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.micro,
              }}
            >
              Terms of Use
            </Text>
          </View>
        </View>
      }
    >
      <View style={{ alignItems: "flex-end" }}>
        <Pressable accessibilityRole="button" onPress={dismiss}>
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontWeight: "700",
              fontSize: theme.typography.caption,
            }}
          >
            Close
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xxl,
          gap: theme.spacing.l,
          alignItems: "center",
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: 52,
            fontWeight: "900",
          }}
        >
          -{offer.discountPercent}%
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.section,
            fontWeight: "800",
          }}
        >
          {offer.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.s }}>
          <Text
            selectable
            style={{
              color: theme.colors.text.muted,
              textDecorationLine: "line-through",
              fontSize: theme.typography.body,
            }}
          >
            {offer.oldPrice}
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.title,
              fontWeight: "800",
            }}
          >
            {offer.newPrice}
          </Text>
        </View>
      </View>

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xl,
          gap: theme.spacing.s,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            textAlign: "center",
          }}
        >
          Promotion active
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            textAlign: "center",
            fontSize: theme.typography.title,
            fontWeight: "800",
            fontVariant: ["tabular-nums"],
          }}
        >
          {formatTimer(remainingMs)}
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            textAlign: "center",
            fontSize: theme.typography.caption,
          }}
        >
          Cancel anytime
        </Text>
      </View>
    </Screen>
  );
}
