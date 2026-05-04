import "dotenv/config";

import { File } from "node:buffer";
import cors from "cors";
import express from "express";
import multer from "multer";
import { fal } from "@fal-ai/client";

import { loadJobs, saveJobs } from "./job-store.js";
import {
  loadAccountCreditLots,
  saveAccountCreditLots,
} from "./account-credit-lots-store.js";

const PORT = Number(process.env.PORT ?? "8787") || 8787;
const FAL_KEY = process.env.FAL_KEY?.trim() ?? "";
const FAL_IDENTITY_IMAGE_MODEL =
  process.env.FAL_IDENTITY_IMAGE_MODEL?.trim() ?? "";
const FAL_IDENTITY_VIDEO_MODEL =
  process.env.FAL_IDENTITY_VIDEO_MODEL?.trim() ?? "";
const FAL_IDENTITY_VIDEO_ECONOMY_MODEL =
  process.env.FAL_IDENTITY_VIDEO_ECONOMY_MODEL?.trim() ?? "";
const FAL_PRO_IMAGE_TEXT_MODEL =
  process.env.FAL_PRO_IMAGE_TEXT_MODEL?.trim() ?? "";
const FAL_PRO_IMAGE_REFERENCE_MODEL =
  process.env.FAL_PRO_IMAGE_REFERENCE_MODEL?.trim() ?? "";
const FAL_PACK_IMAGE_TEXT_MODEL =
  process.env.FAL_PACK_IMAGE_TEXT_MODEL?.trim() ?? "";
const FAL_PACK_IMAGE_REFERENCE_MODEL =
  process.env.FAL_PACK_IMAGE_REFERENCE_MODEL?.trim() ?? "";
const FAL_PACK_MAX_OUTPUT_COUNT =
  process.env.FAL_PACK_MAX_OUTPUT_COUNT?.trim() ?? "";
const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_ECONOMY_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_OUTPUT_COUNT = 8;
const DEFAULT_PACK_MAX_OUTPUT_COUNT = 8;
const CREDIT_LOT_TTL_DAYS = 30;
const LOCAL_INITIAL_CREDITS = Number(process.env.LOCAL_INITIAL_CREDITS ?? "999") || 999;
const LOCAL_RESTORE_CREDITS = Number(process.env.LOCAL_RESTORE_CREDITS ?? "140") || 140;
const PHOTO_PACK_STALE_AFTER_MS = 12 * 60 * 1000;
const PHOTO_PACK_STALE_MESSAGE =
  "Photo session generation took too long. Please try again.";
const SUPPORTED_REFERENCE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
]);

const FAL_MODELS = {
  imageText: "fal-ai/kling-image/o3/text-to-image",
  imageReference: "fal-ai/kling-image/o3/image-to-image",
  imageTextPro: "fal-ai/nano-banana-2",
  imageReferencePro: "fal-ai/nano-banana-2/edit",
  imagePackTextDefault: "openai/gpt-image-2",
  imagePackReferenceDefault: "openai/gpt-image-2/edit",
  imageIdentityDefault: "fal-ai/omni-zero",
  videoText: "fal-ai/wan/v2.7/text-to-video",
  videoTextEconomy: "fal-ai/veo3.1/lite",
  videoReference: "fal-ai/wan-25-preview/image-to-video",
  videoReferenceEconomy: "fal-ai/veo3.1/lite/image-to-video",
  videoIdentityDefault: "fal-ai/pixverse/c1/reference-to-video",
  backgroundRemoval: "fal-ai/imageutils/rembg",
};

if (!FAL_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[server] Missing FAL_KEY. Set it in server/.env or environment variables."
  );
} else {
  fal.config({ credentials: FAL_KEY });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_REFERENCE_IMAGE_BYTES,
  },
});

// jobId (fal request_id) -> { modelId: string, mode: "image" | "video", createdAt: string, ...debug }
const jobs = loadJobs();
const accountCreditLots = loadAccountCreditLots();

function persistAccountCreditLots() {
  saveAccountCreditLots(accountCreditLots);
}

function getRequestAccountId(req) {
  return asNonEmptyString(req.get("x-account-id")) ?? "local-dev-account";
}

function getCreditLotExpiryIso(grantedAtIso) {
  const grantedAtMs = Date.parse(grantedAtIso);
  const fallbackMs = Date.now();
  const baseMs = Number.isFinite(grantedAtMs) ? grantedAtMs : fallbackMs;
  return new Date(baseMs + CREDIT_LOT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function getAccountLots(accountId) {
  const existing = accountCreditLots.get(accountId);
  return Array.isArray(existing) ? existing : [];
}

function setAccountLots(accountId, lots) {
  accountCreditLots.set(accountId, lots);
  persistAccountCreditLots();
}

function upsertEntitlementSeedLots(accountId) {
  const lots = getAccountLots(accountId);
  if (lots.length > 0 || LOCAL_INITIAL_CREDITS <= 0) {
    return;
  }

  grantCredits(accountId, LOCAL_INITIAL_CREDITS, "initial_seed", {
    seeded: true,
  });
}

function pruneExpiredLots(accountId) {
  const nowMs = Date.now();
  const lots = getAccountLots(accountId);
  let changed = false;

  const nextLots = lots.map((lot) => {
    const expiresAtMs = Date.parse(lot.expiresAt);
    if (!Number.isFinite(expiresAtMs) || lot.remainingCredits <= 0) {
      return lot;
    }

    if (expiresAtMs <= nowMs) {
      changed = true;
      return {
        ...lot,
        remainingCredits: 0,
      };
    }

    return lot;
  });

  if (changed) {
    setAccountLots(accountId, nextLots);
  }
}

function getCreditsSummary(accountId) {
  upsertEntitlementSeedLots(accountId);
  pruneExpiredLots(accountId);
  const lots = getAccountLots(accountId);

  const activeLots = lots
    .filter((lot) => lot.remainingCredits > 0)
    .sort(
      (a, b) =>
        Date.parse(a.expiresAt) - Date.parse(b.expiresAt) ||
        Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );

  return {
    currentCredits: activeLots.reduce((sum, lot) => sum + lot.remainingCredits, 0),
    nextExpiryAt: activeLots[0]?.expiresAt ?? null,
  };
}

function grantCredits(accountId, credits, source, metadata = {}) {
  if (!Number.isFinite(credits) || credits <= 0) {
    throw createHttpError(
      400,
      "INVALID_CREDIT_GRANT",
      "Credit grant must be greater than zero."
    );
  }

  const grantedAt = nowIso();
  const nextLots = [
    ...getAccountLots(accountId),
    {
      id: crypto.randomUUID(),
      source,
      grantedCredits: Math.floor(credits),
      remainingCredits: Math.floor(credits),
      grantedAt,
      expiresAt: getCreditLotExpiryIso(grantedAt),
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      createdAt: grantedAt,
    },
  ];

  setAccountLots(accountId, nextLots);
  return getCreditsSummary(accountId);
}

function consumeCredits(accountId, amount, source, metadata = {}) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createHttpError(
      400,
      "INVALID_CREDIT_CONSUME",
      "Credit consume amount must be greater than zero."
    );
  }

  upsertEntitlementSeedLots(accountId);
  pruneExpiredLots(accountId);

  const roundedAmount = Math.floor(amount);
  const lots = getAccountLots(accountId).map((lot) => ({ ...lot }));
  const orderedLots = [...lots].sort(
    (a, b) =>
      Date.parse(a.expiresAt) - Date.parse(b.expiresAt) ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
  const availableCredits = orderedLots.reduce(
    (sum, lot) => sum + Math.max(0, lot.remainingCredits),
    0
  );

  if (availableCredits < roundedAmount) {
    return {
      success: false,
      currentCredits: availableCredits,
      nextExpiryAt: orderedLots.find((lot) => lot.remainingCredits > 0)?.expiresAt ?? null,
    };
  }

  let remainingToConsume = roundedAmount;
  for (const lot of orderedLots) {
    if (remainingToConsume <= 0) {
      break;
    }
    if (lot.remainingCredits <= 0) {
      continue;
    }

    const take = Math.min(lot.remainingCredits, remainingToConsume);
    lot.remainingCredits -= take;
    remainingToConsume -= take;
  }

  const metadataObject =
    metadata && typeof metadata === "object" ? metadata : {};
  const nextLots = orderedLots.map((lot) => ({
    ...lot,
    metadata: {
      ...lot.metadata,
      lastConsumeSource: source,
      ...metadataObject,
    },
  }));
  setAccountLots(accountId, nextLots);

  const summary = getCreditsSummary(accountId);
  return {
    success: true,
    currentCredits: summary.currentCredits,
    nextExpiryAt: summary.nextExpiryAt,
  };
}

function rememberJob(jobId, modelId, mode, debug = {}) {
  jobs.set(jobId, { modelId, mode, createdAt: nowIso(), ...debug });
  saveJobs(jobs);
}

function updateJob(jobId, updater) {
  const current = jobs.get(jobId);
  if (!current || typeof current !== "object") {
    return null;
  }

  const next = updater(current);
  jobs.set(jobId, next);
  saveJobs(jobs);
  return next;
}

function getJobRecord(jobId) {
  const value = jobs.get(jobId);
  if (!value || typeof value !== "object") return null;
  if (!("modelId" in value) || typeof value.modelId !== "string") return null;
  return {
    modelId: value.modelId,
    activeJobId:
      typeof value.activeJobId === "string" && value.activeJobId.trim()
        ? value.activeJobId
        : jobId,
    mode: value.mode === "video" ? "video" : "image",
    retryCount:
      typeof value.retryCount === "number" && Number.isFinite(value.retryCount)
        ? value.retryCount
        : 0,
    requestContext:
      value.requestContext && typeof value.requestContext === "object"
        ? value.requestContext
        : null,
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : nowIso(),
  };
}

function normalizeReferenceMode(value) {
  return value === "human-closeup" || value === "human-portrait"
    ? value
    : "none";
}

function shouldExtractSubject(referenceMode) {
  return (
    referenceMode === "human-closeup" || referenceMode === "human-portrait"
  );
}

function ratioToKlingAspectRatio(ratio, fallbackAspectRatio) {
  switch (ratio) {
    case "1:1":
    case "3:4":
    case "9:16":
      return ratio;
    case "4:5":
      return "3:4";
    default:
      return fallbackAspectRatio;
  }
}

function ratioToWanAspectRatio(ratio) {
  switch (ratio) {
    case "1:1":
    case "3:4":
    case "4:3":
    case "9:16":
    case "16:9":
      return ratio;
    case "4:5":
      // WAN doesn't list 4:5; pick the closest portrait.
      return "3:4";
    default:
      return undefined;
  }
}

function ratioToVeoLiteAspectRatio(ratio) {
  return ratio === "16:9" ? "16:9" : "9:16";
}

function normalizeWan25Resolution(value, defaultResolution) {
  const resolution = asNonEmptyString(value)?.toLowerCase();
  const supportedImageToVideo = new Set(["480p", "720p", "1080p"]);

  return supportedImageToVideo.has(resolution) ? resolution : defaultResolution;
}

function normalizeWanTextResolution(value, defaultResolution) {
  const resolution = asNonEmptyString(value)?.toLowerCase();
  const supportedTextToVideo = new Set(["720p", "1080p"]);

  if (resolution === "480p") {
    return "720p";
  }

  return supportedTextToVideo.has(resolution) ? resolution : defaultResolution;
}

function normalizeImageOutputCount(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1;
  }

  return Math.max(1, Math.min(MAX_IMAGE_OUTPUT_COUNT, Math.floor(numericValue)));
}

function normalizeGenerationCost(value, mode, outputCount) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return Math.min(10_000, Math.floor(numericValue));
  }

  if (mode === "video") {
    return 25;
  }

  if (isPhotoPackRequest(mode, outputCount)) {
    return normalizeImageOutputCount(outputCount) * 4;
  }

  return 4;
}

function getRequestedOutputCount(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(numericValue));
}

function isPhotoPackRequest(mode, outputCount) {
  return mode === "image" && getRequestedOutputCount(outputCount) > 1;
}

function getPackMaxOutputCount() {
  const numericValue = Number(FAL_PACK_MAX_OUTPUT_COUNT);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_PACK_MAX_OUTPUT_COUNT;
  }

  return Math.max(1, Math.floor(numericValue));
}

function getPackModelId(hasReferenceImage) {
  return hasReferenceImage
    ? FAL_PACK_IMAGE_REFERENCE_MODEL || FAL_MODELS.imagePackReferenceDefault
    : FAL_PACK_IMAGE_TEXT_MODEL || FAL_MODELS.imagePackTextDefault;
}

function ensurePhotoPackConfiguration(mode, outputCount) {
  if (!isPhotoPackRequest(mode, outputCount)) {
    return;
  }

  const maxOutputCount = getPackMaxOutputCount();
  const requestedOutputCount = getRequestedOutputCount(outputCount);

  if (requestedOutputCount > maxOutputCount) {
    throw createHttpError(
      400,
      "PHOTO_PACK_OUTPUT_LIMIT_EXCEEDED",
      `Photo sessions currently support up to ${maxOutputCount} images.`
    );
  }

  const textModelId = getPackModelId(false);
  const referenceModelId = getPackModelId(true);

  if (!textModelId || !referenceModelId) {
    throw createHttpError(
      503,
      "PHOTO_PACK_MODEL_NOT_CONFIGURED",
      "Photo session generation is not configured yet. Try again later."
    );
  }
}

function isStalePhotoPackJob(record) {
  if (
    !record?.requestContext ||
    !isPhotoPackRequest(record.mode, record.requestContext.outputCount)
  ) {
    return false;
  }

  const createdAtMs = Date.parse(record.createdAt);
  if (!Number.isFinite(createdAtMs)) {
    return false;
  }

  return Date.now() - createdAtMs >= PHOTO_PACK_STALE_AFTER_MS;
}

function getLocalAccountTier() {
  return process.env.LOCAL_GENERATION_TIER?.trim().toLowerCase() === "pro"
    ? "pro"
    : "free";
}

function isGptImageModel(modelId) {
  return /gpt-image-2/i.test(modelId);
}

function ratioToGptImageSize(ratio) {
  switch (ratio) {
    case "1:1":
      return "square_hd";
    case "16:9":
      return "landscape_16_9";
    case "4:3":
      return "landscape_4_3";
    case "9:16":
      return "portrait_16_9";
    case "3:4":
      return "portrait_4_3";
    default:
      return {
        width: 1024,
        height: 1360,
      };
  }
}

function getStandardModelId(mode, tier, hasReferenceImage, outputCount = null) {
  if (mode === "image") {
    if (isPhotoPackRequest(mode, outputCount)) {
      return getPackModelId(hasReferenceImage);
    }

    if (hasReferenceImage) {
      return tier === "pro"
        ? FAL_PRO_IMAGE_REFERENCE_MODEL || FAL_MODELS.imageReferencePro
        : FAL_MODELS.imageReference;
    }

    return tier === "pro"
      ? FAL_PRO_IMAGE_TEXT_MODEL || FAL_MODELS.imageTextPro
      : FAL_MODELS.imageText;
  }

  if (hasReferenceImage) {
    return tier === "free"
      ? FAL_MODELS.videoReferenceEconomy
      : FAL_MODELS.videoReference;
  }

  return tier === "free" ? FAL_MODELS.videoTextEconomy : FAL_MODELS.videoText;
}

function getRequestedModelId(mode, tier, hasReferenceImage, outputCount, routing) {
  if (
    hasReferenceImage &&
    !isPhotoPackRequest(mode, outputCount) &&
    routing.referenceStrategy === "identity-first" &&
    routing.identityMode === "active"
  ) {
    return (
      getIdentityModelId(mode, tier) ??
      getStandardModelId(mode, tier, hasReferenceImage, outputCount)
    );
  }

  return getStandardModelId(mode, tier, hasReferenceImage, outputCount);
}

function isFluxImageModel(modelId) {
  return /flux/i.test(modelId);
}

function isNanoBananaImageModel(modelId) {
  return /nano-banana/i.test(modelId);
}

function ratioToNanoBananaAspectRatio(ratio, fallbackAspectRatio) {
  switch (ratio) {
    case "21:9":
    case "16:9":
    case "3:2":
    case "4:3":
    case "1:1":
    case "4:5":
    case "3:4":
    case "2:3":
    case "9:16":
      return ratio;
    default:
      return fallbackAspectRatio;
  }
}

function ratioToFluxAspectRatio(ratio, fallbackAspectRatio) {
  switch (ratio) {
    case "1:1":
    case "4:3":
    case "3:2":
    case "16:9":
    case "21:9":
    case "2:3":
    case "3:4":
    case "9:16":
    case "9:21":
      return ratio;
    case "4:5":
      return "3:4";
    default:
      return fallbackAspectRatio;
  }
}

function asNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function createHttpError(status, code, message, cause) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.cause = cause;
  return error;
}

function sendError(res, error, fallbackMessage, fallbackCode) {
  const status =
    typeof error?.status === "number" && error.status >= 400
      ? error.status
      : 502;
  const message =
    error instanceof Error && error.message ? error.message : fallbackMessage;
  const code =
    typeof error?.code === "string" && error.code.trim()
      ? error.code
      : fallbackCode;

  res.status(status).json({ message, code });
}

function requireFalKey() {
  if (!FAL_KEY) {
    throw createHttpError(
      503,
      "FAL_NOT_CONFIGURED",
      "fal.ai is not configured. Set FAL_KEY on the server."
    );
  }
}

function validateReferenceImage(file) {
  if (!file) {
    return;
  }

  if (!SUPPORTED_REFERENCE_MIME_TYPES.has(file.mimetype)) {
    throw createHttpError(
      400,
      "UNSUPPORTED_REFERENCE_IMAGE",
      "Reference image must be JPEG, PNG, WEBP, or BMP."
    );
  }
}

function validateTierReferenceImage(mode, tier, file) {
  if (mode !== "video" || tier !== "free" || !file) {
    return;
  }

  if (file.size > MAX_ECONOMY_REFERENCE_IMAGE_BYTES) {
    throw createHttpError(
      400,
      "REFERENCE_IMAGE_TOO_LARGE",
      "Reference image must be 8MB or smaller for the free video model."
    );
  }
}

async function uploadToFalStorage(file) {
  validateReferenceImage(file);
  const asFile = new File([file.buffer], file.originalname ?? "reference.jpg", {
    type: file.mimetype || "image/jpeg",
  });
  return await fal.storage.upload(asFile);
}

function getRemBgOutputUrl(result) {
  const candidate =
    result?.data?.image?.url ??
    result?.data?.url ??
    result?.image?.url ??
    result?.image_url;

  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

async function preprocessReferenceImageUrl(referenceImageUrl, referenceMode) {
  if (!referenceImageUrl || !shouldExtractSubject(referenceMode)) {
    return referenceImageUrl;
  }

  try {
    const result = await fal.run(FAL_MODELS.backgroundRemoval, {
      input: {
        image_url: referenceImageUrl,
        crop_to_bbox: true,
        output_format: "png",
      },
    });

    return getRemBgOutputUrl(result) ?? referenceImageUrl;
  } catch {
    return referenceImageUrl;
  }
}

function selectReferenceImageUrl(mode, originalReferenceImageUrl, processedReferenceImageUrl) {
  return mode === "image"
    ? originalReferenceImageUrl ?? processedReferenceImageUrl
    : processedReferenceImageUrl ?? originalReferenceImageUrl;
}

function getReferenceSource(
  referenceImageUrl,
  originalReferenceImageUrl,
  processedReferenceImageUrl
) {
  if (!referenceImageUrl) {
    return "none";
  }

  if (processedReferenceImageUrl && referenceImageUrl === processedReferenceImageUrl) {
    return "processed";
  }

  if (originalReferenceImageUrl && referenceImageUrl === originalReferenceImageUrl) {
    return "original";
  }

  return "none";
}

function getRetryReferenceImageUrl(requestContext) {
  if (requestContext.mode !== "image") {
    return (
      requestContext.processedReferenceImageUrl ??
      requestContext.originalReferenceImageUrl ??
      requestContext.referenceImageUrl
    );
  }

  if (
    requestContext.processedReferenceImageUrl &&
    requestContext.referenceImageUrl === requestContext.originalReferenceImageUrl
  ) {
    return requestContext.processedReferenceImageUrl;
  }

  return (
    requestContext.originalReferenceImageUrl ??
    requestContext.processedReferenceImageUrl ??
    requestContext.referenceImageUrl
  );
}

function getAlternateReferenceImageUrl(requestContext) {
  const currentReference = requestContext.referenceImageUrl;

  if (requestContext.mode === "image") {
    if (
      currentReference === requestContext.originalReferenceImageUrl &&
      requestContext.processedReferenceImageUrl
    ) {
      return requestContext.processedReferenceImageUrl;
    }

    return (
      requestContext.originalReferenceImageUrl ??
      requestContext.processedReferenceImageUrl ??
      currentReference
    );
  }

  if (
    currentReference === requestContext.processedReferenceImageUrl &&
    requestContext.originalReferenceImageUrl
  ) {
    return requestContext.originalReferenceImageUrl;
  }

  return (
    requestContext.processedReferenceImageUrl ??
    requestContext.originalReferenceImageUrl ??
    currentReference
  );
}

function getStandardReferenceImageUrl(requestContext) {
  return requestContext.mode === "image"
    ? (
      requestContext.originalReferenceImageUrl ??
      requestContext.processedReferenceImageUrl ??
      requestContext.referenceImageUrl
    )
    : (
      requestContext.processedReferenceImageUrl ??
      requestContext.originalReferenceImageUrl ??
      requestContext.referenceImageUrl
    );
}

function getIdentityModelId(mode, tier) {
  if (mode === "image") {
    return FAL_IDENTITY_IMAGE_MODEL || FAL_MODELS.imageIdentityDefault;
  }

  if (tier === "free") {
    return (
      FAL_IDENTITY_VIDEO_ECONOMY_MODEL ||
      FAL_IDENTITY_VIDEO_MODEL ||
      FAL_MODELS.videoIdentityDefault
    );
  }

  return FAL_IDENTITY_VIDEO_MODEL || FAL_MODELS.videoIdentityDefault;
}

function resolveReferenceRouting(mode, tier, referenceMode, hasReferenceImage) {
  if (!hasReferenceImage || !shouldExtractSubject(referenceMode)) {
    return {
      referenceStrategy: "standard",
      identityMode: "off",
    };
  }

  return getIdentityModelId(mode, tier)
    ? {
        referenceStrategy: "identity-first",
        identityMode: "active",
      }
    : {
        referenceStrategy: "identity-first",
        identityMode: "fallback",
      };
}

function getMaxGenerationRetries(requestContext) {
  if (requestContext.referenceStrategy !== "identity-first") {
    return 1;
  }

  return requestContext.identityMode === "active" ? 3 : 2;
}

function buildRetryPrompt(
  prompt,
  mode,
  referenceMode,
  referenceSource,
  referenceStrategy
) {
  const sceneInstruction =
    mode === "video"
      ? "Animate that same subject naturally inside the preset scene and motion."
      : "Generate that same subject naturally inside the preset scene and composition.";
  const framingInstruction =
    referenceMode === "human-closeup"
      ? "Keep the framing as a premium close-up portrait with a realistic human face."
      : "Keep the subject clearly readable as one realistic human person.";
  const sourceInstruction =
    referenceSource === "processed"
      ? "Use the extracted subject reference to reinforce identity while keeping the exact same face and person."
      : "Use the original uploaded photo as the primary identity anchor.";

  return [
    prompt.trim(),
    "Retry with stronger identity preservation.",
    referenceStrategy === "identity-first"
      ? "This is a likeness-critical request. Prioritize matching the exact same person over stylization."
      : "Keep the result anchored to the same person from the uploaded photo.",
    sourceInstruction,
    "Use the uploaded reference only as the subject anchor.",
    "Do not copy the original background, room, or clothing literally unless the preset explicitly requires it.",
    sceneInstruction,
    framingInstruction,
    "Keep the same facial structure, hairline, hair color, eyebrows, eyes, nose, lips, and age impression as the uploaded person.",
    "Do not turn the subject into a different beauty model, a lookalike, or a reshaped face with softened features.",
    "Do not change ethnicity, face shape, jawline, eye spacing, nose bridge, lip shape, or other identity-defining traits.",
    "Do not smooth away distinctive features, makeup choices, facial asymmetry, or hairstyle identity that make the person recognizable.",
    "Do not generate objects, mannequins, fabric sculptures, abstract forms, duplicate people, or distorted anatomy.",
  ].join(" ");
}

function buildIdentityImageRequest(
  prompt,
  outputCount,
  referenceImageUrl,
  compositionReferenceImageUrl,
  styleReferenceImageUrl
) {
  const numImages = normalizeImageOutputCount(outputCount);
  const compositionImageUrl = compositionReferenceImageUrl ?? referenceImageUrl;
  const styleImageUrl = styleReferenceImageUrl ?? compositionImageUrl;

  return {
    modelId: getIdentityModelId("image", "pro") ?? FAL_MODELS.imageIdentityDefault,
    resolution: "1K",
    input: {
      prompt,
      negative_prompt:
        "different person, lookalike, generic beauty model, beautified face, face reshaping, changed ethnicity, changed age, changed hairline, changed hair color",
      image_url: compositionImageUrl,
      composition_image_url: compositionImageUrl,
      style_image_url: styleImageUrl,
      identity_image_url: referenceImageUrl,
      image_strength: 0.8,
      composition_strength: 0.95,
      depth_strength: 0.45,
      style_strength: 0.85,
      face_strength: 1,
      identity_strength: 1,
      guidance_scale: 5,
      number_of_images: numImages,
    },
  };
}

function buildEditReferenceImageUrls(
  referenceImageUrl,
  compositionReferenceImageUrl,
  styleReferenceImageUrl
) {
  const imageUrls = [
    referenceImageUrl,
    compositionReferenceImageUrl,
    styleReferenceImageUrl,
  ].filter((value) => typeof value === "string" && value.trim().length > 0);

  return [...new Set(imageUrls)];
}

function buildIdentityVideoRequest(tier, prompt, ratio, resolution, referenceImageUrl) {
  const effectiveResolution =
    tier === "free" ? "720p" : normalizeWan25Resolution(resolution, "1080p");

  return {
    modelId: getIdentityModelId("video", tier) ?? FAL_MODELS.videoIdentityDefault,
    resolution: effectiveResolution,
    input: {
      prompt: `Use @character as the exact same person in this scene. ${prompt}`,
      aspect_ratio: ratioToWanAspectRatio(ratio) ?? "9:16",
      resolution: effectiveResolution,
      duration: tier === "free" ? 4 : 5,
      generate_audio_switch: false,
      image_references: [
        {
          ref_name: "character",
          image_url: referenceImageUrl,
          type: "subject",
        },
      ],
    },
  };
}

function nowIso() {
  return new Date().toISOString();
}

function getFalRequestId(response) {
  const requestId = response?.request_id ?? response?.requestId;

  if (typeof requestId !== "string" || !requestId.trim()) {
    throw createHttpError(
      502,
      "FAL_INVALID_RESPONSE",
      "fal.ai did not return a request id."
    );
  }

  return requestId;
}

async function submitFalJob(modelId, mode, input, debug, options = {}) {
  requireFalKey();
  const tier = options.tier ?? debug?.tier;
  const priority =
    options.priority ?? (tier === "free" ? "low" : tier === "pro" ? "normal" : undefined);
  const response = await fal.queue.submit(modelId, {
    input,
    ...(priority ? { priority } : {}),
  });
  const requestId = getFalRequestId(response);
  if (options.remember !== false) {
    rememberJob(requestId, modelId, mode, debug);
  }
  return requestId;
}

function buildFalRequest(
  mode,
  tier,
  prompt,
  ratio,
  resolution,
  outputCount,
  referenceImageUrl,
  styleReferenceImageUrl,
  compositionReferenceImageUrl,
  routing = { referenceStrategy: "standard", identityMode: "off" }
) {
  if (mode === "image") {
    const numImages = normalizeImageOutputCount(outputCount);
    const isPhotoPack = isPhotoPackRequest(mode, outputCount);
    const proReferenceModelId = FAL_PRO_IMAGE_REFERENCE_MODEL || FAL_MODELS.imageReferencePro;
    const proTextModelId = FAL_PRO_IMAGE_TEXT_MODEL || FAL_MODELS.imageTextPro;

    if (isPhotoPack) {
      const packModelId = getPackModelId(Boolean(referenceImageUrl));

      if (!packModelId) {
        throw createHttpError(
          503,
          "PHOTO_PACK_MODEL_NOT_CONFIGURED",
          "Photo session generation is not configured yet. Try again later."
        );
      }

      if (isGptImageModel(packModelId)) {
        if (referenceImageUrl) {
          return {
            modelId: packModelId,
            resolution: "1K",
            input: {
              prompt,
              image_urls: buildEditReferenceImageUrls(
                referenceImageUrl,
                compositionReferenceImageUrl,
                styleReferenceImageUrl
              ),
              image_size: ratioToGptImageSize(ratio),
              quality: "medium",
              num_images: numImages,
              output_format: "jpeg",
            },
          };
        }

        return {
          modelId: packModelId,
          resolution: "1K",
          input: {
            prompt,
            image_size: ratioToGptImageSize(ratio),
            quality: "medium",
            num_images: numImages,
            output_format: "jpeg",
          },
        };
      }

      const aspectRatio = ratioToNanoBananaAspectRatio(ratio, "9:16");

      if (referenceImageUrl) {
        return {
          modelId: packModelId,
          resolution: "1K",
          input: {
            prompt,
            image_urls: buildEditReferenceImageUrls(
              referenceImageUrl,
              compositionReferenceImageUrl,
              styleReferenceImageUrl
            ),
            resolution: "1K",
            num_images: numImages,
            aspect_ratio: aspectRatio,
            output_format: "jpeg",
          },
        };
      }

      return {
        modelId: packModelId,
        resolution: "1K",
        input: {
          prompt,
          resolution: "1K",
          num_images: numImages,
          aspect_ratio: aspectRatio,
          output_format: "jpeg",
        },
      };
    }

    if (referenceImageUrl) {
      if (routing.referenceStrategy === "identity-first" && routing.identityMode === "active") {
        return buildIdentityImageRequest(
          prompt,
          outputCount,
          referenceImageUrl,
          compositionReferenceImageUrl,
          styleReferenceImageUrl
        );
      }

      if (tier === "pro") {
        if (isFluxImageModel(proReferenceModelId)) {
          return {
            modelId: proReferenceModelId,
            resolution: "1K",
            input: {
              prompt,
              image_url: referenceImageUrl,
              image_prompt_strength: 0.18,
              aspect_ratio: ratioToFluxAspectRatio(ratio, "9:16"),
              num_images: numImages,
              output_format: "jpeg",
              enhance_prompt: true,
            },
          };
        }

        if (isNanoBananaImageModel(proReferenceModelId)) {
          const imageUrls = buildEditReferenceImageUrls(
            referenceImageUrl,
            compositionReferenceImageUrl,
            styleReferenceImageUrl
          );

          return {
            modelId: proReferenceModelId,
            resolution: "1K",
            input: {
              prompt,
              image_urls: imageUrls,
              resolution: "1K",
              num_images: numImages,
              aspect_ratio: ratioToNanoBananaAspectRatio(ratio, "auto"),
              output_format: "jpeg",
              limit_generations: true,
            },
          };
        }

        return {
          modelId: proReferenceModelId,
          resolution: "1K",
          input: {
            prompt,
            image_urls: [referenceImageUrl],
            resolution: "1K",
            result_type: "single",
            num_images: numImages,
            aspect_ratio: ratioToKlingAspectRatio(ratio, "auto"),
            output_format: "jpeg",
          },
        };
      }

      return {
        modelId: FAL_MODELS.imageReference,
        resolution: "1K",
        input: {
          prompt,
          image_urls: [referenceImageUrl],
          resolution: "1K",
          result_type: "single",
          num_images: numImages,
          aspect_ratio: ratioToKlingAspectRatio(ratio, "auto"),
          output_format: "jpeg",
        },
      };
    }

    if (tier === "pro") {
      if (isFluxImageModel(proTextModelId)) {
        return {
          modelId: proTextModelId,
          resolution: "1K",
          input: {
            prompt,
            num_images: numImages,
            aspect_ratio: ratioToFluxAspectRatio(ratio, "9:16"),
            output_format: "jpeg",
            enhance_prompt: true,
          },
        };
      }

      if (isNanoBananaImageModel(proTextModelId)) {
        return {
          modelId: proTextModelId,
          resolution: "1K",
          input: {
            prompt,
            resolution: "1K",
            num_images: numImages,
            aspect_ratio: ratioToNanoBananaAspectRatio(ratio, "9:16"),
            output_format: "jpeg",
            limit_generations: true,
          },
        };
      }

      return {
        modelId: proTextModelId,
        resolution: "1K",
        input: {
          prompt,
          resolution: "1K",
          result_type: "single",
          num_images: numImages,
          aspect_ratio: ratioToKlingAspectRatio(ratio, "9:16"),
          output_format: "jpeg",
        },
      };
    }

    return {
      modelId: FAL_MODELS.imageText,
      resolution: "1K",
      input: {
        prompt,
        resolution: "1K",
        result_type: "single",
        num_images: numImages,
        aspect_ratio: ratioToKlingAspectRatio(ratio, "9:16"),
        output_format: "jpeg",
      },
    };
  }

  if (referenceImageUrl) {
    if (routing.referenceStrategy === "identity-first" && routing.identityMode === "active") {
      return buildIdentityVideoRequest(tier, prompt, ratio, resolution, referenceImageUrl);
    }

    if (tier === "free") {
      return {
        modelId: FAL_MODELS.videoReferenceEconomy,
        resolution: "720p",
        input: {
          prompt,
          image_url: referenceImageUrl,
          aspect_ratio: "auto",
          duration: "4s",
          resolution: "720p",
          generate_audio: false,
          safety_tolerance: "4",
        },
      };
    }

    const effectiveResolution = normalizeWan25Resolution(resolution, "1080p");
    return {
      modelId: FAL_MODELS.videoReference,
      resolution: effectiveResolution,
      input: {
        prompt,
        image_url: referenceImageUrl,
        resolution: effectiveResolution,
        duration: "5",
        enable_prompt_expansion: true,
        enable_safety_checker: true,
      },
    };
  }

  if (tier === "free") {
    return {
      modelId: FAL_MODELS.videoTextEconomy,
      resolution: "720p",
      input: {
        prompt,
        aspect_ratio: ratioToVeoLiteAspectRatio(ratio),
        duration: "4s",
        resolution: "720p",
        generate_audio: false,
        safety_tolerance: "4",
      },
    };
  }

  const effectiveResolution = normalizeWanTextResolution(resolution, "1080p");

  return {
    modelId: FAL_MODELS.videoText,
    resolution: effectiveResolution,
    input: {
      prompt,
      aspect_ratio: ratioToWanAspectRatio(ratio) ?? "9:16",
      resolution: effectiveResolution,
      duration: 5,
      enable_prompt_expansion: true,
      enable_safety_checker: true,
    },
  };
}

function getOutputsFromFalResult(data) {
  const images = Array.isArray(data?.images) ? data.images : null;
  const imageUrls = images
    ? images.map((image) => image?.url).filter((url) => typeof url === "string")
    : [];
  const singleImageUrl = typeof data?.image?.url === "string" ? data.image.url : null;
  const videoUrl = data?.video?.url;

  if (imageUrls.length > 0) {
    return imageUrls;
  }

  if (singleImageUrl && singleImageUrl.trim()) {
    return [singleImageUrl];
  }

  return typeof videoUrl === "string" && videoUrl.trim() ? [videoUrl] : [];
}

function getPreviewUrl(data, outputs) {
  if (typeof data?.preview_url === "string" && data.preview_url.trim()) {
    return data.preview_url;
  }

  if (typeof data?.previewUrl === "string" && data.previewUrl.trim()) {
    return data.previewUrl;
  }

  return outputs[0] ?? undefined;
}

function buildFalInputError(error, fallbackCode, fallbackMessage) {
  if (typeof error?.status === "number" && error.status >= 400) {
    return error;
  }

  return createHttpError(
    502,
    fallbackCode,
    error instanceof Error ? error.message : fallbackMessage,
    error
  );
}

function getProviderErrorMessage(error) {
  return error instanceof Error && error.message
    ? error.message
    : "The provider could not process this generation.";
}

function isFalProviderValidationError(error) {
  const status = error?.status ?? error?.response?.status;
  const message = getProviderErrorMessage(error);

  return (
    (typeof status === "number" && status >= 400 && status < 500) ||
    /unprocessable entity|validation|invalid/i.test(message)
  );
}

async function retryGenerationJob(rootJobId, record, reason) {
  if (
    !record?.requestContext ||
    record.retryCount >= getMaxGenerationRetries(record.requestContext)
  ) {
    return null;
  }

  const {
    mode,
    tier,
    originalPrompt,
    referenceMode,
    ratio,
    resolution,
    outputCount,
    originalReferenceImageUrl,
    processedReferenceImageUrl,
    styleReferenceImageUrl,
    compositionReferenceImageUrl,
  } = record.requestContext;
  const nextRetryCount = (record.retryCount ?? 0) + 1;
  const retryReferenceImageUrl =
    record.requestContext.referenceStrategy === "identity-first"
      ? nextRetryCount === 1
        ? getRetryReferenceImageUrl(record.requestContext)
        : nextRetryCount === 2
        ? getAlternateReferenceImageUrl(record.requestContext)
        : getStandardReferenceImageUrl(record.requestContext)
      : getRetryReferenceImageUrl(record.requestContext);
  const nextRouting =
    record.requestContext.referenceStrategy === "identity-first" &&
    record.requestContext.identityMode === "active" &&
    nextRetryCount >= 3
      ? {
          referenceStrategy: "standard",
          identityMode: "fallback",
        }
      : {
          referenceStrategy: record.requestContext.referenceStrategy,
          identityMode: record.requestContext.identityMode,
        };
  const retryPrompt = buildRetryPrompt(
    originalPrompt ?? record.requestContext.prompt,
    mode,
    referenceMode,
    getReferenceSource(
      retryReferenceImageUrl,
      originalReferenceImageUrl,
      processedReferenceImageUrl
    ),
    nextRouting.referenceStrategy
  );
  const falRequest = buildFalRequest(
    mode,
    tier,
    retryPrompt,
    ratio,
    resolution,
    outputCount,
    retryReferenceImageUrl,
    styleReferenceImageUrl,
    compositionReferenceImageUrl,
    nextRouting
  );
  const nextFalJobId = await submitFalJob(
    falRequest.modelId,
    mode,
    falRequest.input,
    {},
    { remember: false, tier }
  );

  updateJob(rootJobId, (current) => ({
    ...current,
    modelId: falRequest.modelId,
    activeJobId: nextFalJobId,
    retryCount: nextRetryCount,
    requestedModelId:
      current.requestedModelId ??
      getRequestedModelId(
        mode,
        tier,
        Boolean(retryReferenceImageUrl),
        record.requestContext?.outputCount ?? null,
        nextRouting
      ),
    effectiveModelId: falRequest.modelId,
    resolution: falRequest.resolution,
    lastError: reason,
    requestContext: {
      ...record.requestContext,
      prompt: retryPrompt,
      referenceImageUrl: retryReferenceImageUrl,
      referenceSource: getReferenceSource(
        retryReferenceImageUrl,
        originalReferenceImageUrl,
        processedReferenceImageUrl
      ),
      referenceStrategy: nextRouting.referenceStrategy,
      identityMode: nextRouting.identityMode,
    },
  }));

  return {
    jobId: rootJobId,
    status: "processing",
    progressPercent: 65,
    currentStage: "Retrying generation",
    retryCount: nextRetryCount,
    debug: {
      referenceStrategy: nextRouting.referenceStrategy,
      identityMode: nextRouting.identityMode,
      referenceSource: getReferenceSource(
        retryReferenceImageUrl,
        originalReferenceImageUrl,
        processedReferenceImageUrl
      ),
      effectiveModelId: falRequest.modelId,
      activeJobId: nextFalJobId,
      lastError: reason,
    },
    updatedAt: nowIso(),
  };
}

// ---- Minimal app endpoints (so EXPO_PUBLIC_API_MODE=live works end-to-end) ----

app.get("/settings/bootstrap", (_req, res) => {
  // Keep this small on purpose; you can expand it later or drive it from a DB.
  res.json({
    brandName: "Veloura AI (local)",
    onboardingSlides: [],
    featuredBanner: {
      id: "featured",
      title: "Try generation",
      subtitle: "Local backend + fal.ai",
      imageUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
      ctaLabel: "Try now",
      presetId: "kling-o3",
      isPro: false,
    },
    imageSections: [
      {
        id: "images",
        title: "Images",
        layoutType: "hero",
        items: [
          {
            id: "kling-o3",
            title: "Text to Photo",
            subtitle: "fal-ai/kling-image/o3",
            description: "Generate an image from text (optional reference photo).",
            category: "Image",
            coverUrl:
              "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
            examples: [],
            modeType: "image",
            isPro: false,
            defaultPrompt: "Studio portrait, soft cinematic lighting, high detail.",
            generationCost: 2,
            inputRequirements: ["Prompt", "Optional reference photo"],
          },
        ],
      },
    ],
    videoSections: [
      {
        id: "videos",
        title: "Videos",
        items: [
          {
            id: "wan-v2.7",
            title: "Text to Video",
            subtitle: "fal-ai/wan/v2.7/text-to-video",
            description: "Generate a short video from text (optional reference photo).",
            category: "Video",
            coverUrl:
              "https://images.unsplash.com/photo-1508182314998-3bd49473002f?auto=format&fit=crop&w=1200&q=80",
            examples: [],
            previewVideoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            modeType: "video",
            isPro: false,
            defaultPrompt:
              "A fashion portrait comes to life with subtle head turn, hair movement, and soft camera push-in.",
            generationCost: 8,
            inputRequirements: ["Prompt", "Optional reference photo"],
            motionPreset: "wan",
          },
        ],
        seeAllSlug: "videos",
      },
    ],
    subscriptionPlans: [],
    paywallBenefits: [],
    paywallHeroAssets: [],
    exitOffer: {
      id: "exit",
      discountPercent: 0,
      planId: "none",
      title: "",
      oldPrice: "",
      newPrice: "",
      durationMs: 0,
    },
    photoGuidelines: {
      title: "Photo tips",
      goodTitle: "Use clear photos",
      badTitle: "Avoid",
      goodCriteria: ["One person", "Good lighting"],
      badCriteria: ["Blurry", "Multiple people"],
      goodExamples: [],
      badExamples: [],
    },
  });
});

app.get("/entitlements", (req, res) => {
  const accountId = getRequestAccountId(req);
  const isPro = getLocalAccountTier() === "pro";
  const summary = getCreditsSummary(accountId);
  res.json({
    isPro,
    currentCredits: summary.currentCredits,
    subscriptionPlan: isPro ? "local-pro" : null,
    dailyFreeRemaining: 999,
    nextExpiryAt: summary.nextExpiryAt,
  });
});

app.get("/history", (_req, res) => {
  res.json([]);
});

app.post("/restore-purchases", (req, res) => {
  const accountId = getRequestAccountId(req);
  const isPro = getLocalAccountTier() === "pro";
  const summary = grantCredits(
    accountId,
    LOCAL_RESTORE_CREDITS,
    "restore_purchases",
    { grantsPro: isPro }
  );
  res.json({
    isPro,
    currentCredits: summary.currentCredits,
    subscriptionPlan: isPro ? "local-pro" : null,
    dailyFreeRemaining: 999,
    nextExpiryAt: summary.nextExpiryAt,
  });
});

// ---- Generation endpoints expected by the app ----

app.post("/generation/image", upload.single("referenceImage"), async (req, res) => {
  try {
    const accountId = getRequestAccountId(req);
    const prompt = asNonEmptyString(req.body?.prompt);
    if (!prompt) {
      res.status(400).json({ message: "Missing prompt.", code: "MISSING_PROMPT" });
      return;
    }

    const ratio = asNonEmptyString(req.body?.ratio);
    const requestedOutputCount = req.body?.outputCount ?? req.body?.output_count;
    const styleReferenceUrl = asNonEmptyString(
      req.body?.styleReferenceUrl ?? req.body?.style_reference_url
    );
    const compositionReferenceUrl = asNonEmptyString(
      req.body?.compositionReferenceUrl ?? req.body?.composition_reference_url
    );
    const referenceMode = normalizeReferenceMode(req.body?.referenceMode);
    const referenceFile = req.file;
    const tier = getLocalAccountTier();
    const generationCost = normalizeGenerationCost(
      req.body?.generationCost ?? req.body?.generation_cost,
      "image",
      requestedOutputCount
    );
    ensurePhotoPackConfiguration("image", requestedOutputCount);
    validateTierReferenceImage("image", tier, referenceFile);
    const originalReferenceImageUrl = referenceFile
      ? await uploadToFalStorage(referenceFile)
      : null;
    const processedReferenceImageUrl = await preprocessReferenceImageUrl(
      originalReferenceImageUrl,
      referenceMode
    );
    const referenceImageUrl = selectReferenceImageUrl(
      "image",
      originalReferenceImageUrl,
      processedReferenceImageUrl
    );
    const routing = resolveReferenceRouting(
      "image",
      tier,
      referenceMode,
      Boolean(referenceImageUrl)
    );
    const requestedModelId = getRequestedModelId(
      "image",
      tier,
      Boolean(referenceImageUrl),
      requestedOutputCount,
      routing
    );
    const falRequest = buildFalRequest(
      "image",
      tier,
      prompt,
      ratio,
      undefined,
      requestedOutputCount,
      referenceImageUrl,
      styleReferenceUrl,
      compositionReferenceUrl,
      routing
    );
    const consumeResult = consumeCredits(accountId, generationCost, "generation_image", {
      mode: "image",
      outputCount: requestedOutputCount,
    });

    if (!consumeResult.success) {
      res.status(402).json({
        message: "Not enough credits. Please top up and try again.",
        code: "CREDIT_LIMIT_EXCEEDED",
      });
      return;
    }

    let requestId;
    try {
      requestId = await submitFalJob(falRequest.modelId, "image", falRequest.input, {
        tier,
        retryCount: 0,
        requestedModelId,
        effectiveModelId: falRequest.modelId,
        resolution: falRequest.resolution,
        requestContext: {
          mode: "image",
          tier,
          prompt,
          originalPrompt: prompt,
          referenceMode,
          ratio,
          resolution: null,
          outputCount: requestedOutputCount,
          generationCost,
          referenceImageUrl,
          originalReferenceImageUrl,
          processedReferenceImageUrl,
          styleReferenceImageUrl: styleReferenceUrl,
          compositionReferenceImageUrl: compositionReferenceUrl,
          referenceSource: getReferenceSource(
            referenceImageUrl,
            originalReferenceImageUrl,
            processedReferenceImageUrl
          ),
          referenceStrategy: routing.referenceStrategy,
          identityMode: routing.identityMode,
        },
      });
      updateJob(requestId, (current) => ({
        ...current,
        activeJobId: requestId,
      }));
    } catch (error) {
      grantCredits(accountId, generationCost, "generation_image_refund", {
        reason: "create_generation_failed",
      });
      throw error;
    }

    res.json({
      jobId: requestId,
      status: "queued",
      estimatedWaitSec: 25,
      historyItemId: `history_${requestId}`,
      effectiveTier: tier,
      effectiveModelId: falRequest.modelId,
      effectiveResolution: falRequest.resolution,
      retryCount: 0,
      debug: {
        referenceStrategy: routing.referenceStrategy,
        identityMode: routing.identityMode,
        referenceSource: getReferenceSource(
          referenceImageUrl,
          originalReferenceImageUrl,
          processedReferenceImageUrl
        ),
        effectiveModelId: falRequest.modelId,
        effectiveResolution: falRequest.resolution,
      },
    });
  } catch (error) {
    sendError(
      res,
      buildFalInputError(error, "FAL_IMAGE_GENERATION_FAILED", "Image generation failed."),
      "Image generation failed.",
      "FAL_IMAGE_GENERATION_FAILED"
    );
  }
});

app.post("/generation/video", upload.single("referenceImage"), async (req, res) => {
  try {
    const accountId = getRequestAccountId(req);
    const prompt = asNonEmptyString(req.body?.prompt);
    if (!prompt) {
      res.status(400).json({ message: "Missing prompt.", code: "MISSING_PROMPT" });
      return;
    }

    const ratio = asNonEmptyString(req.body?.ratio);
    const styleReferenceUrl = asNonEmptyString(
      req.body?.styleReferenceUrl ?? req.body?.style_reference_url
    );
    const compositionReferenceUrl = asNonEmptyString(
      req.body?.compositionReferenceUrl ?? req.body?.composition_reference_url
    );
    const referenceMode = normalizeReferenceMode(req.body?.referenceMode);
    const referenceFile = req.file;
    const tier = getLocalAccountTier();
    const generationCost = normalizeGenerationCost(
      req.body?.generationCost ?? req.body?.generation_cost,
      "video",
      null
    );
    validateTierReferenceImage("video", tier, referenceFile);
    const originalReferenceImageUrl = referenceFile
      ? await uploadToFalStorage(referenceFile)
      : null;
    const processedReferenceImageUrl = await preprocessReferenceImageUrl(
      originalReferenceImageUrl,
      referenceMode
    );
    const referenceImageUrl = selectReferenceImageUrl(
      "video",
      originalReferenceImageUrl,
      processedReferenceImageUrl
    );
    const routing = resolveReferenceRouting(
      "video",
      tier,
      referenceMode,
      Boolean(referenceImageUrl)
    );
    const requestedModelId = getRequestedModelId(
      "video",
      tier,
      Boolean(referenceImageUrl),
      null,
      routing
    );
    const falRequest = buildFalRequest(
      "video",
      tier,
      prompt,
      ratio,
      req.body?.resolution,
      undefined,
      referenceImageUrl,
      styleReferenceUrl,
      compositionReferenceUrl,
      routing
    );
    const consumeResult = consumeCredits(accountId, generationCost, "generation_video", {
      mode: "video",
    });

    if (!consumeResult.success) {
      res.status(402).json({
        message: "Not enough credits. Please top up and try again.",
        code: "CREDIT_LIMIT_EXCEEDED",
      });
      return;
    }

    let requestId;
    try {
      requestId = await submitFalJob(falRequest.modelId, "video", falRequest.input, {
        tier,
        retryCount: 0,
        requestedModelId,
        effectiveModelId: falRequest.modelId,
        resolution: falRequest.resolution,
        requestContext: {
          mode: "video",
          tier,
          prompt,
          originalPrompt: prompt,
          referenceMode,
          ratio,
          resolution: req.body?.resolution ?? null,
          outputCount: null,
          generationCost,
          referenceImageUrl,
          originalReferenceImageUrl,
          processedReferenceImageUrl,
          styleReferenceImageUrl: styleReferenceUrl,
          compositionReferenceImageUrl: compositionReferenceUrl,
          referenceSource: getReferenceSource(
            referenceImageUrl,
            originalReferenceImageUrl,
            processedReferenceImageUrl
          ),
          referenceStrategy: routing.referenceStrategy,
          identityMode: routing.identityMode,
        },
      });
      updateJob(requestId, (current) => ({
        ...current,
        activeJobId: requestId,
      }));
    } catch (error) {
      grantCredits(accountId, generationCost, "generation_video_refund", {
        reason: "create_generation_failed",
      });
      throw error;
    }

    res.json({
      jobId: requestId,
      status: "queued",
      estimatedWaitSec: 60,
      historyItemId: `history_${requestId}`,
      effectiveTier: tier,
      effectiveModelId: falRequest.modelId,
      effectiveResolution: falRequest.resolution,
      retryCount: 0,
      debug: {
        referenceStrategy: routing.referenceStrategy,
        identityMode: routing.identityMode,
        referenceSource: getReferenceSource(
          referenceImageUrl,
          originalReferenceImageUrl,
          processedReferenceImageUrl
        ),
        effectiveModelId: falRequest.modelId,
        effectiveResolution: falRequest.resolution,
      },
    });
  } catch (error) {
    sendError(
      res,
      buildFalInputError(error, "FAL_VIDEO_GENERATION_FAILED", "Video generation failed."),
      "Video generation failed.",
      "FAL_VIDEO_GENERATION_FAILED"
    );
  }
});

app.get("/generation/:jobId", async (req, res) => {
  try {
    requireFalKey();
    const jobId = req.params.jobId;
    const record = getJobRecord(jobId);
    if (!record) {
      res.status(404).json({ message: "Unknown jobId.", code: "UNKNOWN_JOB" });
      return;
    }

    const { modelId, mode, activeJobId } = record;
    const status = await fal.queue.status(modelId, {
      requestId: activeJobId,
      logs: false,
    });
    const queueStatus = status?.status;

    if (
      (queueStatus === "IN_PROGRESS" || queueStatus === "IN_QUEUE") &&
      isStalePhotoPackJob(record)
    ) {
      res.json({
        jobId,
        status: "failed",
        progressPercent: 0,
        currentStage: "Failed",
        errorMessage: PHOTO_PACK_STALE_MESSAGE,
        retryCount: record.retryCount ?? 0,
        debug: {
          referenceStrategy: record.requestContext?.referenceStrategy,
          identityMode: record.requestContext?.identityMode,
          referenceSource: record.requestContext?.referenceSource,
          effectiveModelId: record.effectiveModelId ?? modelId,
          activeJobId,
          lastError: PHOTO_PACK_STALE_MESSAGE,
        },
        updatedAt: nowIso(),
      });
      return;
    }

    if (queueStatus === "COMPLETED") {
      const result = await fal.queue.result(modelId, { requestId: activeJobId });
      const data = result?.data ?? {};
      const outputs = getOutputsFromFalResult(data);
      const previewUrl = getPreviewUrl(data, outputs);

      if (outputs.length === 0) {
        const retryResponse = await retryGenerationJob(
          jobId,
          record,
          "Provider returned an empty result."
        );

        if (retryResponse) {
          res.json(retryResponse);
          return;
        }
      }

      res.json({
        jobId,
        status: "completed",
        progressPercent: 100,
        currentStage: "Completed",
        previewUrl,
        outputs,
        outputUrls: outputs,
        output_urls: outputs,
        retryCount: record.retryCount ?? 0,
        debug: {
          referenceStrategy: record.requestContext?.referenceStrategy,
          identityMode: record.requestContext?.identityMode,
          referenceSource: record.requestContext?.referenceSource,
          effectiveModelId: record.effectiveModelId ?? modelId,
          activeJobId,
          lastError: record.lastError ?? undefined,
        },
        updatedAt: nowIso(),
      });
      return;
    }

    if (queueStatus === "IN_PROGRESS") {
      res.json({
        jobId,
        status: "processing",
        progressPercent: 55,
        currentStage: mode === "video" ? "Rendering your video" : "Generating your image",
        retryCount: record.retryCount ?? 0,
        debug: {
          referenceStrategy: record.requestContext?.referenceStrategy,
          identityMode: record.requestContext?.identityMode,
          referenceSource: record.requestContext?.referenceSource,
          effectiveModelId: record.effectiveModelId ?? modelId,
          activeJobId,
          lastError: record.lastError ?? undefined,
        },
        updatedAt: nowIso(),
      });
      return;
    }

    if (queueStatus === "IN_QUEUE") {
      res.json({
        jobId,
        status: "queued",
        progressPercent: 5,
        currentStage: "Queued",
        retryCount: record.retryCount ?? 0,
        debug: {
          referenceStrategy: record.requestContext?.referenceStrategy,
          identityMode: record.requestContext?.identityMode,
          referenceSource: record.requestContext?.referenceSource,
          effectiveModelId: record.effectiveModelId ?? modelId,
          activeJobId,
          lastError: record.lastError ?? undefined,
        },
        updatedAt: nowIso(),
      });
      return;
    }

    const retryResponse = await retryGenerationJob(
      jobId,
      record,
      `fal queue status: ${String(queueStatus ?? "unknown")}`
    );

    if (retryResponse) {
      res.json(retryResponse);
      return;
    }

    res.json({
      jobId,
      status: "failed",
      progressPercent: 0,
      currentStage: "Failed",
      errorMessage: `fal queue status: ${String(queueStatus ?? "unknown")}`,
      retryCount: record.retryCount ?? 0,
      debug: {
        referenceStrategy: record.requestContext?.referenceStrategy,
        identityMode: record.requestContext?.identityMode,
        referenceSource: record.requestContext?.referenceSource,
        effectiveModelId: record.effectiveModelId ?? modelId,
        activeJobId,
        lastError: record.lastError ?? undefined,
      },
      updatedAt: nowIso(),
    });
  } catch (error) {
    if (isFalProviderValidationError(error)) {
      const retryResponse = await retryGenerationJob(
        req.params.jobId,
        getJobRecord(req.params.jobId),
        getProviderErrorMessage(error)
      ).catch(() => null);

      if (retryResponse) {
        res.json(retryResponse);
        return;
      }

      res.json({
        jobId: req.params.jobId,
        status: "failed",
        progressPercent: 0,
        currentStage: "Failed",
        errorMessage: getProviderErrorMessage(error),
        retryCount: getJobRecord(req.params.jobId)?.retryCount ?? 0,
        debug: {
          referenceStrategy: getJobRecord(req.params.jobId)?.requestContext?.referenceStrategy,
          identityMode: getJobRecord(req.params.jobId)?.requestContext?.identityMode,
          referenceSource: getJobRecord(req.params.jobId)?.requestContext?.referenceSource,
          effectiveModelId: getJobRecord(req.params.jobId)?.effectiveModelId ?? undefined,
          activeJobId: getJobRecord(req.params.jobId)?.activeJobId ?? undefined,
          lastError: getJobRecord(req.params.jobId)?.lastError ?? undefined,
        },
        updatedAt: nowIso(),
      });
      return;
    }

    sendError(
      res,
      buildFalInputError(error, "FAL_STATUS_FAILED", "Status check failed."),
      "Status check failed.",
      "FAL_STATUS_FAILED"
    );
  }
});

app.use((error, _req, res, next) => {
  if (!error) {
    next();
    return;
  }

  if (error instanceof multer.MulterError) {
    const isSizeLimit = error.code === "LIMIT_FILE_SIZE";
    res.status(400).json({
      message: isSizeLimit
        ? "Reference image must be 10MB or smaller."
        : error.message,
      code: isSizeLimit ? "REFERENCE_IMAGE_TOO_LARGE" : "UPLOAD_FAILED",
    });
    return;
  }

  sendError(res, error, "Request failed.", "REQUEST_FAILED");
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`);
});
