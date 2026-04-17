import { Image } from "expo-image";
import { Modal, ScrollView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { theme } from "@/lib/theme";
import type { PhotoGuidelinesContent } from "@/lib/types";

export function GuidelinesModal({
  visible,
  content,
  onContinue,
}: {
  visible: boolean;
  content: PhotoGuidelinesContent;
  onContinue: () => void;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(5, 3, 9, 0.78)",
          padding: theme.spacing.l,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            maxHeight: "84%",
            borderRadius: theme.radii.xl,
            backgroundColor: theme.colors.bg.surface,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            overflow: "hidden",
          }}
        >
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: theme.spacing.xl,
              gap: theme.spacing.l,
            }}
          >
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.title,
                fontWeight: "800",
              }}
            >
              {content.title}
            </Text>

            <GuidelinesBlock
              title={content.goodTitle}
              criteria={content.goodCriteria}
              examples={content.goodExamples}
              tone="good"
            />
            <GuidelinesBlock
              title={content.badTitle}
              criteria={content.badCriteria}
              examples={content.badExamples}
              tone="bad"
            />

            <PrimaryButton label="Next" onPress={onContinue} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function GuidelinesBlock({
  title,
  criteria,
  examples,
  tone,
}: {
  title: string;
  criteria: string[];
  examples: string[];
  tone: "good" | "bad";
}) {
  return (
    <View style={{ gap: theme.spacing.m }}>
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

      <View style={{ gap: 8 }}>
        {criteria.map((item) => (
          <Text
            key={item}
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
              lineHeight: 18,
            }}
          >
            {tone === "good" ? "Good: " : "Avoid: "}
            {item}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: theme.spacing.s }}>
        {examples.map((image) => (
          <View
            key={image}
            style={{
              flex: 1,
              height: 110,
              borderRadius: theme.radii.l,
              overflow: "hidden",
              borderWidth: 1,
              borderColor:
                tone === "good"
                  ? "rgba(135, 216, 175, 0.28)"
                  : "rgba(230, 130, 158, 0.24)",
            }}
          >
            <Image source={image} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          </View>
        ))}
      </View>
    </View>
  );
}
