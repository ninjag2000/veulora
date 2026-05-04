import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Animated, Easing, useWindowDimensions, View } from "react-native";

import { resolveImageSource } from "@/lib/helpers";
import { theme } from "@/lib/theme";
import type { TemplateImageSource } from "@/lib/types";

export function PaywallCarousel({ assets }: { assets: TemplateImageSource[] }) {
  const { width, height } = useWindowDimensions();
  const animationDurationMs = 14000;
  const progress = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const animations = progress.map((value) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: animationDurationMs,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      )
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [animationDurationMs, progress]);

  const columnWidth = Math.min(118, (width - theme.spacing.l * 2 - 24) / 3);
  const cardHeight = columnWidth * 1.54;
  const gap = 12;
  const baseCards = assets.length > 0 ? assets : [""];
  const rowsPerColumn = 6;
  const columns = Array.from({ length: 3 }, (_, columnIndex) =>
    Array.from({ length: rowsPerColumn }, (_, rowIndex) => {
      const assetIndex = (rowIndex * 3 + columnIndex) % baseCards.length;
      return baseCards[assetIndex];
    })
  );
  const rowStride = cardHeight + gap;
  const cycleHeight = rowsPerColumn * rowStride;
  const repeatedColumns = columns.map((column) => [...column, ...column, ...column]);
  const initialOffsets = [0, -rowStride * 2, -rowStride * 4];

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: 1,
      }}
    >
      {repeatedColumns.map((column, columnIndex) => (
        <Animated.View
          key={`paywall-column-${columnIndex}`}
          style={{
            position: "absolute",
            top: -62 + initialOffsets[columnIndex],
            left: theme.spacing.l + columnIndex * (columnWidth + 12),
            width: columnWidth,
            transform: [
              {
                translateY: progress[columnIndex].interpolate({
                  inputRange: [0, 1],
                  outputRange:
                    columnIndex === 1 ? [-cycleHeight, 0] : [0, -cycleHeight],
                }),
              },
            ],
          }}
        >
          {column.map((asset, rowIndex) => (
            <View
              key={`${rowIndex}-${columnIndex}-${asset}`}
              style={{
                width: columnWidth,
                height: cardHeight,
                borderRadius: 30,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255,244,231,0.14)",
                backgroundColor: theme.colors.bg.card,
                marginBottom: gap,
                boxShadow: theme.shadows.soft,
              }}
            >
              <Image
                source={resolveImageSource(asset)}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ))}
        </Animated.View>
      ))}

      <View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(4, 4, 8, 0.18)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: height * 0.42,
          backgroundColor: "rgba(8, 7, 12, 0.12)",
        }}
      />
    </View>
  );
}
