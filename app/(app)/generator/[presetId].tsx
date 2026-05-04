import { Redirect, useLocalSearchParams } from "expo-router";

import { isContentLabPresetId } from "@/lib/catalog";
import { PhotoGeneratorScreen } from "@/screens/photo-generator-screen";

export default function PhotoGeneratorRoute() {
  const params = useLocalSearchParams<{ presetId: string }>();

  if (isContentLabPresetId(params.presetId)) {
    return <Redirect href="/content-lab" />;
  }

  return <PhotoGeneratorScreen />;
}
