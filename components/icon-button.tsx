import { ChevronLeft, type LucideIcon, Settings } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, type StyleProp, type ViewStyle, View } from "react-native";

import { theme } from "@/lib/theme";

const iconMap: Record<string, LucideIcon> = {
  "chevron.left": ChevronLeft,
  "gearshape.fill": Settings,
};

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
  const Icon = iconMap[symbol] ?? Settings;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 46,
          height: 46,
          borderRadius: theme.radii.pill,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.border.strong,
          backgroundColor: pressed
            ? theme.colors.bg.glassStrong
            : theme.colors.bg.glass,
          boxShadow: theme.shadows.soft,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={theme.gradients.glass}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={20}
          strokeWidth={2.2}
          color={theme.colors.text.editorial}
        />
      </View>
    </Pressable>
  );
}
