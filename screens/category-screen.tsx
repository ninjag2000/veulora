import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import {
  PresetTile,
  getPresetTileDimensions,
} from "@/components/preset-card";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { findImageSectionBySlug, findVideoSectionBySlug } from "@/lib/catalog";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

const categoryTileWidth = getPresetTileDimensions("video").width;

export function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug: string }>();
  const { catalog } = useAppState();
  const imageSection = catalog ? findImageSectionBySlug(catalog, params.slug) : null;
  const videoSection = catalog ? findVideoSectionBySlug(catalog, params.slug) : null;
  const section = imageSection ?? videoSection;

  if (!section) {
    return (
      <Screen>
        <EmptyState
          title="Category not found"
          description="This collection is not available in the current mock catalog."
          actionLabel="Back"
          onActionPress={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        showBack
        onBack={() => router.back()}
        showBrand={false}
        title={section.title}
        onPressSettings={() => router.push("/settings")}
      />

      <Text
        selectable
        style={{
          color: theme.colors.text.secondary,
          fontSize: theme.typography.body,
          lineHeight: 22,
        }}
      >
        Explore all presets in the {section.title.toLowerCase()} collection.
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          columnGap: theme.spacing.m,
          rowGap: theme.spacing.m,
        }}
      >
        {section.items.map((item) => (
          <View key={item.id} style={{ width: categoryTileWidth }}>
            <PresetTile
              template={item}
              variant="video"
              onPress={() =>
                router.push(
                  (item.modeType === "video"
                    ? `/video-generator/${item.id}`
                    : item.kind === "photoPack"
                    ? `/photo-pack/${item.id}`
                    : `/generator/${item.id}`) as any
                )
              }
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}
