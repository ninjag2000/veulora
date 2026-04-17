import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface BrandLogoProps {
  large?: boolean;
  showCaption?: boolean;
}

export function BrandLogo({ large = false, showCaption = false }: BrandLogoProps) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <LinearGradient
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: large ? 22 : 16,
          paddingVertical: large ? 12 : 8,
          borderRadius: theme.radii.pill,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.12)",
          minWidth: large ? 180 : 112,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: theme.shadows.glow,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: large ? 18 : 12,
            fontWeight: "800",
            letterSpacing: 3.4,
          }}
        >
          VELOURA
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
