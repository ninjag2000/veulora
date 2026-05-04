import { Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import type { RootMode } from "@/lib/types";

interface FloatingModeSwitcherProps {
  activeMode: RootMode;
  onSelect: (mode: RootMode) => void;
}

export function FloatingModeSwitcher({
  activeMode,
  onSelect,
}: FloatingModeSwitcherProps) {
  return (
    <View
      style={{
        borderRadius: theme.radii.xl,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: 6,
        backgroundColor: "rgba(17, 14, 18, 0.96)",
        boxShadow: theme.shadows.soft,
      }}
    >
      <View style={{ flexDirection: "row", gap: 6 }}>
        {(["image", "video", "history"] as const).map((mode) => {
          const isActive = mode === activeMode;
          return (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${mode} mode`}
              onPress={() => onSelect(mode)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 48,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: isActive
                  ? "rgba(242, 218, 184, 0.20)"
                  : pressed
                  ? "rgba(255, 246, 234, 0.08)"
                  : "transparent",
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive
                  ? "rgba(242, 218, 184, 0.22)"
                  : "transparent",
              })}
            >
              <Text
                selectable
                style={{
                  color: isActive
                    ? theme.colors.text.editorial
                    : theme.colors.text.secondary,
                  fontWeight: isActive ? "800" : "700",
                  textTransform: "uppercase",
                  letterSpacing: 1.15,
                  fontSize: theme.typography.micro,
                }}
              >
                {mode}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
