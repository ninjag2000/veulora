import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PaywallCarousel } from "@/components/paywall-carousel";
import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";
import type { PaywallMode, PaywallSource } from "@/lib/types";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

export function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: PaywallMode; source?: PaywallSource }>();
  const { catalog, purchasePlan, pushToast, restorePurchases } = useAppState();
  const [selectedPlan, setSelectedPlan] = useState(
    catalog?.subscriptionPlans.find((plan) => plan.isDefault)?.id ?? "yearly"
  );
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const mode = params.mode ?? "soft";
  const source = params.source ?? "premium_feature";

  if (!catalog) {
    return null;
  }

  const handleClose = () => {
    track("paywall_close_tap", { source_context: source, paywall_variant: mode });

    if (mode === "hard") {
      router.replace("/exit-offer");
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/image");
  };

  const handleContinue = async () => {
    setPurchaseLoading(true);
    try {
      track("paywall_continue_tap", {
        source_context: source,
        selected_plan: selectedPlan,
      });
      await purchasePlan(selectedPlan);
      router.replace("/image");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Unable to start purchase flow."
      );
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoreLoading(true);
    try {
      await restorePurchases();
      router.replace("/image");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Unable to restore purchases."
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.black }}>
      <PaywallCarousel assets={catalog.paywallHeroAssets} />

      <LinearGradient
        colors={[
          "rgba(7, 6, 10, 0.82)",
          "rgba(7, 6, 10, 0.20)",
          "rgba(7, 6, 10, 0.05)",
        ]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "34%",
        }}
      />
      <LinearGradient
        colors={[
          "rgba(7, 6, 10, 0.08)",
          "rgba(7, 6, 10, 0.72)",
          "rgba(7, 6, 10, 0.96)",
        ]}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 10,
          paddingHorizontal: theme.spacing.l,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
        }}
      >
        <View style={{ alignItems: "flex-end" }}>
          <Pressable accessibilityRole="button" onPress={handleClose}>
            <View
              style={{
                minWidth: 42,
                minHeight: 42,
                borderRadius: theme.radii.pill,
                paddingHorizontal: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontWeight: "700",
                  fontSize: theme.typography.caption,
                }}
              >
                Close
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View
            style={{
              borderRadius: 30,
              paddingHorizontal: theme.spacing.l,
              paddingTop: theme.spacing.xl,
              paddingBottom: theme.spacing.l,
              backgroundColor: "rgba(10, 8, 15, 0.72)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              gap: 14,
            }}
          >
            <View style={{ gap: 8 }}>
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontSize: 29,
                  lineHeight: 33,
                  fontWeight: "900",
                  letterSpacing: -0.6,
                }}
              >
                Unlock premium AI looks
              </Text>
              <Text
                selectable
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption,
                  lineHeight: 18,
                }}
              >
                {catalog.paywallBenefits.join("  |  ")}
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {catalog.subscriptionPlans.map((plan) => {
                const selected = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSelectedPlan(plan.id);
                      track("paywall_plan_selected", { selected_plan: plan.id });
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 22,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        backgroundColor: selected
                          ? "rgba(255, 143, 216, 0.18)"
                          : "rgba(255,255,255,0.06)",
                        borderWidth: 1,
                        borderColor: selected
                          ? "rgba(255, 143, 216, 0.50)"
                          : "rgba(255,255,255,0.10)",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            flex: 1,
                          }}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: selected
                                ? theme.colors.accent.end
                                : "rgba(255,255,255,0.24)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selected ? (
                              <View
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 10,
                                  backgroundColor: theme.colors.accent.end,
                                }}
                              />
                            ) : null}
                          </View>

                          <View style={{ gap: 2, flex: 1 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <Text
                                selectable
                                style={{
                                  color: theme.colors.text.primary,
                                  fontSize: 19,
                                  fontWeight: "800",
                                }}
                              >
                                {plan.title}
                              </Text>
                              {plan.badgeText ? (
                                <View
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: theme.radii.pill,
                                    backgroundColor: "rgba(255, 143, 216, 0.16)",
                                  }}
                                >
                                  <Text
                                    selectable
                                    style={{
                                      color: theme.colors.text.primary,
                                      fontSize: theme.typography.micro,
                                      fontWeight: "700",
                                    }}
                                  >
                                    {plan.badgeText}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <Text
                              selectable
                              style={{
                                color: theme.colors.text.secondary,
                                fontSize: theme.typography.caption,
                              }}
                            >
                              {plan.allowance}
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                          <Text
                            selectable
                            style={{
                              color: theme.colors.text.primary,
                              fontSize: 20,
                              fontWeight: "900",
                            }}
                          >
                            {plan.priceText}
                          </Text>
                          <Text
                            selectable
                            style={{
                              color: theme.colors.text.secondary,
                              fontSize: theme.typography.micro,
                            }}
                          >
                            {plan.period}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

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

            <PrimaryButton
              label={purchaseLoading ? "Starting purchase..." : "Continue"}
              loading={purchaseLoading}
              onPress={handleContinue}
            />

            <LegalRow onRestore={handleRestore} restoreLoading={restoreLoading} />

            {mode === "hard" ? (
              <Text
                selectable
                style={{
                  color: theme.colors.text.muted,
                  textAlign: "center",
                  fontSize: theme.typography.micro,
                  lineHeight: 16,
                }}
              >
                Premium presets, more credits, and faster image and video generation.
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function LegalRow({
  onRestore,
  restoreLoading,
}: {
  onRestore: () => void;
  restoreLoading: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: theme.spacing.s,
      }}
    >
      <LegalLink label={restoreLoading ? "Restoring..." : "Restore"} onPress={onRestore} />
      <LegalLink
        label="Privacy Policy"
        onPress={() => Linking.openURL("https://example.com/privacy")}
      />
      <LegalLink
        label="Terms of Use"
        onPress={() => Linking.openURL("https://example.com/terms")}
      />
    </View>
  );
}

function LegalLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.micro,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
