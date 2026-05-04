import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

import { generateId, getFileExtension, isVideoAsset } from "@/lib/helpers";

const SAVE_ALBUM_NAME = "Veloura AI";

function isMissingMediaLibraryPermissionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /missing media_library permissions/i.test(error.message);
}

async function requestMediaLibraryAccess() {
  const permission = await MediaLibrary.requestPermissionsAsync(false, [
    "photo",
    "video",
  ]);

  if (!permission.granted) {
    throw new Error("Photo library permission is required.");
  }
}

async function saveLocalUriToAlbumOrLibrary(localUri: string) {
  try {
    const album = await MediaLibrary.getAlbumAsync(SAVE_ALBUM_NAME);

    if (album) {
      await MediaLibrary.createAssetAsync(localUri, album);
    } else {
      await MediaLibrary.createAlbumAsync(
        SAVE_ALBUM_NAME,
        undefined,
        undefined,
        localUri
      );
    }
  } catch (error) {
    if (isMissingMediaLibraryPermissionError(error)) {
      // Fallback for devices/builds where album read APIs are blocked
      // but direct save is still allowed.
      await MediaLibrary.saveToLibraryAsync(localUri);
    } else {
      throw error;
    }
  }
}

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
  await requestMediaLibraryAccess();

  const localUri = assetUrl.startsWith("file://")
    ? assetUrl
    : await downloadRemoteAsset(assetUrl);

  await saveLocalUriToAlbumOrLibrary(localUri);

  return localUri;
}

export async function saveAssetsToLibraryAsync(assetUrls: string[]) {
  const uniqueUrls = Array.from(
    new Set(assetUrls.map((url) => url.trim()).filter((url) => url.length > 0))
  );

  if (uniqueUrls.length === 0) {
    throw new Error("No assets available to save.");
  }

  await requestMediaLibraryAccess();

  const savedUris: string[] = [];
  for (const assetUrl of uniqueUrls) {
    const localUri = assetUrl.startsWith("file://")
      ? assetUrl
      : await downloadRemoteAsset(assetUrl);
    await saveLocalUriToAlbumOrLibrary(localUri);
    savedUris.push(localUri);
  }

  return savedUris;
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
