import { useEffect } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { isContentLabPresetId } from "@/lib/catalog";
import { isRestrictedPresetId } from "@/lib/catalog-safety";
import { useToastState } from "@/providers/app-provider";
import { PhotoGeneratorScreen } from "@/screens/photo-generator-screen";

export default function PhotoGeneratorRoute() {
  const params = useLocalSearchParams<{ presetId: string }>();
  const router = useRouter();
  const { pushToast } = useToastState();
  const isRestricted = isRestrictedPresetId(params.presetId);

  useEffect(() => {
    if (!isRestricted) {
      return;
    }

    pushToast("This preset is no longer available.");
    router.replace("/image");
  }, [isRestricted, pushToast, router]);

  if (isContentLabPresetId(params.presetId)) {
    return <Redirect href="/content-lab" />;
  }

  if (isRestricted) {
    return null;
  }

  return <PhotoGeneratorScreen />;
}
