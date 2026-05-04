import { Text, View } from "react-native";

import { AppModal } from "@/components/app-modal";
import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      placement="center"
      cardStyle={{ width: "100%", maxWidth: 420, alignSelf: "center" }}
    >
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.xl,
          gap: theme.spacing.l,
        }}
      >
        <View style={{ gap: theme.spacing.s }}>
          <Text
            selectable
            style={{
              color: theme.colors.text.editorial,
              fontSize: theme.typography.section,
              fontWeight: "700",
              fontFamily: theme.fonts.editorial,
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
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            {description}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.s }}>
          <PrimaryButton label={confirmLabel} onPress={onConfirm} />
          <PrimaryButton
            label={cancelLabel}
            onPress={onCancel}
            secondary
            compact
          />
        </View>
      </View>
    </AppModal>
  );
}
