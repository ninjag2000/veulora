import { Redirect, useLocalSearchParams } from "expo-router";

import { isVideoContentLabPresetId } from "@/lib/catalog";
import { VideoGeneratorScreen } from "@/screens/video-generator-screen";

export default function VideoGeneratorRoute() {
  const params = useLocalSearchParams<{ presetId: string }>();

  if (isVideoContentLabPresetId(params.presetId)) {
    return <Redirect href={"/video-content-lab" as any} />;
  }

  return <VideoGeneratorScreen />;
}
