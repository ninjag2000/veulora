import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { findTemplateById } from "@/lib/catalog";
import { formatCredits } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

export function PresetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const { catalog, entitlements } = useAppState();
  const preset = catalog ? findTemplateById(catalog, params.presetId) : null;

  if (!preset) {
    return (
      <Screen>
        <EmptyState
          title="Preset not found"
          description="This preset is no longer available in the mock catalog."
          actionLabel="Back to home"
          onActionPress={() => router.replace("/image")}
        />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <PrimaryButton
          label={`Generate for ${formatCredits(preset.generationCost)}`}
          onPress={() =>
            router.push(
              preset.modeType === "video"
                ? `/video-generator/${preset.id}`
                : `/generator/${preset.id}`
            )
          }
        />
      }
    >
      <TopBar
        showBack
        onBack={() => router.back()}
        showBrand={false}
        title={preset.title}
        credits={entitlements.currentCredits}
        onPressSettings={() => router.push("/settings")}
      />

      <View
        style={{
          height: 360,
          borderRadius: theme.radii.xl,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }}
      >
        <Image source={preset.coverUrl} contentFit="cover" style={{ width: "100%", height: "100%" }} />
      </View>

      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.body,
          lineHeight: 24,
        }}
      >
        {preset.description}
      </Text>

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xl,
          gap: theme.spacing.s,
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
          Input requirements
        </Text>
        {preset.inputRequirements.map((requirement) => (
          <Text
            key={requirement}
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.caption,
              lineHeight: 20,
            }}
          >
            {requirement}
          </Text>
        ))}
      </View>

      <View style={{ gap: theme.spacing.m }}>
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.section,
            fontWeight: "700",
          }}
        >
          Examples
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.s, paddingRight: theme.spacing.s }}
        >
          {preset.examples.map((example) => (
            <View
              key={example}
              style={{
                width: 160,
                height: 200,
                borderRadius: theme.radii.l,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}
            >
              <Image source={example} contentFit="cover" style={{ width: "100%", height: "100%" }} />
            </View>
          ))}
        </ScrollView>
      </View>
    </Screen>
  );
}
