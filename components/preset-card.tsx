import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import type { FeaturedBanner, Template } from "@/lib/types";

export function FeaturedBannerCard({
  banner,
  onPress,
}: {
  banner: FeaturedBanner;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={banner.title}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          height: 188,
          borderRadius: theme.radii.xl,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.card,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Image
          source={banner.imageUrl}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
        />
        <LinearGradient
          colors={["rgba(9, 5, 14, 0.18)", "rgba(9, 5, 14, 0.92)"]}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: "space-between",
            padding: theme.spacing.l,
          }}
        >
          <View style={{ alignItems: "flex-start" }}>
            {banner.isPro ? <Badge label="PRO" /> : null}
          </View>

          <View style={{ gap: theme.spacing.s }}>
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.section,
                fontWeight: "800",
              }}
            >
              {banner.title}
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption,
                lineHeight: 18,
                maxWidth: "88%",
              }}
            >
              {banner.subtitle}
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: theme.radii.pill,
                backgroundColor: "rgba(255, 255, 255, 0.10)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.16)",
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontWeight: "700",
                }}
              >
                {banner.ctaLabel}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

interface PresetTileProps {
  template: Template;
  onPress?: () => void;
  variant?: "large" | "small" | "video";
}

export function PresetTile({
  template,
  onPress,
  variant = "large",
}: PresetTileProps) {
  const height = variant === "small" ? 192 : variant === "video" ? 226 : 250;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={template.title}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        flex: 1,
      })}
    >
      <View
        style={{
          height,
          borderRadius: theme.radii.l,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.card,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Image
          source={template.coverUrl}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
        />

        <LinearGradient
          colors={["rgba(12, 8, 20, 0.08)", "rgba(12, 8, 20, 0.92)"]}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: "space-between",
            padding: theme.spacing.m,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {template.isPro ? <Badge label="PRO" /> : <Badge label={template.category} />}
            {template.modeType === "video" ? <Badge label="Motion" subtle /> : null}
          </View>

          <View style={{ gap: 6 }}>
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: variant === "small" ? 17 : 20,
                fontWeight: "800",
              }}
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
              >
                {template.subtitle}
              </Text>
            ) : null}
            {template.previewCount ? (
              <Text
                selectable
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.micro,
                  letterSpacing: 0.3,
                }}
              >
                {template.previewCount} looks
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

function Badge({
  label,
  subtle = false,
}: {
  label: string;
  subtle?: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.radii.pill,
        backgroundColor: subtle
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(200, 107, 255, 0.18)",
        borderWidth: 1,
        borderColor: subtle
          ? theme.colors.border.subtle
          : "rgba(200, 107, 255, 0.28)",
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.primary,
          fontWeight: "700",
          fontSize: theme.typography.micro,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
