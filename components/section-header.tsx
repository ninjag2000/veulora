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
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.m,
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.primary,
          fontSize: theme.typography.section,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>

      {actionLabel ? (
        <Pressable accessibilityRole="button" onPress={onActionPress}>
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
              fontWeight: "700",
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
