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
  const minHeight = compact ? 50 : 60;
  const labelSize = compact ? theme.typography.caption : theme.typography.body;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.46 : 1,
        transform: [{ scale: pressed ? 0.992 : 1 }],
      })}
    >
      {secondary ? (
        <View
          style={{
            minHeight,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.bg.glass,
            borderWidth: 1,
            borderColor: theme.colors.border.strong,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: compact ? 18 : 24,
            boxShadow: theme.shadows.soft,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={theme.gradients.glass}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", inset: 0 }}
          />
            {loading ? (
              <ActivityIndicator color={theme.colors.text.primary} />
            ) : (
              <Text
                selectable={false}
                allowFontScaling={false}
                style={{
                  color: theme.colors.text.primary,
                  fontSize: labelSize,
                  fontWeight: "700",
                  letterSpacing: 0.3,
                }}
              >
                {label}
              </Text>
            )}
        </View>
      ) : (
        <View
          style={{
            borderRadius: theme.radii.pill,
            overflow: "hidden",
            boxShadow: theme.shadows.glow,
          }}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight,
              borderRadius: theme.radii.pill,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: compact ? 18 : 24,
              borderWidth: 1,
              borderColor: "rgba(255, 240, 220, 0.28)",
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 1,
                left: 10,
                right: 10,
                height: compact ? 20 : 24,
                borderRadius: theme.radii.pill,
                backgroundColor: "rgba(255, 249, 241, 0.22)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: theme.radii.pill,
                borderWidth: 1,
                borderColor: "rgba(100, 50, 28, 0.10)",
              }}
            />
            {loading ? (
              <ActivityIndicator color={theme.colors.text.dark} />
            ) : (
              <Text
                selectable={false}
                allowFontScaling={false}
                style={{
                  color: theme.colors.text.dark,
                  fontSize: labelSize,
                  fontWeight: "900",
                  letterSpacing: 0.35,
                }}
              >
                {label}
              </Text>
            )}
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}
