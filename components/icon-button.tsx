import { Image } from "expo-image";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";

import { theme } from "@/lib/theme";

interface IconButtonProps {
  symbol: string;
  accessibilityLabel: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  symbol,
  accessibilityLabel,
  onPress,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 42,
          height: 42,
          borderRadius: theme.radii.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed
            ? "rgba(255, 255, 255, 0.14)"
            : "rgba(255, 255, 255, 0.08)",
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        },
        style,
      ]}
    >
      <Image
        source={`sf:${symbol}`}
        contentFit="contain"
        style={{
          width: 18,
          height: 18,
          tintColor: theme.colors.text.primary,
        }}
      />
    </Pressable>
  );
}
