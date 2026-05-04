import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

import { PaywallCarousel } from "@/components/paywall-carousel";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { formatTimer } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

export function ExitOfferScreen() {
  const router = useRouter();
  const { catalog, entitlements, purchaseExitOffer, pushToast, restorePurchases } =
    useAppState();
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
  const isRecurringOffer = offer.packageType === "MONTHLY";
  const hasActiveExitOfferSubscription =
    isRecurringOffer &&
    (entitlements.subscriptionPlan === offer.id ||
      (offer.planId ? entitlements.subscriptionPlan === offer.planId : false));

  useEffect(() => {
    if (!hasActiveExitOfferSubscription) {
      return;
    }

    router.replace("/image");
  }, [hasActiveExitOfferSubscription, router]);

  if (hasActiveExitOfferSubscription) {
    return null;
  }

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
      await purchaseExitOffer();
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

      <Screen
        background="none"
        scrollable={false}
        footerCard={false}
        contentContainerStyle={{
          paddingTop: theme.spacing.s,
          paddingBottom: 176,
        }}
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
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <Pressable
                accessibilityRole="button"
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
              >
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.muted,
                    fontSize: theme.typography.micro,
                    textDecorationLine: "underline",
                  }}
                >
                  Restore
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL("https://hollybit.app/privacy")}
              >
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.muted,
                    fontSize: theme.typography.micro,
                    textDecorationLine: "underline",
                  }}
                >
                  Privacy Policy
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => Linking.openURL("https://hollybit.app/terms")}
              >
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.muted,
                    fontSize: theme.typography.micro,
                    textDecorationLine: "underline",
                  }}
                >
                  Terms of Use
                </Text>
              </Pressable>
            </View>
          </View>
        }
      >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          gap: theme.spacing.xl,
        }}
      >
        <View
          style={{
            borderRadius: theme.radii.xl,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
            backgroundColor: "rgba(10, 8, 12, 0.62)",
            borderWidth: 1,
            borderColor: "rgba(255, 244, 231, 0.10)",
            gap: 18,
            boxShadow: theme.shadows.hero,
          }}
        >
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
              onPress={dismiss}
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

          <View
            style={{
              borderRadius: theme.radii.l,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              backgroundColor: "rgba(255, 244, 231, 0.04)",
            }}
          >
            <LinearGradient
              colors={[
                "rgba(241, 209, 171, 0.20)",
                "rgba(208, 145, 122, 0.12)",
                "rgba(18, 16, 21, 0.30)",
              ]}
              locations={[0, 0.38, 1]}
              style={{
                position: "absolute",
                inset: 0,
              }}
            />

            <View
              style={{
                paddingTop: 28,
                paddingBottom: 26,
                paddingHorizontal: 22,
                gap: 20,
                alignItems: "center",
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontSize: 58,
                  lineHeight: 60,
                  fontWeight: "900",
                  letterSpacing: -1.8,
                  fontFamily: theme.fonts.editorial,
                }}
              >
                -{offer.discountPercent}%
              </Text>

              <View
                style={{
                  position: "relative",
                  alignSelf: "stretch",
                  height: 34,
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {Array.from({ length: 8 }).map((_, index) => (
                    <View
                      key={`ticket-dash-${index}`}
                      style={{
                        width: 20,
                        height: 4,
                        borderRadius: 99,
                        backgroundColor: "rgba(255, 244, 231, 0.44)",
                      }}
                    />
                  ))}
                </View>

                <View
                  style={{
                    position: "absolute",
                    left: -38,
                    top: -5,
                    width: 44,
                    height: 44,
                    borderRadius: 44,
                    backgroundColor: "rgba(9, 7, 11, 0.98)",
                    borderWidth: 1,
                    borderColor: theme.colors.border.subtle,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: -38,
                    top: -5,
                    width: 44,
                    height: 44,
                    borderRadius: 44,
                    backgroundColor: "rgba(9, 7, 11, 0.98)",
                    borderWidth: 1,
                    borderColor: theme.colors.border.subtle,
                  }}
                />
              </View>

              <View style={{ alignItems: "center", gap: 12 }}>
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.editorial,
                    fontSize: 20,
                    lineHeight: 24,
                    fontWeight: "700",
                    fontFamily: theme.fonts.editorial,
                    textAlign: "center",
                  }}
                >
                  {offer.title}
                </Text>
                {offer.subtitle ? (
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.caption,
                      textAlign: "center",
                    }}
                  >
                    {offer.subtitle}
                  </Text>
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "center",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.muted,
                      textDecorationLine: "line-through",
                      fontSize: 20,
                      fontWeight: "700",
                    }}
                  >
                    {offer.oldPrice}
                  </Text>
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.editorial,
                      fontSize: 30,
                      lineHeight: 34,
                      fontWeight: "900",
                      letterSpacing: -0.4,
                    }}
                  >
                    {offer.newPrice}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              alignItems: "center",
              gap: 8,
              paddingTop: 4,
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption,
              }}
            >
              Offer ends in
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.editorial,
                textAlign: "center",
                fontSize: 24,
                lineHeight: 28,
                fontWeight: "800",
                fontVariant: ["tabular-nums"],
              }}
            >
              {formatTimer(remainingMs)}
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.muted,
                textAlign: "center",
                fontSize: theme.typography.caption,
              }}
            >
              {offer.grantsPro || isRecurringOffer
                ? "Cancel anytime"
                : "One-time purchase"}
            </Text>
          </View>
        </View>
      </View>
      </Screen>
    </View>
  );
}
