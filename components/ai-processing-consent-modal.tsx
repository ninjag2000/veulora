import * as Linking from "expo-linking";
import { BackHandler, Platform, Pressable, Text, View } from "react-native";

import { AppModal } from "@/components/app-modal";
import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";

interface AiProcessingConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function AiProcessingConsentModal({
  visible,
  onAccept,
  onDecline,
}: AiProcessingConsentModalProps) {
  const handleDecline = () => {
    onDecline();

    if (Platform.OS === "android") {
      BackHandler.exitApp();
    }
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleDecline}
      placement="center"
      dismissOnBackdropPress={false}
      cardStyle={{ width: "100%", maxWidth: 440, alignSelf: "center" }}
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
            style={{
              color: theme.colors.text.editorial,
              fontSize: theme.typography.section,
              fontWeight: "700",
              fontFamily: theme.fonts.editorial,
              textAlign: "center",
            }}
          >
            AI Processing Consent
          </Text>

          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            To generate images and videos, StudioBloom sends your uploaded images,
            videos, and prompts to third-party AI providers for secure
            processing.
          </Text>

          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            Generated results are created algorithmically and may be
            inaccurate, stylized, or unrealistic. By tapping Agree, you
            consent to this processing.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL("https://hollybit.app/privacy")}
          style={({ pressed }) => ({
            alignSelf: "center",
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text
            selectable
            style={{
              color: theme.colors.metal.champagne,
              fontSize: theme.typography.caption,
              fontWeight: "700",
              textDecorationLine: "underline",
            }}
          >
            Privacy Policy
          </Text>
        </Pressable>

        <View style={{ gap: theme.spacing.s }}>
          <PrimaryButton label="Agree" onPress={onAccept} />
          <PrimaryButton
            label="Decline"
            onPress={handleDecline}
            secondary
            compact
          />
        </View>
      </View>
    </AppModal>
  );
}
