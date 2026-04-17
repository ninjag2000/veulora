import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Animated, useWindowDimensions, View } from "react-native";

import { theme } from "@/lib/theme";

export function PaywallCarousel({ assets }: { assets: string[] }) {
  const { width, height } = useWindowDimensions();
  const columns = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const animations = columns.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: index % 2 === 0 ? 1 : -1,
            duration: 22000 + index * 2400,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 22000 + index * 2400,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [columns]);

  const columnWidth = Math.min(132, (width - theme.spacing.l * 2) / 3);
  const cardHeight = columnWidth * 1.54;
  const baseCards = assets.length > 0 ? assets : [""];
  const rows = Array.from({ length: 4 }, (_, rowIndex) =>
    Array.from({ length: 3 }, (_, columnIndex) => {
      const assetIndex = (rowIndex * 3 + columnIndex) % baseCards.length;
      return baseCards[assetIndex];
    })
  );

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: 0.96,
      }}
    >
      {columns.map((value, columnIndex) => (
        <Animated.View
          key={`paywall-column-${columnIndex}`}
          style={{
            position: "absolute",
            top: -56,
            left: theme.spacing.l + columnIndex * (columnWidth + 12),
            transform: [
              {
                  translateY: value.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [10, 0, -14],
                  }),
                },
              ],
          }}
        >
          {rows.map((row, rowIndex) => {
            const asset = row[columnIndex];
            const rotate =
              rowIndex % 2 === 0
                ? `${columnIndex === 1 ? -4 : 4}deg`
                : `${columnIndex === 1 ? 3 : -3}deg`;

            return (
              <View
                key={`${columnIndex}-${rowIndex}-${asset}`}
                style={{
                  width: columnWidth,
                  height: cardHeight,
                  borderRadius: 30,
                  overflow: "hidden",
                  marginBottom: 14,
                  transform: [{ rotate }],
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  backgroundColor: theme.colors.bg.card,
                }}
              >
                <Image
                  source={asset}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
            );
          })}
        </Animated.View>
      ))}

      <View
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(4, 4, 8, 0.30)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: height * 0.42,
          backgroundColor: "rgba(8, 7, 12, 0.34)",
        }}
      />
    </View>
  );
}
