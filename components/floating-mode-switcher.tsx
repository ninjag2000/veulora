import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import type { RootMode } from "@/lib/types";

interface FloatingModeSwitcherProps {
  activeMode: RootMode;
}

const routes: Record<RootMode, "/image" | "/video" | "/history"> = {
  image: "/image",
  video: "/video",
  history: "/history",
};

export function FloatingModeSwitcher({
  activeMode,
}: FloatingModeSwitcherProps) {
  const router = useRouter();

  return (
    <BlurView
      tint="dark"
      intensity={70}
      style={{
        borderRadius: theme.radii.pill,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: 6,
        backgroundColor: "rgba(21, 16, 29, 0.82)",
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
              onPress={() => router.replace(routes[mode])}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 46,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive
                  ? "rgba(200, 107, 255, 0.22)"
                  : pressed
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
              })}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontWeight: isActive ? "800" : "600",
                  textTransform: "capitalize",
                  fontSize: theme.typography.caption,
                }}
              >
                {mode}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}
