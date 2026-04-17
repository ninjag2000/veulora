import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { FloatingModeSwitcher } from "@/components/floating-mode-switcher";
import { PresetTile } from "@/components/preset-card";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

export function VideoHomeScreen() {
  const router = useRouter();
  const { catalog, entitlements } = useAppState();

  if (!catalog) {
    return null;
  }

  return (
    <Screen footer={<FloatingModeSwitcher activeMode="video" />}>
      <TopBar
        title="Video"
        credits={entitlements.currentCredits}
        onPressPro={() => router.push("/paywall?mode=soft&source=video_generation")}
        onPressSettings={() => router.push("/settings")}
      />

      <View
        style={{
          borderRadius: theme.radii.xl,
          backgroundColor: theme.colors.bg.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: theme.spacing.xl,
          gap: theme.spacing.m,
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontSize: theme.typography.section,
            fontWeight: "800",
          }}
        >
          Animate your photo
        </Text>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.body,
            lineHeight: 22,
          }}
        >
          Start from a clear portrait and launch a motion preset in one step.
        </Text>
        <PrimaryButton
          label="Create video"
          onPress={() => router.push("/video-generator/dance-loop")}
          compact
        />
      </View>

      {catalog.videoSections.map((section) => (
        <View key={section.id} style={{ gap: theme.spacing.m }}>
          <SectionHeader
            title={section.title}
            actionLabel="See all"
            onActionPress={() => router.push(`/category/${section.seeAllSlug}`)}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: theme.spacing.m, paddingRight: theme.spacing.s }}
          >
            {section.items.map((item) => (
              <View key={item.id} style={{ width: 192 }}>
                <PresetTile
                  template={item}
                  variant="video"
                  onPress={() => router.push(`/preset/${item.id}`)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ))}
    </Screen>
  );
}
