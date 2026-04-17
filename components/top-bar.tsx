import { Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import { IconButton } from "@/components/icon-button";
import { BrandLogo } from "@/components/brand-logo";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBrand?: boolean;
  showProBadge?: boolean;
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
  credits,
  onPressPro,
  onPressSettings,
}: TopBarProps) {
  return (
    <View style={{ gap: theme.spacing.m }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing.s,
        }}
      >
        <View style={{ minWidth: 86, alignItems: "flex-start" }}>
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
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: theme.radii.pill,
                backgroundColor: pressed
                  ? "rgba(255, 255, 255, 0.12)"
                  : theme.colors.bg.surface,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              })}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontWeight: "800",
                  letterSpacing: 1.4,
                  fontSize: theme.typography.caption,
                }}
              >
                PRO
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          {showBrand ? <BrandLogo /> : null}
        </View>

        <View
          style={{
            minWidth: 86,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: theme.spacing.s,
          }}
        >
          {credits !== undefined ? (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: theme.radii.pill,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <Text
                selectable
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.caption,
                  fontWeight: "700",
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
            color: theme.colors.text.primary,
            fontSize: theme.typography.title,
            fontWeight: "800",
          }}
        >
          {title}
        </Text>
      ) : null}
    </View>
  );
}
