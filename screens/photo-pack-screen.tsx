import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text, useWindowDimensions, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { IconButton } from "@/components/icon-button";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { findTemplateById } from "@/lib/catalog";
import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import { useAppState } from "@/providers/app-provider";

export function PhotoPackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ presetId: string }>();
  const { catalog } = useAppState();
  const { width: viewportWidth } = useWindowDimensions();
  const pack = catalog ? findTemplateById(catalog, params.presetId) : null;

  if (!pack || pack.kind !== "photoPack") {
    return (
      <Screen>
        <EmptyState
          title="Pack not found"
          description="This photo collection is not available."
          actionLabel="Back to image"
          onActionPress={() => router.replace("/image")}
        />
      </Screen>
    );
  }

  const photoCount = pack.photoPackSize ?? 8;
  const horizontalPadding = theme.spacing.l;
  const gridGap = theme.spacing.s;
  const gridWidth = Math.max(0, viewportWidth - horizontalPadding * 2);
  const exampleWidth = (gridWidth - gridGap) / 2;

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 0,
        paddingTop: 0,
        gap: 0,
      }}
    >
      <View
        style={{
          height: 430,
          overflow: "hidden",
          backgroundColor: theme.colors.bg.card,
        }}
      >
        <Image
          source={resolveImageSource(pack.coverUrl)}
          contentFit="cover"
          style={{ width: "100%", height: "100%" }}
        />
        <LinearGradient
          colors={["rgba(8, 5, 12, 0.05)", "rgba(8, 5, 12, 0.18)", "rgba(8, 5, 12, 0.98)"]}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: "space-between",
            paddingHorizontal: theme.spacing.l,
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <IconButton
              symbol="chevron.left"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
            />
            {pack.isPro ? (
              <View
                style={{
                  borderRadius: theme.radii.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  backgroundColor: "rgba(255, 116, 197, 0.86)",
                }}
              >
                <Text
                  selectable
                  style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.caption,
                    fontWeight: "800",
                  }}
                >
                  PRO
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ gap: 8 }}>
            <Text
              selectable
              style={{
                color: theme.colors.text.primary,
                fontSize: 34,
                fontWeight: "900",
              }}
            >
              {pack.title}
            </Text>
            <Text
              selectable
              style={{
                color: theme.colors.text.secondary,
                fontSize: theme.typography.caption,
                fontWeight: "800",
              }}
            >
              {photoCount} photos
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View
        style={{
          paddingHorizontal: theme.spacing.l,
          paddingTop: theme.spacing.l,
          gap: theme.spacing.m,
        }}
      >
        <View style={{ gap: theme.spacing.s }}>
          <Text
            selectable
            style={{
              color: theme.colors.text.primary,
              fontSize: theme.typography.section,
              fontWeight: "800",
            }}
          >
            What's inside
          </Text>
          <Text
            selectable
            style={{
              color: theme.colors.text.secondary,
              fontSize: theme.typography.body,
              lineHeight: 22,
            }}
          >
            {pack.description}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            columnGap: gridGap,
            rowGap: gridGap,
          }}
        >
          {pack.examples.map((example, index) => (
            <View
              key={`${example}_${index}`}
              style={{
                width: exampleWidth,
                aspectRatio: 0.74,
                borderRadius: theme.radii.m,
                overflow: "hidden",
                backgroundColor: theme.colors.bg.card,
              }}
            >
              <Image
                source={resolveImageSource(example)}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ))}
        </View>

        <View style={{ paddingBottom: theme.spacing.l }}>
          <PrimaryButton
            label={`Get this Pack for ${pack.generationCost} credits`}
            onPress={() => router.push(`/generator/${pack.id}`)}
          />
        </View>
      </View>
    </Screen>
  );
}
