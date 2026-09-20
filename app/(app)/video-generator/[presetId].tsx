import { useEffect } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { isVideoContentLabPresetId } from "@/lib/catalog";
import { isRestrictedPresetId } from "@/lib/catalog-safety";
import { useToastState } from "@/providers/app-provider";
import { VideoGeneratorScreen } from "@/screens/video-generator-screen";

export default function VideoGeneratorRoute() {
  const params = useLocalSearchParams<{ presetId: string }>();
  const router = useRouter();
  const { pushToast } = useToastState();
  const isRestricted = isRestrictedPresetId(params.presetId);

  useEffect(() => {
    if (!isRestricted) {
      return;
    }

    pushToast("This preset is no longer available.");
    router.replace("/video");
  }, [isRestricted, pushToast, router]);

  if (isVideoContentLabPresetId(params.presetId)) {
    return <Redirect href={"/video-content-lab" as any} />;
  }

  if (isRestricted) {
    return null;
  }

  return <VideoGeneratorScreen />;
}
