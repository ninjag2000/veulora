import { Tabs, usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FloatingModeSwitcher } from "@/components/floating-mode-switcher";
import { theme } from "@/lib/theme";
import type { RootMode } from "@/lib/types";

export default function RootTabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeMode: RootMode = pathname === "/video"
    ? "video"
    : pathname === "/history"
    ? "history"
    : "image";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg.app }}>
      <Tabs
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          animation: "none",
          freezeOnBlur: false,
          lazy: true,
          tabBarStyle: {
            display: "none",
          },
          sceneStyle: {
            backgroundColor: theme.colors.bg.app,
          },
        }}
      >
        <Tabs.Screen name="image" />
        <Tabs.Screen name="video" />
        <Tabs.Screen name="history" />
      </Tabs>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: theme.spacing.l,
          right: theme.spacing.l,
          bottom: Math.max(insets.bottom, 14),
        }}
      >
        <FloatingModeSwitcher
          activeMode={activeMode}
          onSelect={(mode) => {
            const nextPath =
              mode === "video" ? "/video" : mode === "history" ? "/history" : "/image";
            if (pathname !== nextPath) {
              router.navigate(nextPath as "/image" | "/video" | "/history");
            }
          }}
        />
      </View>
    </View>
  );
}
