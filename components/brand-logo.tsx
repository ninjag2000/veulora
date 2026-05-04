import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface BrandLogoProps {
  large?: boolean;
  compact?: boolean;
  prominent?: boolean;
  showCaption?: boolean;
}

export function BrandLogo({
  large = false,
  compact = false,
  prominent = false,
  showCaption = false,
}: BrandLogoProps) {
  const brandText = "STUDIOBLOOM";
  const variant = prominent
    ? "prominent"
    : compact
    ? "compact"
    : large
    ? "large"
    : "default";
  const horizontalPadding =
    variant === "prominent"
      ? 28
      : variant === "large"
      ? 22
      : variant === "compact"
      ? 12
      : 16;
  const verticalPadding =
    variant === "prominent"
      ? 15
      : variant === "large"
      ? 12
      : variant === "compact"
      ? 7
      : 8;
  const minWidth =
    variant === "prominent"
      ? 214
      : variant === "large"
      ? 180
      : variant === "compact"
      ? 118
      : 112;
  const fontSize =
    brandText.length > 8
      ? variant === "prominent"
        ? 17
        : variant === "large"
        ? 15
        : variant === "compact"
        ? 9
        : 10
      : variant === "prominent"
      ? 20
      : variant === "large"
      ? 18
      : variant === "compact"
      ? 11
      : 12;
  const letterSpacing =
    brandText.length > 8
      ? variant === "prominent"
        ? 3
        : variant === "large"
        ? 2.4
        : variant === "compact"
        ? 1.6
        : 2.2
      : variant === "prominent"
      ? 4
      : variant === "large"
      ? 3.4
      : variant === "compact"
      ? 2.6
      : 3.4;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <LinearGradient
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: horizontalPadding,
          paddingVertical: verticalPadding,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor:
            variant === "prominent"
              ? "rgba(255, 247, 237, 0.24)"
              : "rgba(255, 255, 255, 0.12)",
          minWidth,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: theme.shadows.glow,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize,
            fontWeight: variant === "prominent" ? "900" : "800",
            letterSpacing,
          }}
        >
          {brandText}
        </Text>
      </LinearGradient>

      {showCaption ? (
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption,
            letterSpacing: 0.4,
          }}
        >
          Premium AI photo and video studio
        </Text>
      ) : null}
    </View>
  );
}
