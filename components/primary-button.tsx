import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  compact?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  secondary = false,
  compact = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.48 : pressed ? 0.9 : 1,
      })}
    >
      {secondary ? (
        <View
          style={{
            minHeight: compact ? 44 : 54,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.bg.elevated,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: compact ? 18 : 22,
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.primary} />
          ) : (
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.body,
                fontWeight: "700",
              }}
            >
              {label}
            </Text>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            minHeight: compact ? 46 : 58,
            borderRadius: theme.radii.pill,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: compact ? 18 : 22,
            boxShadow: theme.shadows.glow,
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.text.primary} />
          ) : (
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.body,
                fontWeight: "800",
              }}
            >
              {label}
            </Text>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}
