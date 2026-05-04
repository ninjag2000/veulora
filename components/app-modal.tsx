import { BlurView } from "expo-blur";
import { X } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import {
  Modal,
  Pressable,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/lib/theme";

interface AppModalProps extends PropsWithChildren {
  visible: boolean;
  onClose?: () => void;
  placement?: "center" | "bottom";
  showCloseButton?: boolean;
  dismissOnBackdropPress?: boolean;
  cardStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppModal({
  visible,
  onClose,
  placement = "center",
  showCloseButton = false,
  dismissOnBackdropPress = true,
  cardStyle,
  contentStyle,
  children,
}: AppModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          {
            flex: 1,
            justifyContent:
              placement === "bottom" ? "flex-end" : "center",
            backgroundColor: "rgba(8, 5, 13, 0.72)",
            paddingHorizontal: theme.spacing.l,
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 18),
          },
          contentStyle,
        ]}
      >
        {dismissOnBackdropPress && onClose ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            onPress={onClose}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
        ) : null}

        <BlurView
          tint="dark"
          intensity={86}
          style={[
            {
              overflow: "hidden",
              borderRadius: theme.radii.xl,
              borderWidth: 1,
              borderColor: theme.colors.border.strong,
              backgroundColor: "rgba(21, 16, 29, 0.94)",
              boxShadow: theme.shadows.card,
            },
            cardStyle,
          ]}
        >
          {showCloseButton && onClose ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={({ pressed }) => ({
                position: "absolute",
                top: theme.spacing.m,
                right: theme.spacing.m,
                width: 38,
                height: 38,
                borderRadius: theme.radii.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.colors.pill,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
                opacity: pressed ? 0.72 : 1,
                zIndex: 2,
              })}
            >
              <X size={18} color={theme.colors.text.primary} strokeWidth={2.4} />
            </Pressable>
          ) : null}

          {children}
        </BlurView>
      </View>
    </Modal>
  );
}
