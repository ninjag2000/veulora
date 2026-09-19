import {
  isUnsafeNsfwProbability,
  parseNsfwProbability,
} from "../../../shared/content-safety.js";

const IMAGE_MODERATION_MODEL = "fal-ai/imageutils/nsfw";
const VIDEO_FRAME_EXTRACTION_MODEL = "fal-ai/ffmpeg-api/extract-frame";
const VIDEO_FRAME_TYPES = ["first", "middle", "last"] as const;
const DEFAULT_TIMEOUT_MS = 20_000;

export type ModerationDecision =
  | { status: "safe"; probability: number }
  | { status: "unsafe"; probability: number };

export type RunModel = (
  modelId: string,
  input: Record<string, unknown>,
) => Promise<unknown>;

export class ContentSafetyUnavailableError extends Error {
  readonly code = "CONTENT_SAFETY_UNAVAILABLE";

  constructor(
    message = "Safety checks are temporarily unavailable.",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ContentSafetyUnavailableError";
  }
}

function asMediaUrl(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function unwrapModelResult(result: unknown): unknown {
  if (!result || typeof result !== "object" || !("data" in result)) {
    return result;
  }

  const data = (result as { data?: unknown }).data;
  return data && typeof data === "object" ? data : result;
}

function getExtractedFrameUrl(result: unknown) {
  const payload = unwrapModelResult(result);
  if (!payload || typeof payload !== "object" || !("images" in payload)) {
    return null;
  }

  const images = (payload as { images?: unknown }).images;
  if (!Array.isArray(images)) {
    return null;
  }

  for (const image of images) {
    const url = asMediaUrl(
      image && typeof image === "object" && "url" in image
        ? (image as { url?: unknown }).url
        : null,
    );
    if (url) {
      return url;
    }
  }

  return null;
}

export function createFalRunModel(
  falKey: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): RunModel {
  const key = falKey.trim();

  return async (modelId, input) => {
    if (!key || !modelId.trim()) {
      throw new ContentSafetyUnavailableError();
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(
        `https://fal.run/${modelId.replace(/^\/+/, "")}`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new ContentSafetyUnavailableError();
      }

      try {
        return await response.json();
      } catch (error) {
        throw new ContentSafetyUnavailableError(undefined, { cause: error });
      }
    } catch (error) {
      if (error instanceof ContentSafetyUnavailableError) {
        throw error;
      }
      throw new ContentSafetyUnavailableError(undefined, { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function createContentModerator(runModel: RunModel) {
  if (typeof runModel !== "function") {
    throw new TypeError("runModel must be a function.");
  }

  async function callModel(
    modelId: string,
    input: Record<string, unknown>,
  ) {
    try {
      return await runModel(modelId, input);
    } catch (error) {
      if (error instanceof ContentSafetyUnavailableError) {
        throw error;
      }
      throw new ContentSafetyUnavailableError(undefined, { cause: error });
    }
  }

  async function moderateImageUrl(url: string): Promise<ModerationDecision> {
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

  async function extractVideoModerationFrames(url: string): Promise<string[]> {
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

    return [...new Set(frames as string[])];
  }

  async function moderateVideoUrl(url: string): Promise<ModerationDecision> {
    const frames = await extractVideoModerationFrames(url);
    const decisions = await Promise.all(frames.map(moderateImageUrl));
    const probability = Math.max(
      ...decisions.map((decision) => decision.probability),
    );

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
