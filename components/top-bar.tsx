import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import { IconButton } from "@/components/icon-button";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBrand?: boolean;
  showProBadge?: boolean;
  colorfulProBadge?: boolean;
  credits?: number;
  onPressPro?: () => void;
  onPressSettings?: () => void;
}

export function TopBar({
  title,
  showBack = false,
  onBack,
  showBrand = true,
  showProBadge = true,
  colorfulProBadge = false,
  credits,
  onPressPro,
  onPressSettings,
}: TopBarProps) {
  return (
    <View style={{ gap: theme.spacing.l }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing.s,
        }}
      >
        <View style={{ minWidth: 96, alignItems: "flex-start" }}>
          {showBack ? (
            <IconButton
              symbol="chevron.left"
              accessibilityLabel="Go back"
              onPress={onBack}
            />
          ) : showProBadge ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open premium offer"
              onPress={onPressPro}
              style={({ pressed }) => ({
                borderRadius: theme.radii.pill,
                overflow: "hidden",
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: theme.radii.pill,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colorfulProBadge
                    ? "rgba(255, 240, 220, 0.28)"
                    : theme.colors.border.strong,
                  backgroundColor: colorfulProBadge
                    ? undefined
                    : theme.colors.bg.glass,
                  position: "relative",
                }}
              >
                {colorfulProBadge ? (
                  <>
                    <LinearGradient
                      colors={theme.gradients.primary}
                      start={{ x: 0, y: 0.2 }}
                      end={{ x: 1, y: 1 }}
                      style={{ position: "absolute", inset: 0 }}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: 1,
                        left: 10,
                        right: 10,
                        height: 16,
                        borderRadius: theme.radii.pill,
                        backgroundColor: "rgba(255, 249, 241, 0.22)",
                      }}
                    />
                  </>
                ) : null}
                <Text
                  selectable
                  style={{
                    color: colorfulProBadge
                      ? theme.colors.text.dark
                      : theme.colors.metal.champagne,
                    fontWeight: "800",
                    letterSpacing: 1.8,
                    fontSize: theme.typography.micro,
                  }}
                >
                  PRO
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        <View style={{ flex: 1 }} />

        <View
          style={{
            minWidth: 96,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: theme.spacing.s,
          }}
        >
          {credits !== undefined ? (
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.bg.glass,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.editorial,
                  fontSize: theme.typography.caption,
                  fontWeight: "700",
                  fontVariant: ["tabular-nums"],
                }}
              >
                {credits}
              </Text>
            </View>
          ) : null}

          <IconButton
            symbol="gearshape.fill"
            accessibilityLabel="Open settings"
            onPress={onPressSettings}
          />
        </View>
      </View>

      {title ? (
        <Text
          selectable
          style={{
            color: theme.colors.text.editorial,
            fontSize: theme.typography.title,
            lineHeight: 34,
            fontWeight: "700",
            fontFamily: theme.fonts.editorial,
            letterSpacing: -0.5,
          }}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}
