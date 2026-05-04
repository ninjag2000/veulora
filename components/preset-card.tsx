import { useState } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { FeaturedBanner, Template } from "@/lib/types";

type PresetTileVariant = "large" | "small" | "video";

export function getPresetTileDimensions(variant: PresetTileVariant) {
  const height = variant === "small" ? 208 : variant === "video" ? 236 : 266;

  return {
    height,
    width: Math.round((height * 9) / 16),
  };
}

export function FeaturedBannerCard({
  banner,
  onPress,
}: {
  banner: FeaturedBanner;
  onPress?: () => void;
}) {
  const cardRadius = theme.radii.xl;
  const isContentLabBanner = banner.presetId === "content-lab";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={banner.title}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View
        style={{
          height: isContentLabBanner ? 212 : 236,
          borderRadius: cardRadius,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: cardRadius,
            overflow: "hidden",
            backgroundColor: theme.colors.bg.hero,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <Image
            source={resolveImageSource(banner.imageUrl)}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            style={{ width: "100%", height: "100%" }}
          />

          <LinearGradient
            colors={
              isContentLabBanner
                ? [
                    "rgba(20, 12, 15, 0.04)",
                    "rgba(18, 11, 14, 0.16)",
                    "rgba(9, 7, 11, 0.90)",
                  ]
                : [
                    "rgba(17, 11, 14, 0.10)",
                    "rgba(17, 11, 14, 0.42)",
                    "rgba(9, 7, 11, 0.96)",
                  ]
            }
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: cardRadius,
            }}
          />

          {!isContentLabBanner ? (
            <View
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                right: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Badge label="EDITORIAL PICK" kind="editorial" />
              {banner.isPro ? <Badge label="PRO" kind="premium" /> : null}
            </View>
          ) : null}

          <View
            style={{
              position: "absolute",
              left: theme.spacing.l,
              right: theme.spacing.l,
              bottom: theme.spacing.l,
              flexDirection: isContentLabBanner ? "row" : undefined,
              alignItems: isContentLabBanner ? "flex-end" : undefined,
              justifyContent: isContentLabBanner ? "space-between" : undefined,
              gap: theme.spacing.s,
            }}
          >
            <View
              style={{
                gap: 6,
                flex: isContentLabBanner ? 1 : undefined,
                maxWidth: isContentLabBanner ? "66%" : undefined,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontSize: isContentLabBanner ? 24 : 34,
                  lineHeight: isContentLabBanner ? 28 : 36,
                  fontWeight: "700",
                  fontFamily: theme.fonts.editorial,
                  letterSpacing: isContentLabBanner ? -0.55 : -0.9,
                }}
              >
                {banner.title}
              </Text>
              {banner.subtitle ? (
                <Text
                  selectable
                  style={{
                    color: isContentLabBanner
                      ? theme.colors.text.primary
                      : theme.colors.text.secondary,
                    fontSize: isContentLabBanner ? 14 : 15,
                    lineHeight: isContentLabBanner ? 18 : 20,
                    maxWidth: isContentLabBanner ? "100%" : "72%",
                  }}
                  numberOfLines={isContentLabBanner ? 1 : 2}
                >
                  {banner.subtitle}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                alignSelf: isContentLabBanner ? "flex-end" : "flex-start",
                minWidth: isContentLabBanner ? 108 : undefined,
                paddingHorizontal: isContentLabBanner ? 24 : 14,
                paddingVertical: isContentLabBanner ? 12 : 8,
                borderRadius: theme.radii.pill,
                backgroundColor: isContentLabBanner
                  ? "rgba(112, 84, 96, 0.78)"
                  : "rgba(255, 247, 236, 0.12)",
                borderWidth: 1,
                borderColor: isContentLabBanner
                  ? "rgba(229, 167, 182, 0.32)"
                  : "rgba(255, 247, 236, 0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontWeight: "800",
                  fontSize: isContentLabBanner
                    ? 15
                    : theme.typography.micro,
                  letterSpacing: isContentLabBanner ? 0 : 0.3,
                }}
              >
                {banner.ctaLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

interface PresetTileProps {
  template: Template;
  onPress?: () => void;
  variant?: PresetTileVariant;
}

export function PresetTile({
  template,
  onPress,
  variant = "large",
}: PresetTileProps) {
  const { height, width } = getPresetTileDimensions(variant);
  const cardRadius = theme.radii.l;
  const [imageFailed, setImageFailed] = useState(false);
  const eyebrowLabel =
    variant === "video"
      ? "Motion"
      : template.kind === "photoPack"
      ? "Session"
      : template.category;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={template.title}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
        width,
      })}
    >
      <View
        style={{
          width,
          height,
          borderRadius: cardRadius,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: cardRadius,
            overflow: "hidden",
            backgroundColor: theme.colors.bg.card,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: theme.colors.bg.card,
            }}
          />
          {!imageFailed ? (
            <Image
              source={resolveImageSource(template.coverUrl)}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
              onError={() => setImageFailed(true)}
              onLoad={() => setImageFailed(false)}
              style={{ width: "100%", height: "100%" }}
            />
          ) : null}

          <LinearGradient
            colors={[
              "rgba(16, 12, 18, 0.10)",
              "rgba(16, 12, 18, 0.34)",
              "rgba(8, 7, 10, 0.94)",
            ]}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              borderRadius: cardRadius,
              justifyContent: "space-between",
              padding: variant === "small" ? 12 : 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Badge label={eyebrowLabel} kind="editorial" />
              {template.isPro ? <Badge label="PRO" kind="premium" /> : null}
            </View>

            <View style={{ gap: 6 }}>
              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontSize: variant === "small" ? 18 : 20,
                  lineHeight: variant === "small" ? 22 : 24,
                  fontWeight: "700",
                  fontFamily: theme.fonts.editorial,
                  letterSpacing: -0.35,
                }}
                numberOfLines={variant === "small" ? 2 : 3}
              >
                {template.title}
              </Text>
              {template.subtitle ? (
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.caption,
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {template.subtitle}
                </Text>
              ) : null}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
}

function Badge({
  label,
  kind,
}: {
  label: string;
  kind: "editorial" | "premium" | "meta";
}) {
  const backgroundColor =
    kind === "premium"
      ? "rgba(241, 209, 171, 0.18)"
      : kind === "editorial"
      ? "rgba(255, 246, 234, 0.10)"
      : "rgba(255, 246, 234, 0.07)";
  const borderColor =
    kind === "premium"
      ? "rgba(241, 209, 171, 0.30)"
      : kind === "editorial"
      ? "rgba(255, 246, 234, 0.15)"
      : theme.colors.border.subtle;
  const color =
    kind === "premium"
      ? theme.colors.metal.champagne
      : kind === "editorial"
      ? theme.colors.text.editorial
      : theme.colors.text.secondary;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radii.pill,
        backgroundColor,
        borderWidth: 1,
        borderColor,
      }}
    >
      <Text
        selectable
        style={{
          color,
          fontWeight: "700",
          fontSize: theme.typography.micro,
          letterSpacing: kind === "meta" ? 0.35 : 0.9,
          textTransform: kind === "meta" ? "none" : "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
