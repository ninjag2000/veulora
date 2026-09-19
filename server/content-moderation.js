import {
  isUnsafeNsfwProbability,
  parseNsfwProbability,
} from "../shared/content-safety.js";

const IMAGE_MODERATION_MODEL = "fal-ai/imageutils/nsfw";
const VIDEO_FRAME_EXTRACTION_MODEL = "fal-ai/ffmpeg-api/extract-frame";
const VIDEO_FRAME_TYPES = Object.freeze(["first", "middle", "last"]);

export class ContentSafetyUnavailableError extends Error {
  constructor(message = "Safety checks are temporarily unavailable.", cause) {
    super(message, cause ? { cause } : undefined);
    this.name = "ContentSafetyUnavailableError";
    this.code = "CONTENT_SAFETY_UNAVAILABLE";
  }
}

function asMediaUrl(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function unwrapModelResult(result) {
  return result && typeof result === "object" && result.data && typeof result.data === "object"
    ? result.data
    : result;
}

function getExtractedFrameUrl(result) {
  const payload = unwrapModelResult(result);
  const images = payload && typeof payload === "object" ? payload.images : null;
  if (!Array.isArray(images)) {
    return null;
  }

  for (const image of images) {
    const url = asMediaUrl(image?.url);
    if (url) {
      return url;
    }
  }

  return null;
}

async function runFalModel(modelId, input) {
  const { fal } = await import("@fal-ai/client");
  return fal.subscribe(modelId, { input });
}

export function createContentModerator(runModel = runFalModel) {
  if (typeof runModel !== "function") {
    throw new TypeError("runModel must be a function.");
  }

  async function callModel(modelId, input) {
    try {
      return await runModel(modelId, input);
    } catch (error) {
      if (error instanceof ContentSafetyUnavailableError) {
        throw error;
      }
      throw new ContentSafetyUnavailableError(undefined, error);
    }
  }

  async function moderateImageUrl(url) {
    const imageUrl = asMediaUrl(url);
    if (!imageUrl) {
      throw new ContentSafetyUnavailableError();
    }

    const result = await callModel(IMAGE_MODERATION_MODEL, {
      image_url: imageUrl,
    });
    const probability = parseNsfwProbability(unwrapModelResult(result));
    if (probability === null) {
      throw new ContentSafetyUnavailableError();
    }

    return {
      status: isUnsafeNsfwProbability(probability) ? "unsafe" : "safe",
      probability,
    };
  }

  async function extractVideoModerationFrames(url) {
    const videoUrl = asMediaUrl(url);
    if (!videoUrl) {
      throw new ContentSafetyUnavailableError();
    }

    const results = await Promise.all(
      VIDEO_FRAME_TYPES.map((frameType) =>
        callModel(VIDEO_FRAME_EXTRACTION_MODEL, {
          video_url: videoUrl,
          frame_type: frameType,
        })
      ),
    );
    const frames = results.map(getExtractedFrameUrl);
    if (frames.some((frame) => !frame)) {
      throw new ContentSafetyUnavailableError();
    }

    return [...new Set(frames)];
  }

  async function moderateVideoUrl(url) {
    const frames = await extractVideoModerationFrames(url);
    const decisions = await Promise.all(frames.map(moderateImageUrl));
    const probability = Math.max(...decisions.map((decision) => decision.probability));

    return {
      status: decisions.some((decision) => decision.status === "unsafe")
        ? "unsafe"
        : "safe",
      probability,
    };
  }

  return {
    moderateImageUrl,
    extractVideoModerationFrames,
    moderateVideoUrl,
  };
}

export const {
  moderateImageUrl,
  extractVideoModerationFrames,
  moderateVideoUrl,
} = createContentModerator();
