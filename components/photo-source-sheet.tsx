import { Camera, ImagePlus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { AppModal } from "@/components/app-modal";
import { theme } from "@/lib/theme";

interface PhotoSourceSheetProps {
  visible: boolean;
  title: string;
  subtitle: string;
  showCamera?: boolean;
  onCamera?: () => void;
  onLibrary: () => void;
  onClose: () => void;
}

export function PhotoSourceSheet({
  visible,
  title,
  subtitle,
  showCamera = false,
  onCamera,
  onLibrary,
  onClose,
}: PhotoSourceSheetProps) {
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      placement="bottom"
      showCloseButton
    >
      <View
        style={{
          padding: theme.spacing.l,
          gap: theme.spacing.m,
        }}
      >
        <View style={{ flex: 1, gap: theme.spacing.xs, paddingRight: 48 }}>
          <Text
            selectable
            style={{
              color: theme.colors.text.editorial,
              fontSize: theme.typography.section,
              fontWeight: "700",
              fontFamily: theme.fonts.editorial,
            }}
          >
            {title}
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
              lineHeight: 19,
            }}
          >
            {subtitle}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.s }}>
          {showCamera ? (
            <SourceAction
              icon="camera"
              title="Camera"
              subtitle="Take a new reference photo"
              onPress={onCamera}
            />
          ) : null}
          <SourceAction
            icon="library"
            title="Photo library"
            subtitle="Choose an existing image"
            onPress={onLibrary}
          />
        </View>
      </View>
    </AppModal>
  );
}

function SourceAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: "camera" | "library";
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  const Icon = icon === "camera" ? Camera : ImagePlus;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 68,
        borderRadius: theme.radii.m,
        borderWidth: 1,
        borderColor: pressed ? theme.colors.border.strong : theme.colors.border.subtle,
        backgroundColor: pressed ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.055)",
        padding: theme.spacing.m,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.m,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: theme.radii.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(200, 107, 255, 0.18)",
          borderWidth: 1,
          borderColor: "rgba(255, 143, 216, 0.22)",
        }}
      >
        <Icon size={20} color={theme.colors.accent.end} strokeWidth={2.3} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.body,
            fontWeight: "800",
          }}
        >
          {title}
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
