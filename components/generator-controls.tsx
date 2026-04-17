import { Image } from "expo-image";
import { Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";
import type { RatioOption } from "@/lib/types";

export function PromptComposer({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View
      style={{
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.bg.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: theme.spacing.l,
        gap: theme.spacing.s,
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption,
          fontWeight: "700",
        }}
      >
        Prompt
      </Text>
      <TextInput
        accessibilityLabel="Prompt input"
        multiline
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        style={{
          minHeight: 120,
          color: theme.colors.text.primary,
          fontSize: theme.typography.body,
          textAlignVertical: "top",
        }}
      />
    </View>
  );
}

export function RatioSelector({
  value,
  onChange,
}: {
  value: RatioOption;
  onChange: (ratio: RatioOption) => void;
}) {
  return (
    <View style={{ gap: theme.spacing.s }}>
      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption,
          fontWeight: "700",
        }}
      >
        Ratio
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.s }}>
        {(["1:1", "3:4", "4:5", "9:16"] as const).map((ratio) => {
          const selected = ratio === value;
          return (
            <View key={ratio} style={{ flexBasis: "48%" }}>
              <PrimaryButton
                label={ratio}
                compact
                secondary={!selected}
                onPress={() => onChange(ratio)}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface ReferenceImageCardProps {
  title: string;
  hint: string;
  imageUri?: string;
  onPick: () => void;
  onDelete?: () => void;
}

export function ReferenceImageCard({
  title,
  hint,
  imageUri,
  onPick,
  onDelete,
}: ReferenceImageCardProps) {
  return (
    <View
      style={{
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.bg.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: theme.spacing.l,
        gap: theme.spacing.m,
      }}
    >
      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.caption,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>

      <View
        style={{
          height: 230,
          borderRadius: theme.radii.l,
          borderWidth: 1,
          borderStyle: imageUri ? "solid" : "dashed",
          borderColor: theme.colors.border.strong,
          backgroundColor: theme.colors.bg.card,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          padding: theme.spacing.l,
          gap: theme.spacing.s,
        }}
      >
        {imageUri ? (
          <Image source={imageUri} contentFit="cover" style={{ width: "100%", height: "100%" }} />
        ) : (
          <>
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.body,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Upload a photo
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              {hint}
            </Text>
          </>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.s }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={imageUri ? "Change" : "Choose photo"}
            secondary={!imageUri}
            onPress={onPick}
            compact
          />
        </View>
        {imageUri ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Delete" secondary onPress={onDelete} compact />
          </View>
        ) : null}
      </View>
    </View>
  );
}
