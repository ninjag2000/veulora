import type { PropsWithChildren, ReactNode } from "react";
import { Image } from "expo-image";
import {
  KeyboardAvoidingView,
  ScrollView,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "@/lib/theme";

const appBackgroundImage = require("../assets/photo-generated/app-background-v4.png");

interface ScreenProps extends PropsWithChildren {
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  footerCard?: boolean;
  background?: "app" | "none";
}

export function Screen({
  children,
  scrollable = true,
  contentContainerStyle,
  footer,
  footerCard = true,
  background = "app",
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
          paddingBottom: 160,
          gap: theme.spacing.xl,
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
          gap: theme.spacing.xl,
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
        backgroundColor:
          background === "app" ? theme.colors.bg.app : "transparent",
      }}
    >
      {background === "app" ? (
        <>
          <Image
            source={appBackgroundImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            style={{ position: "absolute", inset: 0 }}
          />

          <LinearGradient
            colors={[
              "rgba(9, 7, 11, 0.82)",
              "rgba(12, 9, 14, 0.70)",
              "rgba(9, 7, 11, 0.88)",
            ]}
            style={{ position: "absolute", inset: 0 }}
          />
        </>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {content}
      </KeyboardAvoidingView>

      {footer ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 132,
          }}
        >
          <LinearGradient
            colors={[
              "rgba(9, 7, 11, 0)",
              "rgba(9, 7, 11, 0.72)",
              "rgba(9, 7, 11, 0.96)",
            ]}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}

      {footer ? (
        <View
          style={{
            position: "absolute",
            left: theme.spacing.l,
            right: theme.spacing.l,
            bottom: 16,
            ...(footerCard
              ? {
                  padding: 8,
                  borderRadius: theme.radii.xl,
                  backgroundColor: theme.colors.bg.glass,
                  borderWidth: 1,
                  borderColor: theme.colors.border.subtle,
                  boxShadow: theme.shadows.soft,
                }
              : {}),
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
