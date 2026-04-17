import { useRouter } from "expo-router";
import { View } from "react-native";

import { FeaturedBannerCard, PresetTile } from "@/components/preset-card";
import { FloatingModeSwitcher } from "@/components/floating-mode-switcher";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/top-bar";
import { useAppState } from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

export function ImageHomeScreen() {
  const router = useRouter();
  const { catalog, entitlements } = useAppState();

  if (!catalog) {
    return null;
  }

  return (
    <Screen footer={<FloatingModeSwitcher activeMode="image" />}>
      <TopBar
        title="Image"
        credits={entitlements.currentCredits}
        onPressPro={() => router.push("/paywall?mode=soft&source=premium_feature")}
        onPressSettings={() => router.push("/settings")}
      />

      <FeaturedBannerCard
        banner={catalog.featuredBanner}
        onPress={() => {
          track("featured_banner_try_tap");
          router.push(`/generator/${catalog.featuredBanner.presetId}`);
        }}
      />

      {catalog.imageSections.map((section) => (
        <View key={section.id} style={{ gap: 14 }}>
          <SectionHeader title={section.title} />
          {section.layoutType === "two-grid" ? (
            <View style={{ flexDirection: "row", gap: 12 }}>
              {section.items.map((item) => (
                <PresetTile
                  key={item.id}
                  template={item}
                  variant="small"
                  onPress={() => router.push(`/preset/${item.id}`)}
                />
              ))}
            </View>
          ) : (
            section.items.map((item) => (
              <PresetTile
                key={item.id}
                template={item}
                onPress={() => router.push(`/preset/${item.id}`)}
              />
            ))
          )}
        </View>
      ))}
    </Screen>
  );
}
