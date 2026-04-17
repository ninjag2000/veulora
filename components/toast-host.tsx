import { BlurView } from "expo-blur";
import { Text, View } from "react-native";

import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

export function ToastHost() {
  const { toasts } = useAppState();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: theme.spacing.l,
        right: theme.spacing.l,
        bottom: 110,
        gap: theme.spacing.s,
      }}
    >
      {toasts.slice(-2).map((toast) => (
        <BlurView
          key={toast.id}
          tint="dark"
          intensity={70}
          style={{
            borderRadius: theme.radii.l,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            backgroundColor: "rgba(21, 16, 29, 0.84)",
            paddingHorizontal: theme.spacing.l,
            paddingVertical: theme.spacing.m,
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.caption,
              textAlign: "center",
            }}
          >
            {toast.message}
          </Text>
        </BlurView>
      ))}
    </View>
  );
}
