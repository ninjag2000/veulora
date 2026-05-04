import { Pressable, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: theme.spacing.m,
      }}
    >
      <View style={{ gap: 8, flex: 1 }}>
        <View
          style={{
            width: 34,
            height: 1,
            backgroundColor: theme.colors.border.glow,
          }}
        />
        <Text
          selectable
          style={{
            color: theme.colors.text.editorial,
            fontSize: theme.typography.section,
            fontWeight: "700",
            letterSpacing: -0.2,
            fontFamily: theme.fonts.editorial,
          }}
        >
          {title}
        </Text>
      </View>

      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onActionPress}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.bg.glass,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.micro,
                fontWeight: "700",
                letterSpacing: 1.1,
                textTransform: "uppercase",
              }}
            >
              {actionLabel}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
