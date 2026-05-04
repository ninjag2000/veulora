import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";

import { AppModal } from "@/components/app-modal";
import { PrimaryButton } from "@/components/primary-button";
import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { PhotoGuidelinesContent, TemplateImageSource } from "@/lib/types";

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
    <AppModal
      visible={visible}
      placement="center"
      dismissOnBackdropPress={false}
      cardStyle={{
        maxHeight: "84%",
        width: "100%",
        alignSelf: "center",
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
            color: theme.colors.text.editorial,
            fontSize: theme.typography.title,
            fontWeight: "700",
            fontFamily: theme.fonts.editorial,
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
    </AppModal>
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
  examples: TemplateImageSource[];
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
            <Image
              source={resolveImageSource(image)}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
