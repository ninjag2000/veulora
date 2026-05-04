import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  type NativeScrollEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";

import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { TemplateImageSource } from "@/lib/types";

function isImmediatelyReadySource(source: TemplateImageSource | null | undefined) {
  if (typeof source === "number") {
    return true;
  }

  if (typeof source !== "string") {
    return false;
  }

  return !/^https?:\/\//i.test(source);
}

function getAssetKey(source: TemplateImageSource, index: number) {
  return `${String(source)}_${index}`;
}

function MediaLoadingOverlay({ label }: { label: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.spacing.s,
        backgroundColor: "rgba(9, 7, 11, 0.34)",
      }}
    >
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: theme.radii.m,
          backgroundColor: "rgba(18, 16, 21, 0.86)",
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          alignItems: "center",
          gap: 10,
        }}
      >
        <ActivityIndicator color={theme.colors.text.primary} />
        <Text
          selectable={false}
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.caption,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export function ImageResultViewer({
  outputs,
  selectedIndex,
  onIndexChange,
  height = 430,
  onSelectedAssetReadyChange,
}: {
  outputs: TemplateImageSource[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  height?: number;
  onSelectedAssetReadyChange?: (ready: boolean) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const { width } = useWindowDimensions();
  const viewportWidth = width - theme.spacing.l * 2;
  const [loadedAssets, setLoadedAssets] = useState<Record<string, true>>({});

  useEffect(() => {
    setLoadedAssets({});
  }, [outputs]);

  useEffect(() => {
    const selectedOutput = outputs[selectedIndex];

    if (!selectedOutput) {
      onSelectedAssetReadyChange?.(false);
      return;
    }

    const selectedKey = getAssetKey(selectedOutput, selectedIndex);
    const ready =
      isImmediatelyReadySource(selectedOutput) ||
      loadedAssets[selectedKey] === true;

    onSelectedAssetReadyChange?.(ready);
  }, [loadedAssets, onSelectedAssetReadyChange, outputs, selectedIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    if (nextIndex !== selectedIndex) {
      onIndexChange(nextIndex);
    }
  };

  return (
    <View style={{ gap: theme.spacing.m }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {outputs.map((output, index) => (
          (() => {
            const assetKey = getAssetKey(output, index);
            const ready =
              isImmediatelyReadySource(output) ||
              loadedAssets[assetKey] === true;

            return (
              <View
                key={assetKey}
                style={{
                  width: viewportWidth,
                  height,
                  borderRadius: theme.radii.xl,
                  overflow: "hidden",
                  backgroundColor: theme.colors.bg.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border.subtle,
                  boxShadow: theme.shadows.hero,
                }}
              >
                <Image
                  source={resolveImageSource(output)}
                  contentFit="cover"
                  onLoad={() => {
                    setLoadedAssets((current) =>
                      current[assetKey]
                        ? current
                        : { ...current, [assetKey]: true }
                    );
                  }}
                  style={{ width: "100%", height: "100%" }}
                />
                <LinearGradient
                  colors={["rgba(9, 7, 11, 0)", "rgba(9, 7, 11, 0.18)"]}
                  style={{ position: "absolute", inset: 0 }}
                />
                {!ready ? <MediaLoadingOverlay label="Loading image" /> : null}
              </View>
            );
          })()
        ))}
      </ScrollView>

      {outputs.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {outputs.map((output, index) => (
            <View
              key={`${output}_${index}`}
              style={{
                width: index === selectedIndex ? 30 : 8,
                height: 8,
                borderRadius: theme.radii.pill,
                backgroundColor:
                  index === selectedIndex
                    ? theme.colors.accent.end
                    : "rgba(255, 246, 234, 0.16)",
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function VideoResultViewer({
  source,
  height = 430,
  onReadyChange,
}: {
  source: string;
  height?: number;
  onReadyChange?: (ready: boolean) => void;
}) {
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(
    isImmediatelyReadySource(source)
  );
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  useEffect(() => {
    const immediateReady = isImmediatelyReadySource(source);
    setHasRenderedFirstFrame(immediateReady);
    onReadyChange?.(immediateReady);
  }, [onReadyChange, source]);

  return (
    <View
      style={{
        height,
        borderRadius: theme.radii.xl,
        overflow: "hidden",
        backgroundColor: theme.colors.bg.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        boxShadow: theme.shadows.hero,
      }}
    >
      <VideoView
        player={player}
        contentFit="cover"
        onFirstFrameRender={() => {
          setHasRenderedFirstFrame(true);
          onReadyChange?.(true);
        }}
        style={{ width: "100%", height: "100%" }}
      />

      <LinearGradient
        colors={["rgba(9, 7, 11, 0.02)", "rgba(9, 7, 11, 0.72)"]}
        style={{ position: "absolute", inset: 0 }}
      />

      {!hasRenderedFirstFrame ? (
        <MediaLoadingOverlay label="Loading video" />
      ) : null}

      <View
        style={{
          position: "absolute",
          left: theme.spacing.m,
          right: theme.spacing.m,
          bottom: theme.spacing.m,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: theme.radii.pill,
            backgroundColor: "rgba(255, 246, 234, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(255, 246, 234, 0.10)",
          }}
        >
          <Text
            selectable
            style={{
              color: theme.colors.text.editorial,
              fontWeight: "700",
              fontSize: theme.typography.micro,
              letterSpacing: 0.9,
              textTransform: "uppercase",
            }}
          >
            looping preview
          </Text>
        </View>
        <Text
          selectable
          style={{
            color: theme.colors.text.secondary,
            fontSize: theme.typography.micro,
            letterSpacing: 0.5,
          }}
        >
          campaign motion
        </Text>
      </View>
    </View>
  );
}
