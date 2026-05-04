import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";

import type { TemplateReferenceMode } from "@/lib/types";

import type {
  RNMLKitFace,
  RNMLKitFaceDetectionResult,
  RNMLKitFaceDetector,
} from "@infinitered/react-native-mlkit-face-detection";

const MAX_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
const MIN_REFERENCE_SIDE = 360;
const MAX_REFERENCE_SIDE = 1600;

const HUMAN_PORTRAIT_THRESHOLDS = {
  minFaceWidthRatio: 0.18,
  minFaceHeightRatio: 0.22,
  cropWidthMultiplier: 2.8,
  cropHeightMultiplier: 3.8,
};

const HUMAN_CLOSEUP_THRESHOLDS = {
  minFaceWidthRatio: 0.26,
  minFaceHeightRatio: 0.32,
  cropWidthMultiplier: 2,
  cropHeightMultiplier: 2.6,
};

type PrepareReferenceImageOptions = {
  minSide?: number;
  referenceMode?: TemplateReferenceMode;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type PreparedReferenceSource = ImageDimensions & {
  uri: string;
};

type CropRegion = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

let faceDetectorPromise: Promise<RNMLKitFaceDetector | null> | null = null;

export class ReferenceImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceImageError";
  }
}

function getFileSize(uri: string) {
  try {
    return new File(uri).size;
  } catch {
    return 0;
  }
}

function isHumanReferenceMode(
  referenceMode: TemplateReferenceMode | undefined
): referenceMode is "human-portrait" | "human-closeup" {
  return (
    referenceMode === "human-portrait" || referenceMode === "human-closeup"
  );
}

function getResizeAction(width: number, height: number) {
  const maxSide = Math.max(width, height);

  if (!width || !height || maxSide <= MAX_REFERENCE_SIDE) {
    return [];
  }

  return width >= height
    ? [{ resize: { width: MAX_REFERENCE_SIDE } }]
    : [{ resize: { height: MAX_REFERENCE_SIDE } }];
}

function getFaceArea(face: RNMLKitFace) {
  return face.frame.size.x * face.frame.size.y;
}

function getCropThresholds(referenceMode: "human-portrait" | "human-closeup") {
  return referenceMode === "human-closeup"
    ? HUMAN_CLOSEUP_THRESHOLDS
    : HUMAN_PORTRAIT_THRESHOLDS;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

async function getFaceDetector() {
  if (Platform.OS === "web") {
    return null;
  }

  if (!faceDetectorPromise) {
    faceDetectorPromise = (async () => {
      const { RNMLKitFaceDetector } = await import(
        "@infinitered/react-native-mlkit-face-detection"
      );
      const detector = new RNMLKitFaceDetector(
        {
          performanceMode: "fast",
          minFaceSize: 0.08,
        },
        true
      );
      await detector.initialize();
      return detector;
    })().catch(() => null);
  }

  return faceDetectorPromise;
}

async function detectFacesInPhoto(
  imageUri: string
): Promise<RNMLKitFaceDetectionResult | undefined> {
  const detector = await getFaceDetector();

  if (!detector) {
    if (Platform.OS === "web") {
      return undefined;
    }

    throw new ReferenceImageError(
      "Face detection is unavailable in this build. Rebuild the app and try again."
    );
  }

  return detector.detectFaces(imageUri);
}

function selectPrimaryFace(faces: RNMLKitFace[]) {
  return [...faces].sort((left, right) => getFaceArea(right) - getFaceArea(left));
}

function validateDetectedFaces(
  faces: RNMLKitFace[],
  dimensions: ImageDimensions,
  referenceMode: "human-portrait" | "human-closeup"
) {
  const sortedFaces = selectPrimaryFace(faces);
  const primaryFace = sortedFaces[0];

  if (!primaryFace) {
    throw new ReferenceImageError("Use a clear photo with one visible face.");
  }

  const secondFace = sortedFaces[1];

  if (secondFace && getFaceArea(secondFace) >= getFaceArea(primaryFace) * 0.6) {
    throw new ReferenceImageError("Use a photo with one visible face.");
  }

  const thresholds = getCropThresholds(referenceMode);
  const faceWidthRatio = primaryFace.frame.size.x / dimensions.width;
  const faceHeightRatio = primaryFace.frame.size.y / dimensions.height;

  if (
    faceWidthRatio < thresholds.minFaceWidthRatio ||
    faceHeightRatio < thresholds.minFaceHeightRatio
  ) {
    throw new ReferenceImageError(
      referenceMode === "human-closeup"
        ? "Use a closer portrait photo with one clearly visible face."
        : "Use a portrait photo where the face fills more of the frame."
    );
  }

  return primaryFace;
}

function buildCropRegion(
  face: RNMLKitFace,
  dimensions: ImageDimensions,
  referenceMode: "human-portrait" | "human-closeup"
): CropRegion {
  const thresholds = getCropThresholds(referenceMode);
  const faceWidth = face.frame.size.x;
  const faceHeight = face.frame.size.y;
  const cropWidth = Math.min(
    dimensions.width,
    Math.round(faceWidth * thresholds.cropWidthMultiplier)
  );
  const cropHeight = Math.min(
    dimensions.height,
    Math.round(faceHeight * thresholds.cropHeightMultiplier)
  );
  const faceCenterX = face.frame.origin.x + faceWidth / 2;
  const faceCenterY = face.frame.origin.y + faceHeight * 0.62;
  const maxOriginX = Math.max(0, dimensions.width - cropWidth);
  const maxOriginY = Math.max(0, dimensions.height - cropHeight);
  const originX = clamp(
    Math.round(faceCenterX - cropWidth / 2),
    0,
    maxOriginX
  );
  const originY = clamp(
    Math.round(faceCenterY - cropHeight / 2),
    0,
    maxOriginY
  );

  return {
    originX,
    originY,
    width: Math.max(1, cropWidth),
    height: Math.max(1, cropHeight),
  };
}

async function manipulateReferenceImage(
  sourceUri: string,
  dimensions: ImageDimensions,
  compress: number,
  cropRegion?: CropRegion
) {
  const sourceDimensions = cropRegion
    ? {
        width: cropRegion.width,
        height: cropRegion.height,
      }
    : dimensions;

  return ImageManipulator.manipulateAsync(
    sourceUri,
    [
      ...(cropRegion ? [{ crop: cropRegion }] : []),
      ...getResizeAction(sourceDimensions.width, sourceDimensions.height),
    ],
    {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
}

async function normalizeReferenceSource(
  asset: ImagePickerAsset
): Promise<PreparedReferenceSource> {
  const fallbackWidth = asset.width ?? 0;
  const fallbackHeight = asset.height ?? 0;

  if (Platform.OS !== "android") {
    return {
      uri: asset.uri,
      width: fallbackWidth,
      height: fallbackHeight,
    };
  }

  const normalized = await ImageManipulator.manipulateAsync(
    asset.uri,
    [],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return {
    uri: normalized.uri,
    width: normalized.width || fallbackWidth,
    height: normalized.height || fallbackHeight,
  };
}

async function prepareHumanReferenceCrop(
  source: PreparedReferenceSource,
  referenceMode: "human-portrait" | "human-closeup"
) {
  if (!source.width || !source.height) {
    throw new ReferenceImageError("Could not read the uploaded image dimensions.");
  }

  const result = await detectFacesInPhoto(source.uri);

  if (!result || !result.success) {
    return undefined;
  }

  const primaryFace = validateDetectedFaces(
    result.faces,
    { width: source.width, height: source.height },
    referenceMode
  );

  return buildCropRegion(
    primaryFace,
    { width: source.width, height: source.height },
    referenceMode
  );
}

export async function prepareReferenceImage(
  asset: ImagePickerAsset,
  options: PrepareReferenceImageOptions = {}
) {
  const source = await normalizeReferenceSource(asset);
  const minReferenceSide = options.minSide ?? MIN_REFERENCE_SIDE;
  const referenceMode = options.referenceMode ?? "human-portrait";
  const baseDimensions = {
    width: source.width,
    height: source.height,
  };

  if (baseDimensions.width && baseDimensions.height) {
    const minSide = Math.min(baseDimensions.width, baseDimensions.height);

    if (minSide < minReferenceSide) {
      throw new ReferenceImageError(
        `Image is too small. Minimum side is ${minReferenceSide} px.`
      );
    }
  }

  const cropRegion =
    isHumanReferenceMode(referenceMode) && Platform.OS !== "web"
      ? await prepareHumanReferenceCrop(source, referenceMode)
      : undefined;

  let result = await manipulateReferenceImage(
    source.uri,
    baseDimensions,
    0.88,
    cropRegion
  );
  let size = getFileSize(result.uri);

  if (size > MAX_REFERENCE_IMAGE_BYTES) {
    result = await manipulateReferenceImage(
      result.uri,
      { width: result.width, height: result.height },
      0.72
    );
    size = getFileSize(result.uri);
  }

  if (size > MAX_REFERENCE_IMAGE_BYTES) {
    result = await manipulateReferenceImage(
      result.uri,
      { width: result.width, height: result.height },
      0.6
    );
    size = getFileSize(result.uri);
  }

  const minResultSide = Math.min(result.width, result.height);

  if (minResultSide < minReferenceSide) {
    throw new ReferenceImageError(
      `Image is too small. Minimum side is ${minReferenceSide} px.`
    );
  }

  if (size > MAX_REFERENCE_IMAGE_BYTES) {
    throw new ReferenceImageError("Choose a smaller image. Maximum upload size is 8 MB.");
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    size,
  };
}
