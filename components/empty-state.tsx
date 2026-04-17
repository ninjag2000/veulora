import { Text, View } from "react-native";

import { theme } from "@/lib/theme";
import { PrimaryButton } from "@/components/primary-button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View
      style={{
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.bg.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: theme.spacing.xxl,
        gap: theme.spacing.m,
        alignItems: "center",
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.primary,
          fontSize: theme.typography.section,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.body,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {description}
      </Text>
      {actionLabel ? (
        <View style={{ width: "100%", marginTop: theme.spacing.s }}>
          <PrimaryButton label={actionLabel} onPress={onActionPress} compact />
        </View>
      ) : null}
    </View>
  );
}
