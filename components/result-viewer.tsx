import { useRef } from "react";
import {
  NativeSyntheticEvent,
  ScrollView,
  Text,
  type NativeScrollEvent,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";

import { theme } from "@/lib/theme";

export function ImageResultViewer({
  outputs,
  selectedIndex,
  onIndexChange,
}: {
  outputs: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const { width } = useWindowDimensions();
  const viewportWidth = width - theme.spacing.l * 2;

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
        {outputs.map((output) => (
          <View
            key={output}
            style={{
              width: viewportWidth,
              height: 430,
              borderRadius: theme.radii.xl,
              overflow: "hidden",
              backgroundColor: theme.colors.bg.surface,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            }}
          >
            <Image source={output} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          </View>
        ))}
      </ScrollView>

      {outputs.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {outputs.map((output, index) => (
            <View
              key={`${output}_${index}`}
              style={{
                width: index === selectedIndex ? 26 : 8,
                height: 8,
                borderRadius: theme.radii.pill,
                backgroundColor:
                  index === selectedIndex
                    ? theme.colors.accent.start
                    : "rgba(255, 255, 255, 0.14)",
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function VideoResultViewer({ source }: { source: string }) {
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return (
    <View
      style={{
        height: 430,
        borderRadius: theme.radii.xl,
        overflow: "hidden",
        backgroundColor: theme.colors.bg.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
      }}
    >
      <VideoView
        player={player}
        contentFit="cover"
        style={{ width: "100%", height: "100%" }}
      />

      <View
        style={{
          position: "absolute",
          left: theme.spacing.m,
          bottom: theme.spacing.m,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: theme.radii.pill,
          backgroundColor: "rgba(11, 7, 17, 0.68)",
        }}
      >
        <Text
          selectable
          style={{
            color: theme.colors.text.primary,
            fontWeight: "700",
            fontSize: theme.typography.caption,
          }}
        >
          Looping preview
        </Text>
      </View>
    </View>
  );
}
