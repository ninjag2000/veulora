import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo, useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import { PresetTile } from "@/components/preset-card";
import { Screen } from "@/components/screen";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/top-bar";
import { theme } from "@/lib/theme";
import type { BootstrapPayload } from "@/lib/types";
import {
  useCatalogState,
  useEntitlementsState,
} from "@/providers/app-provider";

type VideoSection = BootstrapPayload["videoSections"][number];
const contentLabVideoHero = require("../assets/photo-generated/content-lab-video-hero.png");

export function VideoHomeScreen() {
  const router = useRouter();
  const { catalog } = useCatalogState();
  const { entitlements } = useEntitlementsState();

  const renderSection = useCallback(
    ({ item }: { item: VideoSection }) => <VideoSectionRail section={item} />,
    []
  );

  if (!catalog) {
    return null;
  }

  const openContentLabVideo = () => {
    router.push("/video-content-lab" as any);
  };

  return (
    <Screen scrollable={false} contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0, gap: 0 }}>
      <FlatList
        data={catalog.videoSections}
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
                    : "/paywall?mode=soft&source=video_generation"
                )
              }
              onPressSettings={() => router.push("/settings")}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Content Lab"
              onPress={openContentLabVideo}
              style={({ pressed }) => ({
                opacity: pressed ? 0.96 : 1,
              })}
            >
              <View
                style={{
                  height: 212,
                  borderRadius: theme.radii.xl,
                  overflow: "hidden",
                  backgroundColor: theme.colors.bg.card,
                  borderWidth: 1,
                  borderColor: theme.colors.border.subtle,
                  boxShadow: theme.shadows.hero,
                }}
              >
                <Image
                  source={contentLabVideoHero}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={0}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                />
                <LinearGradient
                  colors={[
                    "rgba(19, 11, 15, 0.04)",
                    "rgba(18, 11, 15, 0.16)",
                    "rgba(9, 7, 11, 0.90)",
                  ]}
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    padding: theme.spacing.xl,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: theme.spacing.m,
                    }}
                  >
                    <View
                      style={{
                        gap: 6,
                        flex: 1,
                        maxWidth: "66%",
                      }}
                    >
                      <Text
                        selectable
                        style={{
                          color: theme.colors.text.editorial,
                          fontSize: 24,
                          lineHeight: 28,
                          fontFamily: theme.fonts.editorial,
                          fontWeight: "700",
                          letterSpacing: -0.55,
                        }}
                      >
                        Content Lab
                      </Text>
                      <Text
                        selectable
                        style={{
                          color: theme.colors.text.primary,
                          fontSize: 14,
                          lineHeight: 18,
                        }}
                        numberOfLines={1}
                      >
                        Create unique content
                      </Text>
                    </View>

                    <View
                      style={{
                        minWidth: 108,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: theme.radii.pill,
                        backgroundColor: "rgba(112, 84, 96, 0.78)",
                        borderWidth: 1,
                        borderColor: "rgba(229, 167, 182, 0.32)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        selectable
                        style={{
                          color: theme.colors.text.editorial,
                          fontWeight: "800",
                          fontSize: 15,
                        }}
                      >
                        Try
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Pressable>
          </View>
        }
      />
    </Screen>
  );
}

const VideoSectionRail = memo(function VideoSectionRail({
  section,
}: {
  section: VideoSection;
}) {
  const router = useRouter();

  return (
    <View style={{ gap: theme.spacing.m, paddingHorizontal: theme.spacing.l }}>
      <SectionHeader
        title={section.title}
        actionLabel="See all"
        onActionPress={() => router.push(`/category/${section.seeAllSlug}`)}
      />
      <FlatList
        horizontal
        data={section.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PresetTile
            template={item}
            variant="video"
            onPress={() => router.push(`/video-generator/${item.id}`)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingRight: theme.spacing.s }}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={3}
      />
    </View>
  );
});
