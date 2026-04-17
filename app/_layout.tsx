import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import { ToastHost } from "@/components/toast-host";
import { AppProvider } from "@/providers/app-provider";

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
        <ToastHost />
      </AppProvider>
    </SafeAreaProvider>
  );
}
