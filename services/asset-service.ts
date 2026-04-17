import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

import { generateId, getFileExtension, isVideoAsset } from "@/lib/helpers";

async function downloadRemoteAsset(assetUrl: string) {
  const extension = getFileExtension(assetUrl, isVideoAsset(assetUrl) ? "mp4" : "jpg");
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!directory) {
    throw new Error("Unable to access a local cache directory.");
  }

  const destination = `${directory}${generateId("asset")}.${extension}`;
  const result = await FileSystem.downloadAsync(assetUrl, destination);
  return result.uri;
}

export async function saveAssetToLibraryAsync(assetUrl: string) {
  const permission = await MediaLibrary.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Photo library permission is required.");
  }

  const localUri = assetUrl.startsWith("file://")
    ? assetUrl
    : await downloadRemoteAsset(assetUrl);

  await MediaLibrary.saveToLibraryAsync(localUri);
  return localUri;
}

export async function shareAssetAsync(assetUrl: string) {
  const localUri = assetUrl.startsWith("file://")
    ? assetUrl
    : await downloadRemoteAsset(assetUrl);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri);
    return;
  }

  await Share.share({
    url: localUri,
    message: "Created with Veloura AI",
  });
}
