import { useRouter } from "expo-router";
import { Camera } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { FlatList, Text, View } from "react-native";

import {
  FeaturedBannerCard,
  PresetTile,
  getPresetTileDimensions,
} from "@/components/preset-card";
import { isContentLabPresetId } from "@/lib/catalog";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import type { BootstrapPayload } from "@/lib/types";
import {
  useCatalogState,
  useEntitlementsState,
} from "@/providers/app-provider";
import { track } from "@/services/analytics-service";

type ImageSection = BootstrapPayload["imageSections"][number];
const largeTileWidth = getPresetTileDimensions("large").width;

function isContentLabBanner(banner: BootstrapPayload["featuredBanner"]) {
  const normalizedId = banner.id.toLowerCase();
  const normalizedTitle = banner.title.toLowerCase();
  const compactId = normalizedId.replace(/[^a-z0-9]+/g, "");
  const compactTitle = normalizedTitle.replace(/[^a-z0-9]+/g, "");

  return (
    normalizedId.replace(/[_\s]+/g, "-").includes("content-lab") ||
    compactId.includes("contentlab") ||
    normalizedTitle.includes("content lab") ||
    compactTitle.includes("contentlab") ||
    isContentLabPresetId(banner.presetId)
  );
}

export function ImageHomeScreen() {
  const router = useRouter();
  const { catalog } = useCatalogState();
  const { entitlements } = useEntitlementsState();

  const openImagePreset = useCallback(
    (presetId: string, kind?: string) => {
      router.push(
        (kind === "photoPack"
          ? `/photo-pack/${presetId}`
          : `/generator/${presetId}`) as any
      );
    },
    [router]
  );

  const openCategory = useCallback(
    (slug?: string) => {
      if (slug) {
        router.push(`/category/${slug}`);
      }
    },
    [router]
  );

  const openFeatured = useCallback(() => {
    if (!catalog) {
      return;
    }

    const banner = catalog.featuredBanner;
    const openContentLab = isContentLabBanner(banner);
    const resolvedRoute = openContentLab
      ? "/content-lab"
      : `/generator/${banner.presetId}`;

    track("featured_banner_try_tap");
    track("featured_banner_open", {
      banner_id: banner.id,
      banner_title: banner.title,
      banner_preset_id: banner.presetId,
      resolved_route: resolvedRoute,
    });

    router.push(resolvedRoute as any);
  }, [catalog, router]);

  const standardSections = useMemo(
    () =>
      (catalog?.imageSections ?? []).filter(
        (section) => section.items[0]?.kind !== "photoPack"
      ),
    [catalog?.imageSections]
  );

  const photoSessionSections = useMemo(
    () =>
      (catalog?.imageSections ?? []).filter(
        (section) => section.items[0]?.kind === "photoPack"
      ),
    [catalog?.imageSections]
  );

  const renderSection = useCallback(
    ({ item }: { item: ImageSection }) => (
      <ImageSectionRail
        section={item}
        onOpenPreset={openImagePreset}
        onOpenCategory={openCategory}
      />
    ),
    [openCategory, openImagePreset]
  );

  if (!catalog) {
    return null;
  }

  return (
    <Screen scrollable={false} contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0, gap: 0 }}>
      <FlatList
        data={standardSections}
        keyExtractor={(item) => item.id}
        renderItem={renderSection}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: theme.spacing.xxl,
          paddingBottom: 156,
          gap: theme.spacing.xl,
        }}
        ListHeaderComponent={
          <View style={{ gap: theme.spacing.xl, paddingHorizontal: theme.spacing.l }}>
            <TopBar
              showBrand={false}
              colorfulProBadge={entitlements.isPro}
              credits={entitlements.currentCredits}
              onPressPro={() =>
                router.push(
                  entitlements.isPro
                    ? "/subscription"
                    : "/paywall?mode=soft&source=premium_feature"
                )
              }
              onPressSettings={() => router.push("/settings")}
            />

            <FeaturedBannerCard
              banner={catalog.featuredBanner}
              onPress={openFeatured}
            />
          </View>
        }
        ListFooterComponent={
          photoSessionSections.length > 0 ? (
            <View style={{ paddingHorizontal: theme.spacing.l }}>
              <View
                style={{
                  gap: theme.spacing.l,
                  paddingTop: theme.spacing.xl,
                  paddingBottom: theme.spacing.xl,
                  borderRadius: theme.radii.xl,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: theme.spacing.l,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Camera
                    size={20}
                    strokeWidth={2.1}
                    color={theme.colors.text.editorial}
                  />
                  <Text
                    selectable
                    style={{
                      color: theme.colors.text.editorial,
                      fontSize: theme.typography.section,
                      fontWeight: "700",
                      letterSpacing: -0.2,
                      fontFamily: theme.fonts.editorial,
                    }}
                  >
                    Photo Sessions
                  </Text>
                </View>

                <View style={{ gap: theme.spacing.xl }}>
                  {photoSessionSections.map((section) => (
                    <ImageSectionRail
                      key={section.id}
                      section={section}
                      horizontalPadding={0}
                      onOpenPreset={openImagePreset}
                      onOpenCategory={openCategory}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const ImageSectionRail = memo(function ImageSectionRail({
  section,
  horizontalPadding = theme.spacing.l,
  onOpenPreset,
  onOpenCategory,
}: {
  section: ImageSection;
  horizontalPadding?: number;
  onOpenPreset: (presetId: string, kind?: string) => void;
  onOpenCategory: (slug?: string) => void;
}) {
  return (
    <View style={{ gap: 16, paddingHorizontal: horizontalPadding }}>
      {section.layoutType === "horizontal" ? (
        <>
          <SectionHeader
            title={section.title}
            actionLabel="See all"
            onActionPress={() => onOpenCategory(section.seeAllSlug)}
          />
          <FlatList
            horizontal
            data={section.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PresetTile
                template={item}
                variant="video"
                onPress={() => onOpenPreset(item.id, item.kind)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingRight: 8 }}
            initialNumToRender={3}
            maxToRenderPerBatch={4}
            windowSize={3}
          />
        </>
      ) : section.layoutType === "two-grid" ? (
        <>
          <SectionHeader title={section.title} />
          <View style={{ flexDirection: "row", gap: 14 }}>
            {section.items.map((item) => (
              <PresetTile
                key={item.id}
                template={item}
                variant="small"
                onPress={() => onOpenPreset(item.id, item.kind)}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <SectionHeader title={section.title} />
          <FlatList
            horizontal
            data={section.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PresetTile
                template={item}
                onPress={() => onOpenPreset(item.id, item.kind)}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingRight: 8 }}
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={3}
            getItemLayout={(_, index) => ({
              length: largeTileWidth + 14,
              offset: (largeTileWidth + 14) * index,
              index,
            })}
          />
        </>
      )}
    </View>
  );
});
