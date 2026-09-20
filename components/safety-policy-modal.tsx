import * as Linking from "expo-linking";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { AppModal } from "@/components/app-modal";
import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";

interface SafetyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const allowedUses = [
  "Portraits, professional headshots, avatars, and editorial images",
  "Product, pet, travel, lifestyle, and creative social content",
  "Images and videos featuring people who agreed to participate",
];

const prohibitedUses = [
  "Sexual or exploitative content, especially content involving minors",
  "Graphic violence, hateful content, dangerous acts, or illegal activity",
  "Non-consensual intimate content, harassment, impersonation, or abuse",
];

export function SafetyPolicyModal({
  visible,
  onClose,
}: SafetyPolicyModalProps) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      placement="center"
      showCloseButton
      cardStyle={{
        width: "100%",
        maxWidth: 520,
        maxHeight: "88%",
        alignSelf: "center",
      }}
    >
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.spacing.xl,
          gap: theme.spacing.l,
        }}
      >
        <View style={{ paddingRight: 46, gap: theme.spacing.s }}>
          <Text
            accessibilityRole="header"
            style={{
              color: theme.colors.text.editorial,
              fontFamily: theme.fonts.editorial,
              fontSize: theme.typography.section,
              fontWeight: "700",
            }}
          >
            Safety policy
          </Text>
          <Text
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body,
              lineHeight: 22,
            }}
          >
            StudioBloom is designed for safe creative work. Requests and media
            are checked before and after generation, and credits are not charged
            when a request is rejected by a safety check.
          </Text>
        </View>

        <PolicySection title="Allowed uses" items={allowedUses} />
        <PolicySection title="Not allowed" items={prohibitedUses} />

        <Text
          style={{
            color: theme.colors.text.muted,
            fontSize: theme.typography.caption,
            lineHeight: 19,
          }}
        >
          Only upload content you own or have permission to use. Repeated misuse
          may limit access to generation features.
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: theme.spacing.l,
          }}
        >
          <PolicyLink label="Support" url="https://hollybit.app/support" />
          <PolicyLink
            label="Privacy Policy"
            url="https://hollybit.app/privacy"
          />
        </View>

        <PrimaryButton label="Done" compact onPress={onClose} />
      </ScrollView>
    </AppModal>
  );
}

function PolicySection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ gap: theme.spacing.s }}>
      <Text
        style={{
          color: theme.colors.text.primary,
          fontSize: theme.typography.caption,
          fontWeight: "800",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", gap: theme.spacing.s }}>
          <View
            style={{
              width: 7,
              height: 7,
              marginTop: 7,
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.metal.roseGold,
            }}
          />
          <Text
            style={{
              flex: 1,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body,
              lineHeight: 22,
            }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PolicyLink({ label, url }: { label: string; url: string }) {
  const openLink = async () => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open link", "Please try again later.");
    }
  };

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void openLink()}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text
        style={{
          color: theme.colors.metal.champagne,
          fontSize: theme.typography.caption,
          fontWeight: "700",
          textDecorationLine: "underline",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
