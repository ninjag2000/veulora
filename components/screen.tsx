import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";

import { theme } from "@/lib/theme";

interface ScreenProps extends PropsWithChildren {
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}

export function Screen({
  children,
  scrollable = true,
  contentContainerStyle,
  footer,
}: ScreenProps) {
  const content = scrollable ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: theme.spacing.l,
          paddingTop: theme.spacing.l,
          paddingBottom: 140,
          gap: theme.spacing.l,
        },
        contentContainerStyle,
      ]}
      style={{ flex: 1 }}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        {
          flex: 1,
          paddingHorizontal: theme.spacing.l,
          paddingTop: theme.spacing.l,
          gap: theme.spacing.l,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg.app,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -140,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: 260,
          backgroundColor: "rgba(200, 107, 255, 0.20)",
          opacity: 0.7,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 120,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: 220,
          backgroundColor: "rgba(255, 143, 216, 0.10)",
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {content}
      </KeyboardAvoidingView>

      {footer ? (
        <View
          style={{
            position: "absolute",
            left: theme.spacing.l,
            right: theme.spacing.l,
            bottom: 16,
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
