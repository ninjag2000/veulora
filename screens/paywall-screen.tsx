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

type PaywallReturnPath =
  | `/generator/${string}`
  | `/video-generator/${string}`
  | "/video-content-lab";

function isPaywallReturnPath(value: string | undefined): value is PaywallReturnPath {
  return Boolean(
    value &&
      (value.startsWith("/generator/") ||
        value.startsWith("/video-generator/") ||
        value === "/video-content-lab")
  );
}

export function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    mode?: PaywallMode;
    source?: PaywallSource;
    returnTo?: string;
  }>();
  const { catalog, entitlements, purchasePlan, pushToast, restorePurchases } =
    useAppState();
  const [selectedPlan, setSelectedPlan] = useState(
    catalog?.subscriptionPlans.find((plan) => plan.isDefault)?.id ?? "yearly"
  );
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const mode = params.mode ?? "soft";
  const source = params.source ?? "premium_feature";
  const returnTo = isPaywallReturnPath(params.returnTo)
    ? params.returnTo
    : undefined;

  if (!catalog) {
    return null;
  }

  const exitOffer = catalog.exitOffer;
  const hasActiveExitOfferSubscription =
    exitOffer.packageType === "MONTHLY" &&
    (entitlements.subscriptionPlan === exitOffer.id ||
      (exitOffer.planId
        ? entitlements.subscriptionPlan === exitOffer.planId
        : false));

  const navigateAfterPaywall = () => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    router.replace("/image");
  };

  const handleClose = () => {
    track("paywall_close_tap", { source_context: source, paywall_variant: mode });

    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    if (hasActiveExitOfferSubscription) {
      router.replace("/image");
      return;
    }

    router.dismissTo("/exit-offer");
  };

  const handleContinue = async () => {
    setPurchaseLoading(true);
    try {
      track("paywall_continue_tap", {
        source_context: source,
        selected_plan: selectedPlan,
      });
      await purchasePlan(selectedPlan);
      navigateAfterPaywall();
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
      navigateAfterPaywall();
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
          "rgba(6, 5, 8, 0.58)",
          "rgba(6, 5, 8, 0.22)",
          "rgba(6, 5, 8, 0.04)",
        ]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "38%",
        }}
      />
      <LinearGradient
        colors={[
          "rgba(8, 7, 10, 0.04)",
          "rgba(8, 7, 10, 0.46)",
          "rgba(8, 7, 10, 0.78)",
        ]}
        style={{
          position: "absolute",
          inset: 0,
        }}
      />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 12,
          paddingHorizontal: theme.spacing.l,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
        }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View
            style={{
              borderRadius: theme.radii.xl,
              paddingHorizontal: theme.spacing.xl,
              paddingTop: theme.spacing.xxl,
              paddingBottom: theme.spacing.xl,
              backgroundColor: "rgba(10, 8, 12, 0.62)",
              borderWidth: 1,
              borderColor: "rgba(255, 244, 231, 0.10)",
              gap: 16,
              boxShadow: theme.shadows.hero,
            }}
          >
            <View style={{ gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: theme.radii.pill,
                    backgroundColor: "rgba(241, 209, 171, 0.14)",
                    borderWidth: 1,
                    borderColor: "rgba(241, 209, 171, 0.18)",
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.metal.champagne,
                      fontSize: theme.typography.micro,
                      fontWeight: "700",
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                    }}
                  >
                    PRO
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  hitSlop={12}
                  onPress={handleClose}
                  style={({ pressed }) => ({
                    borderRadius: theme.radii.pill,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View
                    style={{
                      minWidth: 48,
                      minHeight: 40,
                      borderRadius: theme.radii.pill,
                      paddingHorizontal: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: theme.colors.bg.glass,
                      borderWidth: 1,
                      borderColor: theme.colors.border.subtle,
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: theme.colors.text.editorial,
                        fontWeight: "700",
                        fontSize: theme.typography.micro,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                      }}
                    >
                      Close
                    </Text>
                  </View>
                </Pressable>
              </View>

              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontSize: 34,
                  lineHeight: 38,
                  fontWeight: "700",
                  fontFamily: theme.fonts.editorial,
                  letterSpacing: -0.7,
                }}
              >
                Upgrade to StudioBloom Pro.
              </Text>
              <Text
                selectable
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.caption,
                  lineHeight: 19,
                }}
              >
                {catalog.paywallBenefits.join("  ·  ")}
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
                        borderRadius: theme.radii.l,
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        backgroundColor: selected
                          ? "rgba(241, 209, 171, 0.16)"
                          : "rgba(255, 246, 234, 0.05)",
                        borderWidth: 1,
                        borderColor: selected
                          ? theme.colors.border.glow
                          : "rgba(255, 246, 234, 0.10)",
                        gap: 10,
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
                                ? theme.colors.metal.champagne
                                : "rgba(255,246,234,0.24)",
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
                                  backgroundColor: theme.colors.metal.champagne,
                                }}
                              />
                            ) : null}
                          </View>

                          <View style={{ gap: 3, flex: 1 }}>
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
                                  color: theme.colors.text.editorial,
                                  fontSize: 22,
                                  fontWeight: "700",
                                  fontFamily: theme.fonts.editorial,
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
                                    backgroundColor: "rgba(241, 209, 171, 0.14)",
                                  }}
                                >
                                  <Text
                                    selectable
                                    style={{
                                      color: theme.colors.metal.champagne,
                                      fontSize: theme.typography.micro,
                                      fontWeight: "700",
                                      letterSpacing: 0.9,
                                      textTransform: "uppercase",
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
                              color: theme.colors.text.editorial,
                              fontSize: 22,
                              fontWeight: "800",
                            }}
                          >
                            {plan.priceText}
                          </Text>
                          <Text
                            selectable
                            style={{
                              color: theme.colors.text.muted,
                              fontSize: theme.typography.micro,
                              textTransform: "uppercase",
                              letterSpacing: 0.9,
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
                lineHeight: 18,
              }}
            >
              Cancel anytime. Billing is handled securely by the App Store / Play
              Store.
            </Text>

            <View style={{ gap: 10 }}>
              <PrimaryButton
                label={purchaseLoading ? "Unlocking..." : "Continue"}
                onPress={() => {
                  void handleContinue();
                }}
                loading={purchaseLoading}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void handleRestore();
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.muted,
                      textAlign: "center",
                      fontSize: theme.typography.micro,
                      textDecorationLine: "underline",
                    }}
                  >
                    {restoreLoading ? "Restoring..." : "Restore"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void Linking.openURL("https://hollybit.app/privacy");
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.muted,
                      textAlign: "center",
                      fontSize: theme.typography.micro,
                      textDecorationLine: "underline",
                    }}
                  >
                    Privacy
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void Linking.openURL("https://hollybit.app/terms");
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.muted,
                      textAlign: "center",
                      fontSize: theme.typography.micro,
                      textDecorationLine: "underline",
                    }}
                  >
                    Terms of use
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
