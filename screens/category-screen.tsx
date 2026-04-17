import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { PresetTile } from "@/components/preset-card";
import { Screen } from "@/components/screen";
import { TopBar } from "@/components/top-bar";
import { findVideoSectionBySlug } from "@/lib/catalog";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

export function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug: string }>();
  const { catalog } = useAppState();
  const section = catalog ? findVideoSectionBySlug(catalog, params.slug) : null;

  if (!section) {
    return (
      <Screen>
        <EmptyState
          title="Category not found"
          description="This collection is not available in the current mock catalog."
          actionLabel="Back to video"
          onActionPress={() => router.replace("/video")}
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

      <View style={{ gap: theme.spacing.m }}>
        {section.items.map((item) => (
          <PresetTile
            key={item.id}
            template={item}
            variant="video"
            onPress={() => router.push(`/preset/${item.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}
