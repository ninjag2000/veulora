import { BlurView } from "expo-blur";
import { CircleAlert } from "lucide-react-native";
import { Text, View } from "react-native";

import { theme } from "@/lib/theme";
import { useToastState } from "@/providers/app-provider";

export function ToastHost() {
  const { toasts } = useToastState();

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
            borderColor: theme.colors.border.strong,
            backgroundColor: "rgba(21, 16, 29, 0.9)",
            paddingHorizontal: theme.spacing.l,
            paddingVertical: theme.spacing.m,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.s }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(230, 130, 158, 0.16)",
              }}
            >
              <CircleAlert size={16} color={theme.colors.feedback.error} strokeWidth={2.4} />
            </View>
            <Text
              selectable
              style={{
                flex: 1,
                color: theme.colors.text.primary,
                fontSize: theme.typography.caption,
                lineHeight: 18,
              }}
            >
              {toast.message}
            </Text>
          </View>
        </BlurView>
      ))}
    </View>
  );
}
