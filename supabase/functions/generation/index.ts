import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

type Mode = "image" | "video";
type AccountTier = "free" | "pro";
type ReferenceStrategy = "identity-first" | "standard";
type IdentityMode = "active" | "fallback" | "off";

type JobRecord = {
  job_id: string;
  active_job_id?: string | null;
  model_id: string;
  mode: Mode;
  account_id: string;
  created_at: string;
  tier?: AccountTier;
  requested_model_id?: string | null;
  effective_model_id?: string | null;
  resolution?: string | null;
  retry_count?: number | null;
  last_error?: string | null;
  request_payload?: JobRequestPayload | null;
};

type ReferenceMode = "none" | "human-portrait" | "human-closeup";
type ReferenceSource = "original" | "processed" | "none";
type PackFrameModelKind = "primary" | "fallback";

type PackPlanCurrentFrame = {
  index: number;
  modelId: string;
  modelKind: PackFrameModelKind;
  requestId: string;
  queueStatusUrl: string | null;
  queueResponseUrl: string | null;
  startedAt: string;
};

type PackPlan = {
  targetCount: number;
  completedOutputs: string[];
  pendingFrames: number[];
  currentFrame: PackPlanCurrentFrame | null;
  frameAttempts: Record<string, number>;
  lastFrameError: string | null;
};

type JobRequestPayload = {
  mode: Mode;
  tier: AccountTier;
  prompt: string;
  originalPrompt: string;
  referenceMode: ReferenceMode;
  ratio: string | null;
  resolution: string | null;
  outputCount: number | null;
  generationCost: number | null;
  referenceImageUrl: string | null;
  originalReferenceImageUrl: string | null;
  processedReferenceImageUrl: string | null;
  styleReferenceImageUrl: string | null;
  compositionReferenceImageUrl: string | null;
  referenceSource: ReferenceSource;
  referenceStrategy: ReferenceStrategy;
  identityMode: IdentityMode;
  queuePriority?: "low" | "normal";
  queueStatusUrl?: string | null;
  queueResponseUrl?: string | null;
  activeAttemptStartedAt?: string | null;
  packPlan?: PackPlan;
};

const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_ECONOMY_REFERENCE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_OUTPUT_COUNT = 8;
const DEFAULT_PACK_MAX_OUTPUT_COUNT = 8;
const MAX_GENERATION_RETRIES = 1;
const PACK_FRAME_MAX_ATTEMPTS = 6;
const RATE_LIMIT_MAX_STARTS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const IMAGE_STALE_AFTER_MS = 8 * 60 * 1000;
const VIDEO_STALE_AFTER_MS = 20 * 60 * 1000;
const GENERATION_STALE_MESSAGE =
  "Generation took too long. Please try again.";
const GENERATION_PROVIDER_FAILURE_MESSAGE =
  "Generation could not be completed. Please try again.";
const PHOTO_PACK_STALE_AFTER_MS = 30 * 60 * 1000;
const PHOTO_PACK_STALE_MESSAGE =
  "Photo session generation took too long. Please try again.";
const PHOTO_PACK_PROVIDER_FAILURE_MESSAGE =
  "Photo session could not be completed. Please try again.";
const FAL_QUEUE_BASE_URL = "https://queue.fal.run";
const REFERENCE_STORAGE_BUCKET = "generation-reference-images";
const REFERENCE_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

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
} as const;

const SUPPORTED_REFERENCE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-account-id, x-app-proxy-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isGenerationJobsSchemaError(error: unknown) {
  const candidate = error as {
    message?: string | null;
    details?: string | null;
    hint?: string | null;
    code?: string | null;
  };
  const haystack = [
    candidate.message,
    candidate.details,
    candidate.hint,
    candidate.code,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return /generation_jobs/i.test(haystack) &&
    (
      /schema cache/i.test(haystack) ||
      /could not find the '.*' column/i.test(haystack) ||
      /column .* does not exist/i.test(haystack) ||
      /PGRST204/i.test(haystack)
    );
}

function mapGenerationJobsError(error: unknown, fallbackCode: string) {
  if (isGenerationJobsSchemaError(error)) {
    return new HttpError(
      503,
      "BACKEND_SCHEMA_OUTDATED",
      "Generation backend is updating. Try again in a minute.",
    );
  }

  return new HttpError(502, fallbackCode, getErrorMessage(error, "Request failed."));
}

const env = {
  falKey: Deno.env.get("FAL_KEY")?.trim() ?? "",
  appProxyToken: Deno.env.get("APP_PROXY_TOKEN")?.trim() ?? "",
  supabaseUrl: Deno.env.get("SUPABASE_URL")?.trim() ?? "",
  supabaseServiceRoleKey:
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "",
  falIdentityImageModel:
    Deno.env.get("FAL_IDENTITY_IMAGE_MODEL")?.trim() ?? "",
  falIdentityVideoModel:
    Deno.env.get("FAL_IDENTITY_VIDEO_MODEL")?.trim() ?? "",
  falIdentityVideoEconomyModel:
    Deno.env.get("FAL_IDENTITY_VIDEO_ECONOMY_MODEL")?.trim() ?? "",
  falProImageTextModel:
    Deno.env.get("FAL_PRO_IMAGE_TEXT_MODEL")?.trim() ?? "",
  falProImageReferenceModel:
    Deno.env.get("FAL_PRO_IMAGE_REFERENCE_MODEL")?.trim() ?? "",
  falPackImageTextModel:
    Deno.env.get("FAL_PACK_IMAGE_TEXT_MODEL")?.trim() ?? "",
  falPackImageReferenceModel:
    Deno.env.get("FAL_PACK_IMAGE_REFERENCE_MODEL")?.trim() ?? "",
  falPackMaxOutputCount:
    Deno.env.get("FAL_PACK_MAX_OUTPUT_COUNT")?.trim() ?? "",
};

const supabase =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    validateServerConfig();
    validateProxyToken(req);

    const { route } = parseRoute(req.url);

    if (req.method === "POST" && route === "/image") {
      return json(await createGeneration(req, "image"));
    }

    if (req.method === "POST" && route === "/video") {
      return json(await createGeneration(req, "video"));
    }

    if (req.method === "GET" && route.startsWith("/")) {
      const jobId = decodeURIComponent(route.slice(1));
      if (!jobId) {
        throw new HttpError(404, "UNKNOWN_ROUTE", "Unknown generation route.");
      }
      return json(await pollGeneration(req, jobId));
    }

    throw new HttpError(404, "UNKNOWN_ROUTE", "Unknown generation route.");
  } catch (error) {
    return jsonError(error);
  }
});

function validateServerConfig() {
  if (!env.appProxyToken) {
    throw new HttpError(
      503,
      "APP_PROXY_TOKEN_NOT_CONFIGURED",
      "App proxy token is not configured.",
    );
  }

  if (!supabase) {
    throw new HttpError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Supabase service credentials are not configured.",
    );
  }
}

async function getFalKey() {
  const falKey = env.falKey || (await getVaultSecret("fal_ai_key"));

  if (!falKey) {
    throw new HttpError(
      503,
      "FAL_NOT_CONFIGURED",
      "fal.ai is not configured. Set FAL_KEY in Supabase secrets or fal_ai_key in Supabase Vault.",
    );
  }

  return falKey;
}

async function getVaultSecret(name: string) {
  if (name !== "fal_ai_key") {
    return "";
  }

  const { data, error } = await supabase!.rpc("get_fal_ai_key");

  if (error) {
    throw new HttpError(502, "VAULT_SECRET_LOOKUP_FAILED", error.message);
  }

  return typeof data === "string" ? data.trim() : "";
}

type FalQueueResponse = {
  request_id?: string;
  requestId?: string;
  status?: string;
  status_url?: string;
  statusUrl?: string;
  response_url?: string;
  responseUrl?: string;
  queue_position?: number;
  logs?: Array<{ message?: string }>;
  metrics?: Record<string, unknown>;
  data?: Record<string, unknown>;
  error?: string;
  error_type?: string;
  detail?: string;
};

type CreditConsumeRpcRow = {
  success: boolean | null;
  consumed_credits: number | null;
  current_credits: number | null;
  next_expiry: string | null;
};

async function readFalQueueJson(response: Response, fallbackMessage: string) {
  const rawText = await response.text();
  let payload: FalQueueResponse = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as FalQueueResponse;
    } catch {
      payload = {};
    }
  }

  if (response.ok) {
    return payload;
  }

  const message =
    payload.detail ??
    payload.error ??
    payload.error_type ??
    (rawText || fallbackMessage);
  const error = new Error(message) as Error & {
    status?: number;
    response?: { status?: number };
    errorType?: string;
  };
  error.status = response.status;
  error.response = { status: response.status };
  error.errorType = payload.error_type;
  throw error;
}

async function falQueueSubmit(
  modelId: string,
  input: Record<string, unknown>,
  priority: "low" | "normal",
) {
  const falKey = await getFalKey();

  return await readFalQueueJson(
    await fetch(`${FAL_QUEUE_BASE_URL}/${modelId}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
        "X-Fal-Queue-Priority": priority,
      },
      body: JSON.stringify(input),
    }),
    "Failed to submit the generation request.",
  );
}

function getQueuePriority(
  mode: Mode,
  tier: AccountTier,
): "low" | "normal" {
  if (mode === "image") {
    return "normal";
  }

  return tier === "pro" ? "normal" : "low";
}

async function falQueueStatus(modelId: string, requestId: string, logs = false) {
  const falKey = await getFalKey();

  return await readFalQueueJson(
    await fetch(
      `${FAL_QUEUE_BASE_URL}/${modelId}/requests/${encodeURIComponent(requestId)}/status${
        logs ? "?logs=1" : ""
      }`,
      {
        method: "GET",
        headers: {
          Authorization: `Key ${falKey}`,
        },
      },
    ),
    "Failed to fetch the generation status.",
  );
}

async function falQueueResult(modelId: string, requestId: string) {
  const falKey = await getFalKey();

  return await readFalQueueJson(
    await fetch(
      `${FAL_QUEUE_BASE_URL}/${modelId}/requests/${encodeURIComponent(requestId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Key ${falKey}`,
        },
      },
    ),
    "Failed to fetch the generation result.",
  );
}

function resolveFalQueueUrl(candidate: string) {
  try {
    const base = new URL(FAL_QUEUE_BASE_URL);
    const resolved = new URL(candidate, `${base.origin}/`);

    if (resolved.host !== base.host) {
      return null;
    }

    return resolved.toString();
  } catch {
    return null;
  }
}

function normalizeFalQueueStatusUrl(candidate: string | null) {
  if (!candidate) {
    return null;
  }

  const resolved = resolveFalQueueUrl(candidate);
  if (!resolved) {
    return null;
  }

  try {
    const parsed = new URL(resolved);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");

    if (/\/requests\/[^/]+\/status$/.test(normalizedPath)) {
      return resolveFalQueueUrl(parsed.toString());
    }

    if (/\/requests\/[^/]+$/.test(normalizedPath)) {
      parsed.pathname = `${normalizedPath}/status`;
      return resolveFalQueueUrl(parsed.toString());
    }

    return resolveFalQueueUrl(parsed.toString());
  } catch {
    return null;
  }
}

function normalizeFalQueueResponseUrl(candidate: string | null) {
  if (!candidate) {
    return null;
  }

  const resolved = resolveFalQueueUrl(candidate);
  if (!resolved) {
    return null;
  }

  try {
    const parsed = new URL(resolved);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");

    if (/\/requests\/[^/]+\/response$/.test(normalizedPath)) {
      return resolveFalQueueUrl(parsed.toString());
    }

    if (/\/requests\/[^/]+\/status$/.test(normalizedPath)) {
      parsed.pathname = normalizedPath.replace(/\/status$/, "/response");
      return resolveFalQueueUrl(parsed.toString());
    }

    if (/\/requests\/[^/]+$/.test(normalizedPath)) {
      return resolveFalQueueUrl(parsed.toString());
    }

    return resolveFalQueueUrl(parsed.toString());
  } catch {
    return null;
  }
}

function buildFalQueueResponseUrlCandidates(responseUrl: string) {
  const primary = normalizeFalQueueResponseUrl(responseUrl);
  if (!primary) {
    return [];
  }

  const candidates = [primary];

  try {
    const parsed = new URL(primary);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");

    if (/\/requests\/[^/]+\/response$/.test(normalizedPath)) {
      parsed.pathname = normalizedPath.replace(/\/response$/, "");
      const alternate = resolveFalQueueUrl(parsed.toString());
      if (alternate) {
        candidates.push(alternate);
      }
    } else if (/\/requests\/[^/]+$/.test(normalizedPath)) {
      parsed.pathname = `${normalizedPath}/response`;
      const alternate = resolveFalQueueUrl(parsed.toString());
      if (alternate) {
        candidates.push(alternate);
      }
    }
  } catch {
    // ignore malformed alternate construction; primary candidate remains.
  }

  return [...new Set(candidates)];
}

function getQueueStatusUrlFromResponse(response: unknown) {
  const candidate = response as {
    status_url?: unknown;
    statusUrl?: unknown;
    response_url?: unknown;
    responseUrl?: unknown;
  };
  const directStatusUrl = normalizeFalQueueStatusUrl(asNonEmptyString(
    candidate.status_url ?? candidate.statusUrl,
  ));

  if (directStatusUrl) {
    return directStatusUrl;
  }

  const responseUrl = getQueueResponseUrlFromResponse(response);
  if (!responseUrl) {
    return null;
  }

  return normalizeFalQueueStatusUrl(responseUrl);
}

function getQueueResponseUrlFromResponse(response: unknown) {
  const candidate = response as {
    response_url?: unknown;
    responseUrl?: unknown;
    status_url?: unknown;
    statusUrl?: unknown;
  };
  const responseUrl = normalizeFalQueueResponseUrl(asNonEmptyString(
    candidate.response_url ?? candidate.responseUrl,
  ));
  if (responseUrl) {
    return responseUrl;
  }

  return normalizeFalQueueResponseUrl(asNonEmptyString(
    candidate.status_url ?? candidate.statusUrl,
  ));
}

async function falQueueStatusByUrl(statusUrl: string, logs = false) {
  const falKey = await getFalKey();
  const resolvedStatusUrl = normalizeFalQueueStatusUrl(statusUrl);

  if (!resolvedStatusUrl) {
    throw new HttpError(
      502,
      "FAL_INVALID_STATUS_URL",
      "fal.ai returned an invalid status URL.",
    );
  }

  const parsedStatusUrl = new URL(resolvedStatusUrl);
  if (logs) {
    parsedStatusUrl.searchParams.set("logs", "1");
  } else {
    parsedStatusUrl.searchParams.delete("logs");
  }

  return await readFalQueueJson(
    await fetch(parsedStatusUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Key ${falKey}`,
      },
    }),
    "Failed to fetch the generation status.",
  );
}

async function falQueueResultByUrl(responseUrl: string) {
  const falKey = await getFalKey();
  const responseUrlCandidates = buildFalQueueResponseUrlCandidates(responseUrl);

  if (responseUrlCandidates.length === 0) {
    throw new HttpError(
      502,
      "FAL_INVALID_RESPONSE_URL",
      "fal.ai returned an invalid response URL.",
    );
  }

  let lastError: unknown = null;

  for (const candidate of responseUrlCandidates) {
    try {
      return await readFalQueueJson(
        await fetch(candidate, {
          method: "GET",
          headers: {
            Authorization: `Key ${falKey}`,
          },
        }),
        "Failed to fetch the generation result.",
      );
    } catch (error) {
      const status = getProviderErrorStatus(error);
      if (typeof status === "number" && status >= 400 && status < 500 && status !== 404 && status !== 405) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError ?? new HttpError(
    502,
    "FAL_RESULT_LOOKUP_FAILED",
    "Failed to fetch the generation result.",
  );
}

function validateProxyToken(req: Request) {
  const token = req.headers.get("x-app-proxy-token")?.trim() ?? "";

  if (!token || token !== env.appProxyToken) {
    throw new HttpError(401, "INVALID_APP_PROXY_TOKEN", "Unauthorized.");
  }
}

function parseRoute(url: string) {
  const pathname = new URL(url).pathname;
  const marker = "/generation";
  const index = pathname.indexOf(marker);
  const route = index >= 0 ? pathname.slice(index + marker.length) || "/" : pathname;
  return { pathname, route };
}

function normalizeReferenceMode(value: unknown): ReferenceMode {
  return value === "human-portrait" || value === "human-closeup"
    ? value
    : "none";
}

function shouldExtractSubject(referenceMode: ReferenceMode) {
  return referenceMode === "human-portrait" || referenceMode === "human-closeup";
}

function getRemBgOutputUrl(result: unknown) {
  const value = result as {
    data?: {
      image?: { url?: string | null };
      url?: string | null;
    };
    image?: { url?: string | null };
    image_url?: string | null;
  };

  return (
    value.data?.image?.url ??
    value.data?.url ??
    value.image?.url ??
    value.image_url ??
    null
  );
}

async function preprocessReferenceImageUrl(
  referenceImageUrl: string | null,
  referenceMode: ReferenceMode,
) {
  void referenceMode;
  return referenceImageUrl;
}

function selectReferenceImageUrl(
  mode: Mode,
  originalReferenceImageUrl: string | null,
  processedReferenceImageUrl: string | null,
) {
  return mode === "image"
    ? originalReferenceImageUrl ?? processedReferenceImageUrl
    : processedReferenceImageUrl ?? originalReferenceImageUrl;
}

function getReferenceSource(
  referenceImageUrl: string | null,
  originalReferenceImageUrl: string | null,
  processedReferenceImageUrl: string | null,
): ReferenceSource {
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

function getRetryReferenceImageUrl(payload: JobRequestPayload) {
  if (payload.mode !== "image") {
    return payload.processedReferenceImageUrl ??
      payload.originalReferenceImageUrl ??
      payload.referenceImageUrl;
  }

  if (
    payload.processedReferenceImageUrl &&
    payload.referenceImageUrl === payload.originalReferenceImageUrl
  ) {
    return payload.processedReferenceImageUrl;
  }

  return payload.originalReferenceImageUrl ??
    payload.processedReferenceImageUrl ??
    payload.referenceImageUrl;
}

function getAlternateReferenceImageUrl(payload: JobRequestPayload) {
  const currentReference = payload.referenceImageUrl;

  if (payload.mode === "image") {
    if (
      currentReference === payload.originalReferenceImageUrl &&
      payload.processedReferenceImageUrl
    ) {
      return payload.processedReferenceImageUrl;
    }

    return payload.originalReferenceImageUrl ??
      payload.processedReferenceImageUrl ??
      currentReference;
  }

  if (
    currentReference === payload.processedReferenceImageUrl &&
    payload.originalReferenceImageUrl
  ) {
    return payload.originalReferenceImageUrl;
  }

  return payload.processedReferenceImageUrl ??
    payload.originalReferenceImageUrl ??
    currentReference;
}

function getStandardReferenceImageUrl(payload: JobRequestPayload) {
  return payload.mode === "image"
    ? payload.originalReferenceImageUrl ??
        payload.processedReferenceImageUrl ??
        payload.referenceImageUrl
    : payload.processedReferenceImageUrl ??
        payload.originalReferenceImageUrl ??
        payload.referenceImageUrl;
}

function getIdentityModelId(mode: Mode, tier: AccountTier) {
  if (mode === "image") {
    return env.falIdentityImageModel || FAL_MODELS.imageIdentityDefault;
  }

  if (tier === "free") {
    return env.falIdentityVideoEconomyModel || env.falIdentityVideoModel ||
      FAL_MODELS.videoIdentityDefault;
  }

  return env.falIdentityVideoModel || FAL_MODELS.videoIdentityDefault;
}

function resolveReferenceRouting(
  mode: Mode,
  tier: AccountTier,
  referenceMode: ReferenceMode,
  hasReferenceImage: boolean,
): { referenceStrategy: ReferenceStrategy; identityMode: IdentityMode } {
  if (mode === "image") {
    void tier;
    void referenceMode;
    return {
      referenceStrategy: "standard",
      identityMode: "off",
    };
  }

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

function getMaxGenerationRetries(payload: JobRequestPayload) {
  if (payload.mode === "image") {
    return 0;
  }

  if (payload.referenceStrategy !== "identity-first") {
    return 1;
  }

  return payload.identityMode === "active" ? 3 : 2;
}

function buildRetryPrompt(
  prompt: string,
  mode: Mode,
  referenceMode: ReferenceMode,
  referenceSource: ReferenceSource,
  referenceStrategy: ReferenceStrategy,
) {
  const sceneInstruction = mode === "video"
    ? "Animate that same subject naturally inside the preset scene and motion."
    : "Generate that same subject naturally inside the preset scene and composition.";
  const framingInstruction = referenceMode === "human-closeup"
    ? "Keep the framing as a premium close-up portrait with a realistic human face."
    : "Keep the subject clearly readable as one realistic human person.";
  const sourceInstruction = referenceSource === "processed"
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
  prompt: string,
  outputCount: number | null,
  referenceImageUrl: string,
  compositionReferenceImageUrl: string | null,
  styleReferenceImageUrl: string | null,
) {
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
      number_of_images: normalizeImageOutputCount(outputCount),
    },
  };
}

function buildEditReferenceImageUrls(
  referenceImageUrl: string,
  compositionReferenceImageUrl: string | null,
  styleReferenceImageUrl: string | null,
) {
  const imageUrls = [
    referenceImageUrl,
    compositionReferenceImageUrl,
    styleReferenceImageUrl,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return [...new Set(imageUrls)];
}

function buildPhotoPackSingleFramePrompt(
  prompt: string,
  frameIndex: number,
  targetCount: number,
) {
  const frameNumber = frameIndex + 1;

  return [
    prompt.trim(),
    `This request is only for frame ${frameNumber} of ${targetCount}.`,
    "Generate exactly one standalone full-frame photograph for this frame.",
    "Return one final image only, as a single camera capture.",
    "Do not summarize the whole session in one image.",
    "Do not combine multiple angles, moments, or scenes in one output.",
    "Do not create montages, moodboards, or storyboard compositions.",
    "Do not create collages, contact sheets, grids, diptychs, split screens, or multiple panels in a single output image.",
    "Do not place multiple mini-photos, frames, borders, or storyboard layouts inside one image.",
    "Do not include dividing lines, tiles, frames, or image-within-image compositions.",
    "No multi-view board, no before-after board, no magazine layout.",
    "No text overlays, labels, or watermarks.",
    "Output must look like a normal single photo from one camera position.",
  ].join(" ");
}

function getRequestedOutputCount(value: number | null) {
  if (!value || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function isPhotoPackRequest(mode: Mode, outputCount: number | null) {
  return mode === "image" && getRequestedOutputCount(outputCount) > 1;
}

function getPackMaxOutputCount() {
  const value = Number(env.falPackMaxOutputCount);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_PACK_MAX_OUTPUT_COUNT;
  }

  return Math.max(1, Math.floor(value));
}

function getPackModelId(hasReferenceImage: boolean) {
  return hasReferenceImage
    ? env.falPackImageReferenceModel || FAL_MODELS.imagePackReferenceDefault
    : env.falPackImageTextModel || FAL_MODELS.imagePackTextDefault;
}

function getPackTargetCount(outputCount: number | null) {
  return Math.min(normalizeImageOutputCount(outputCount), getPackMaxOutputCount());
}

function getPackFallbackModelId(hasReferenceImage: boolean) {
  return hasReferenceImage
    ? env.falProImageReferenceModel || FAL_MODELS.imageReferencePro
    : env.falProImageTextModel || FAL_MODELS.imageTextPro;
}

function createInitialPackPlan(targetCount: number): PackPlan {
  return {
    targetCount,
    completedOutputs: [],
    pendingFrames: Array.from({ length: targetCount }, (_, index) => index),
    currentFrame: null,
    frameAttempts: {},
    lastFrameError: null,
  };
}

function isPackOrchestrationPayload(
  payload: JobRequestPayload | null | undefined,
): payload is JobRequestPayload & { packPlan: PackPlan } {
  if (!payload || !isPhotoPackRequest(payload.mode, payload.outputCount)) {
    return false;
  }

  const packPlan = payload.packPlan;
  return Boolean(
    packPlan &&
      typeof packPlan.targetCount === "number" &&
      Array.isArray(packPlan.completedOutputs) &&
      Array.isArray(packPlan.pendingFrames) &&
      typeof packPlan.frameAttempts === "object",
  );
}

function getFrameAttemptCount(packPlan: PackPlan, frameIndex: number) {
  const value = packPlan.frameAttempts[String(frameIndex)];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function ensurePhotoPackConfiguration(mode: Mode, outputCount: number | null) {
  if (!isPhotoPackRequest(mode, outputCount)) {
    return;
  }

  const textModelId = getPackModelId(false);
  const referenceModelId = getPackModelId(true);

  if (!textModelId || !referenceModelId) {
    throw new HttpError(
      503,
      "PHOTO_PACK_MODEL_NOT_CONFIGURED",
      "Photo session generation is not configured yet. Try again later.",
    );
  }
}

function getStaleGenerationMessage(
  mode: Mode,
  payload: JobRequestPayload | null | undefined,
  createdAt: string,
) {
  const baselineTimestamp =
    (typeof payload?.activeAttemptStartedAt === "string" && payload.activeAttemptStartedAt.trim()) ||
    createdAt;
  const baselineMs = Date.parse(baselineTimestamp);
  if (!Number.isFinite(baselineMs)) {
    return null;
  }

  if (payload && isPhotoPackRequest(payload.mode, payload.outputCount)) {
    return Date.now() - baselineMs >= PHOTO_PACK_STALE_AFTER_MS
      ? PHOTO_PACK_STALE_MESSAGE
      : null;
  }

  const staleAfterMs = mode === "video" ? VIDEO_STALE_AFTER_MS : IMAGE_STALE_AFTER_MS;

  return Date.now() - baselineMs >= staleAfterMs
    ? GENERATION_STALE_MESSAGE
    : null;
}

function getProviderFailureMessage(
  mode: Mode,
  payload: JobRequestPayload | null | undefined,
) {
  if (payload && isPhotoPackRequest(payload.mode, payload.outputCount)) {
    return PHOTO_PACK_PROVIDER_FAILURE_MESSAGE;
  }

  void mode;
  return GENERATION_PROVIDER_FAILURE_MESSAGE;
}

function getPublicDebugLastError(lastError: string | null | undefined) {
  if (!lastError) {
    return undefined;
  }

  return [
    GENERATION_STALE_MESSAGE,
    PHOTO_PACK_STALE_MESSAGE,
    GENERATION_PROVIDER_FAILURE_MESSAGE,
    PHOTO_PACK_PROVIDER_FAILURE_MESSAGE,
  ].includes(lastError)
    ? lastError
    : undefined;
}

function buildImageRequestForExplicitModel(
  modelId: string,
  prompt: string,
  ratio: string | null,
  referenceImageUrl: string | null,
  styleReferenceImageUrl: string | null,
  compositionReferenceImageUrl: string | null,
  numImages: number,
) {
  if (isGptImageModel(modelId)) {
    if (referenceImageUrl) {
      return {
        modelId,
        resolution: "1K",
        input: {
          prompt,
          image_urls: buildEditReferenceImageUrls(
            referenceImageUrl,
            compositionReferenceImageUrl,
            styleReferenceImageUrl,
          ),
          image_size: ratioToGptImageSize(ratio),
          quality: "medium",
          num_images: numImages,
          output_format: "jpeg",
        },
      };
    }

    return {
      modelId,
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
    if (isNanoBananaImageModel(modelId)) {
      return {
        modelId,
        resolution: "1K",
        input: {
          prompt,
          image_urls: buildEditReferenceImageUrls(
            referenceImageUrl,
            compositionReferenceImageUrl,
            styleReferenceImageUrl,
          ),
          resolution: "1K",
          num_images: numImages,
          aspect_ratio: aspectRatio,
          output_format: "jpeg",
          limit_generations: true,
        },
      };
    }

    if (isFluxImageModel(modelId)) {
      return {
        modelId,
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

    return {
      modelId,
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

  if (isNanoBananaImageModel(modelId)) {
    return {
      modelId,
      resolution: "1K",
      input: {
        prompt,
        resolution: "1K",
        num_images: numImages,
        aspect_ratio: aspectRatio,
        output_format: "jpeg",
        limit_generations: true,
      },
    };
  }

  if (isFluxImageModel(modelId)) {
    return {
      modelId,
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

  return {
    modelId,
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

function choosePackFrameModel(
  payload: JobRequestPayload & { packPlan: PackPlan },
  frameIndex: number,
) {
  const hasReferenceImage = Boolean(payload.referenceImageUrl);
  const primaryModelId = getPackModelId(hasReferenceImage);
  if (!primaryModelId) {
    throw new HttpError(
      503,
      "PHOTO_PACK_MODEL_NOT_CONFIGURED",
      "Photo session generation is not configured yet. Try again later.",
    );
  }

  if (isGptImageModel(primaryModelId)) {
    return {
      modelId: primaryModelId,
      modelKind: "primary" as const,
    };
  }

  const fallbackModelId = getPackFallbackModelId(hasReferenceImage);
  const frameAttempt = getFrameAttemptCount(payload.packPlan, frameIndex);
  if (frameAttempt === 0 || !fallbackModelId || fallbackModelId === primaryModelId) {
    return {
      modelId: primaryModelId,
      modelKind: "primary" as const,
    };
  }

  return {
    modelId: fallbackModelId,
    modelKind: "fallback" as const,
  };
}

async function submitPackFrame(
  data: JobRecord,
  payload: JobRequestPayload & { packPlan: PackPlan },
) {
  const frameIndex = payload.packPlan.pendingFrames[0];
  if (typeof frameIndex !== "number") {
    return null;
  }

  const modelSelection = choosePackFrameModel(payload, frameIndex);
  const packPrompt = buildPhotoPackSingleFramePrompt(
    payload.originalPrompt ?? payload.prompt,
    frameIndex,
    payload.packPlan.targetCount,
  );
  const falRequest = buildImageRequestForExplicitModel(
    modelSelection.modelId,
    packPrompt,
    payload.ratio,
    payload.referenceImageUrl,
    payload.styleReferenceImageUrl,
    payload.compositionReferenceImageUrl,
    1,
  );
  const queuePriority = getQueuePriority(payload.mode, payload.tier);
  const response = await falQueueSubmit(
    falRequest.modelId,
    falRequest.input,
    queuePriority,
  );
  const requestId = getFalRequestId(response);
  const queueStatusUrl = getQueueStatusUrlFromResponse(response);
  const queueResponseUrl = getQueueResponseUrlFromResponse(response);
  const frameAttemptCount = getFrameAttemptCount(payload.packPlan, frameIndex) + 1;
  const updatedPackPlan: PackPlan = {
    ...payload.packPlan,
    pendingFrames: payload.packPlan.pendingFrames.slice(1),
    currentFrame: {
      index: frameIndex,
      modelId: falRequest.modelId,
      modelKind: modelSelection.modelKind,
      requestId,
      queueStatusUrl,
      queueResponseUrl,
      startedAt: new Date().toISOString(),
    },
    frameAttempts: {
      ...payload.packPlan.frameAttempts,
      [String(frameIndex)]: frameAttemptCount,
    },
  };
  const nextPayload: JobRequestPayload = {
    ...payload,
    queuePriority,
    queueStatusUrl,
    queueResponseUrl,
    activeAttemptStartedAt: new Date().toISOString(),
    packPlan: updatedPackPlan,
  };

  const { error } = await supabase!
    .from("generation_jobs")
    .update({
      active_job_id: requestId,
      model_id: falRequest.modelId,
      effective_model_id: falRequest.modelId,
      resolution: falRequest.resolution ?? null,
      request_payload: nextPayload,
    })
    .eq("job_id", data.job_id);

  if (error) {
    throw mapGenerationJobsError(error, "JOB_PACK_FRAME_UPDATE_FAILED");
  }

  return {
    frameIndex,
    modelId: falRequest.modelId,
    queueStatusUrlPresent: Boolean(queueStatusUrl),
    updatedPayload: nextPayload,
  };
}

async function updatePackJobState(
  data: JobRecord,
  payload: JobRequestPayload,
  options?: {
    activeJobId?: string | null;
    modelId?: string | null;
    effectiveModelId?: string | null;
    resolution?: string | null;
    lastError?: string | null;
  },
) {
  const { error } = await supabase!
    .from("generation_jobs")
    .update({
      active_job_id: options?.activeJobId ?? data.job_id,
      model_id: options?.modelId ?? data.model_id,
      effective_model_id: options?.effectiveModelId ?? data.effective_model_id ?? data.model_id,
      resolution: options?.resolution ?? data.resolution ?? null,
      last_error: options?.lastError ?? null,
      request_payload: payload,
    })
    .eq("job_id", data.job_id);

  if (error) {
    throw mapGenerationJobsError(error, "JOB_PACK_STATE_UPDATE_FAILED");
  }
}

function buildIdentityVideoRequest(
  tier: AccountTier,
  prompt: string,
  ratio: string | null,
  resolution: string | null,
  referenceImageUrl: string,
) {
  const effectiveResolution = tier === "free"
    ? "720p"
    : normalizeWan25Resolution(resolution, "1080p");

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

async function createGeneration(req: Request, mode: Mode) {
  const accountId = getAccountId(req);
  await enforceRateLimit(req, accountId);

  const body = await readGenerationBody(req);
  if (!body.prompt) {
    throw new HttpError(400, "MISSING_PROMPT", "Missing prompt.");
  }

  ensurePhotoPackConfiguration(mode, body.outputCount);

  const tier = await getAccountTier(accountId);
  validateTierReferenceFile(mode, tier, body.referenceFile);
  const originalReferenceImageUrl = body.referenceFile
    ? await uploadToReferenceStorage(accountId, body.referenceFile)
    : null;
  const processedReferenceImageUrl = await preprocessReferenceImageUrl(
    originalReferenceImageUrl,
    body.referenceMode,
  );
  const referenceImageUrl = selectReferenceImageUrl(
    mode,
    originalReferenceImageUrl,
    processedReferenceImageUrl,
  );
  const routing = resolveReferenceRouting(
    mode,
    tier,
    body.referenceMode,
    Boolean(referenceImageUrl),
  );
  const generationCost = normalizeGenerationCost(
    body.generationCost,
    mode,
    body.outputCount,
  );
  await consumeGenerationCredits(accountId, generationCost, mode);
  let shouldRefundCredits = true;

  try {

  const requestedModelId = getRequestedModelId(
    mode,
    tier,
    Boolean(referenceImageUrl),
    body.outputCount,
    routing,
  );
  const isPackOrchestrationRequest =
    mode === "image" && isPhotoPackRequest(mode, body.outputCount);

  if (isPackOrchestrationRequest) {
    const targetCount = getPackTargetCount(body.outputCount);
    const packPlan = createInitialPackPlan(targetCount);
    const effectiveModelId = requestedModelId ?? getPackModelId(Boolean(referenceImageUrl));
    if (!effectiveModelId) {
      throw new HttpError(
        503,
        "PHOTO_PACK_MODEL_NOT_CONFIGURED",
        "Photo session generation is not configured yet. Try again later.",
      );
    }
    const orchestratedJobId = crypto.randomUUID();
    const queuePriority = getQueuePriority(mode, tier);
    const requestPayload: JobRequestPayload = {
      mode,
      tier,
      prompt: body.prompt,
      originalPrompt: body.prompt,
      referenceMode: body.referenceMode,
      ratio: body.ratio,
      resolution: body.resolution,
      outputCount: body.outputCount,
      generationCost,
      referenceImageUrl,
      originalReferenceImageUrl,
      processedReferenceImageUrl,
      styleReferenceImageUrl: body.styleReferenceUrl,
      compositionReferenceImageUrl: body.compositionReferenceUrl,
      referenceSource: getReferenceSource(
        referenceImageUrl,
        originalReferenceImageUrl,
        processedReferenceImageUrl,
      ),
      referenceStrategy: routing.referenceStrategy,
      identityMode: routing.identityMode,
      queuePriority,
      queueStatusUrl: null,
      queueResponseUrl: null,
      activeAttemptStartedAt: new Date().toISOString(),
      packPlan,
    };

    const { error } = await supabase!.from("generation_jobs").insert({
      job_id: orchestratedJobId,
      active_job_id: orchestratedJobId,
      model_id: effectiveModelId,
      mode,
      account_id: accountId,
      tier,
      requested_model_id: requestedModelId,
      effective_model_id: effectiveModelId,
      resolution: "1K",
      retry_count: 0,
      request_payload: requestPayload,
    });

    if (error) {
      throw mapGenerationJobsError(error, "JOB_STORE_FAILED");
    }

    return {
      jobId: orchestratedJobId,
      status: "queued",
      estimatedWaitSec: tier === "pro" ? 90 : 120,
      historyItemId: `history_${orchestratedJobId}`,
      effectiveTier: tier,
      effectiveModelId: effectiveModelId ?? undefined,
      effectiveResolution: "1K",
      retryCount: 0,
      debug: {
        referenceStrategy: routing.referenceStrategy,
        identityMode: routing.identityMode,
        referenceSource: requestPayload.referenceSource,
        queuePriority: requestPayload.queuePriority,
        queueStatusUrlPresent: false,
        effectiveModelId: effectiveModelId ?? undefined,
        effectiveResolution: "1K",
        packProgressDone: 0,
        packProgressTarget: targetCount,
      },
    };
  }

  const queuePriority = getQueuePriority(mode, tier);
  const falRequest = buildFalRequest(
    mode,
    tier,
    body.prompt,
    body.ratio,
    body.resolution,
    body.outputCount,
    referenceImageUrl,
    body.styleReferenceUrl,
    body.compositionReferenceUrl,
    routing,
  );
  const response = await falQueueSubmit(
    falRequest.modelId,
    falRequest.input,
    queuePriority,
  );
  const requestId = getFalRequestId(response);
  const queueStatusUrl = getQueueStatusUrlFromResponse(response);
  const queueResponseUrl = getQueueResponseUrlFromResponse(response);
  const requestPayload: JobRequestPayload = {
    mode,
    tier,
    prompt: body.prompt,
    originalPrompt: body.prompt,
    referenceMode: body.referenceMode,
    ratio: body.ratio,
    resolution: body.resolution,
    outputCount: body.outputCount,
    generationCost,
    referenceImageUrl,
    originalReferenceImageUrl,
    processedReferenceImageUrl,
    styleReferenceImageUrl: body.styleReferenceUrl,
    compositionReferenceImageUrl: body.compositionReferenceUrl,
    referenceSource: getReferenceSource(
      referenceImageUrl,
      originalReferenceImageUrl,
      processedReferenceImageUrl,
    ),
    referenceStrategy: routing.referenceStrategy,
    identityMode: routing.identityMode,
    queuePriority,
    queueStatusUrl,
    queueResponseUrl,
    activeAttemptStartedAt: new Date().toISOString(),
  };

  const { error } = await supabase!.from("generation_jobs").insert({
    job_id: requestId,
    active_job_id: requestId,
    model_id: falRequest.modelId,
    mode,
    account_id: accountId,
    tier,
    requested_model_id: requestedModelId,
    effective_model_id: falRequest.modelId,
    resolution: falRequest.resolution ?? null,
    retry_count: 0,
    request_payload: requestPayload,
  });

  if (error) {
    throw mapGenerationJobsError(error, "JOB_STORE_FAILED");
  }

  shouldRefundCredits = false;

  return {
    jobId: requestId,
    status: "queued",
    estimatedWaitSec:
      mode === "video" ? (tier === "pro" ? 45 : 60) : tier === "pro" ? 18 : 25,
    historyItemId: `history_${requestId}`,
    effectiveTier: tier,
    effectiveModelId: falRequest.modelId,
    effectiveResolution: falRequest.resolution,
    retryCount: 0,
    debug: {
      referenceStrategy: routing.referenceStrategy,
      identityMode: routing.identityMode,
      referenceSource: requestPayload.referenceSource,
      queuePriority: requestPayload.queuePriority,
      queueStatusUrlPresent: Boolean(requestPayload.queueStatusUrl),
      effectiveModelId: falRequest.modelId,
      effectiveResolution: falRequest.resolution ?? undefined,
    },
  };
  } catch (error) {
    if (shouldRefundCredits) {
      try {
        await refundGenerationCredits(
          accountId,
          generationCost,
          mode,
          "create_generation_failed",
        );
      } catch (_refundError) {
        // best-effort refund; preserve original create error path
      }
    }
    throw error;
  }
}

async function getAccountTier(accountId: string): Promise<AccountTier> {
  const { data, error } = await supabase!
    .from("account_entitlements")
    .select("is_pro")
    .eq("account_id", accountId)
    .maybeSingle<{ is_pro: boolean }>();

  if (error) {
    throw new HttpError(502, "ENTITLEMENT_LOOKUP_FAILED", error.message);
  }

  return data?.is_pro ? "pro" : "free";
}

function normalizeGenerationCost(
  value: number | null,
  mode: Mode,
  outputCount: number | null,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.floor(value);
    if (normalized > 0 && normalized <= 10_000) {
      return normalized;
    }
  }

  if (mode === "video") {
    return 25;
  }

  if (isPhotoPackRequest(mode, outputCount)) {
    return normalizeImageOutputCount(outputCount) * 4;
  }

  return 4;
}

function getCreditConsumeSource(mode: Mode) {
  return mode === "video" ? "generation_video" : "generation_image";
}

async function consumeGenerationCredits(
  accountId: string,
  amount: number,
  mode: Mode,
) {
  const { data, error } = await supabase!.rpc("consume_account_credits", {
    p_account_id: accountId,
    p_amount: amount,
    p_source: getCreditConsumeSource(mode),
  });

  if (error) {
    throw mapGenerationJobsError(error, "CREDIT_CONSUME_FAILED");
  }

  const row = Array.isArray(data)
    ? (data[0] as CreditConsumeRpcRow | undefined)
    : (data as CreditConsumeRpcRow | null);

  if (!row?.success) {
    throw new HttpError(
      402,
      "CREDIT_LIMIT_EXCEEDED",
      "Not enough credits. Please top up and try again.",
    );
  }
}

async function refundGenerationCredits(
  accountId: string,
  amount: number,
  mode: Mode,
  reason: string,
) {
  const { error } = await supabase!.rpc("grant_account_credits", {
    p_account_id: accountId,
    p_source: `${getCreditConsumeSource(mode)}_refund`,
    p_granted_credits: amount,
    p_metadata: {
      reason,
      refunded_at: new Date().toISOString(),
    },
  });

  if (error) {
    throw mapGenerationJobsError(error, "CREDIT_REFUND_FAILED");
  }
}

async function pollGeneration(req: Request, jobId: string) {
  const accountId = getAccountId(req);
  const { data, error } = await supabase!
    .from("generation_jobs")
    .select(
      "job_id, active_job_id, model_id, mode, account_id, created_at, tier, requested_model_id, effective_model_id, resolution, retry_count, last_error, request_payload",
    )
    .eq("job_id", jobId)
    .maybeSingle<JobRecord>();

  if (error) {
    throw mapGenerationJobsError(error, "JOB_LOOKUP_FAILED");
  }

  if (!data || data.account_id !== accountId) {
    throw new HttpError(404, "UNKNOWN_JOB", "Unknown jobId.");
  }

  const activeJobId = data.active_job_id?.trim() || data.job_id;
  const providerFailureMessage = getProviderFailureMessage(
    data.mode,
    data.request_payload,
  );
  const staleGenerationMessage = getStaleGenerationMessage(
    data.mode,
    data.request_payload,
    data.created_at,
  );

  if (isPackOrchestrationPayload(data.request_payload)) {
    const payload = data.request_payload;
    const packPlan = payload.packPlan;
    const progressDone = packPlan.completedOutputs.length;
    const progressTarget = packPlan.targetCount;
    const progressPercent = progressTarget > 0
      ? Math.min(99, Math.round((progressDone / progressTarget) * 100))
      : 0;
    const providerFailureMessage = getProviderFailureMessage(data.mode, payload);
    const buildPackDebug = (
      lastError?: string,
      queuePollSource: "url" | "model_id" = "url",
    ) => ({
      referenceStrategy: payload.referenceStrategy,
      identityMode: payload.identityMode,
      referenceSource: payload.referenceSource,
      queuePriority: payload.queuePriority,
      queueStatusUrlPresent: Boolean(
        payload.packPlan.currentFrame?.queueStatusUrl ?? payload.queueStatusUrl,
      ),
      queueResponseUrlPresent: Boolean(
        payload.packPlan.currentFrame?.queueResponseUrl ?? payload.queueResponseUrl,
      ),
      queuePollSource,
      effectiveModelId:
        payload.packPlan.currentFrame?.modelId ??
        data.effective_model_id ??
        data.model_id,
      activeJobId:
        payload.packPlan.currentFrame?.requestId ??
        data.active_job_id ??
        data.job_id,
      lastError,
      packProgressDone: progressDone,
      packProgressTarget: progressTarget,
      packCurrentModel: payload.packPlan.currentFrame?.modelId ?? null,
    });

    if (staleGenerationMessage) {
      return {
        jobId,
        status: "failed",
        progressPercent: 0,
        currentStage: "Failed",
        errorMessage: staleGenerationMessage,
        retryCount: data.retry_count ?? 0,
        debug: buildPackDebug(staleGenerationMessage),
        updatedAt: new Date().toISOString(),
      };
    }

    if (progressDone >= progressTarget && progressTarget > 0) {
      const outputs = packPlan.completedOutputs.slice(0, progressTarget);
      return {
        jobId,
        status: "completed",
        progressPercent: 100,
        currentStage: "Completed",
        previewUrl: outputs[0],
        outputs,
        outputUrls: outputs,
        output_urls: outputs,
        retryCount: data.retry_count ?? 0,
        debug: {
          ...buildPackDebug(getPublicDebugLastError(data.last_error ?? undefined)),
          packProgressDone: outputs.length,
          packCurrentModel: null,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    if (!packPlan.currentFrame) {
      if (packPlan.pendingFrames.length === 0) {
        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: providerFailureMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildPackDebug(providerFailureMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      const frameSubmission = await submitPackFrame(data, payload);
      if (!frameSubmission) {
        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: providerFailureMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildPackDebug(providerFailureMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        jobId,
        status: "queued",
        progressPercent,
        currentStage: `Generating photo ${progressDone + 1}/${progressTarget}`,
        retryCount: data.retry_count ?? 0,
        debug: buildPackDebug(undefined, "url"),
        updatedAt: new Date().toISOString(),
      };
    }

    const currentFrame = packPlan.currentFrame;
    const frameIndex = currentFrame.index;
    const modelHasEndpointSubpath = hasFalModelEndpointSubpath(currentFrame.modelId);
    const queueStatusUrl = asNonEmptyString(
      currentFrame.queueStatusUrl ?? payload.queueStatusUrl,
    );
    const queueResponseUrl = asNonEmptyString(
      currentFrame.queueResponseUrl ?? payload.queueResponseUrl,
    );
    let queuePollSource: "url" | "model_id" = queueStatusUrl ? "url" : "model_id";

    const requeueCurrentFrame = async (reason: string) => {
      const attempts = getFrameAttemptCount(packPlan, frameIndex);
      if (attempts >= PACK_FRAME_MAX_ATTEMPTS) {
        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: providerFailureMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildPackDebug(providerFailureMessage, queuePollSource),
          updatedAt: new Date().toISOString(),
        };
      }

      const nextPackPlan: PackPlan = {
        ...packPlan,
        currentFrame: null,
        pendingFrames: [frameIndex, ...packPlan.pendingFrames],
        lastFrameError: reason,
      };
      const nextPayload: JobRequestPayload = {
        ...payload,
        queueStatusUrl: null,
        queueResponseUrl: null,
        activeAttemptStartedAt: new Date().toISOString(),
        packPlan: nextPackPlan,
      };
      await updatePackJobState(data, nextPayload, {
        activeJobId: data.job_id,
        modelId: currentFrame.modelId,
        effectiveModelId: currentFrame.modelId,
        resolution: data.resolution ?? "1K",
        lastError: reason,
      });

      return {
        jobId,
        status: "processing",
        progressPercent,
        currentStage: `Retrying photo ${frameIndex + 1}/${progressTarget}`,
        retryCount: data.retry_count ?? 0,
        debug: buildPackDebug(undefined, queuePollSource),
        updatedAt: new Date().toISOString(),
      };
    };

    try {
      let status: FalQueueResponse;

      try {
        if (queueStatusUrl) {
          try {
            queuePollSource = "url";
            status = await falQueueStatusByUrl(queueStatusUrl);
          } catch (error) {
            if (modelHasEndpointSubpath) {
              throw error;
            }
            queuePollSource = "model_id";
            status = await falQueueStatus(currentFrame.modelId, currentFrame.requestId);
          }
        } else {
          queuePollSource = "model_id";
          status = await falQueueStatus(currentFrame.modelId, currentFrame.requestId);
        }
      } catch (error) {
        if (!isTransientFalStatusLookupError(error)) {
          const reason = getProviderErrorMessage(error);
          if (isFalProviderValidationError(error)) {
            return await requeueCurrentFrame(reason);
          }
          throw error;
        }

        return {
          jobId,
          status: "processing",
          progressPercent,
          currentStage: `Generating photo ${frameIndex + 1}/${progressTarget}`,
          retryCount: data.retry_count ?? 0,
          debug: buildPackDebug(getPublicDebugLastError(data.last_error ?? undefined), queuePollSource),
          updatedAt: new Date().toISOString(),
        };
      }

      const queueStatus = status?.status;
      const statusDerivedResponseUrl = getQueueResponseUrlFromResponse(status);
      const effectiveQueueResponseUrl = statusDerivedResponseUrl ?? queueResponseUrl;

      if (queueStatus === "IN_QUEUE") {
        return {
          jobId,
          status: "queued",
          progressPercent,
          currentStage: `Queued photo ${frameIndex + 1}/${progressTarget}`,
          retryCount: data.retry_count ?? 0,
          debug: buildPackDebug(getPublicDebugLastError(data.last_error ?? undefined), queuePollSource),
          updatedAt: new Date().toISOString(),
        };
      }

      if (queueStatus === "IN_PROGRESS") {
        return {
          jobId,
          status: "processing",
          progressPercent,
          currentStage: `Generating photo ${frameIndex + 1}/${progressTarget}`,
          retryCount: data.retry_count ?? 0,
          debug: buildPackDebug(getPublicDebugLastError(data.last_error ?? undefined), queuePollSource),
          updatedAt: new Date().toISOString(),
        };
      }

      if (queueStatus === "COMPLETED") {
        let result: FalQueueResponse;
        try {
          if (effectiveQueueResponseUrl) {
            try {
              queuePollSource = "url";
              result = await falQueueResultByUrl(effectiveQueueResponseUrl);
            } catch (error) {
              if (modelHasEndpointSubpath) {
                throw error;
              }
              queuePollSource = "model_id";
              result = await falQueueResult(currentFrame.modelId, currentFrame.requestId);
            }
          } else {
            queuePollSource = "model_id";
            result = await falQueueResult(currentFrame.modelId, currentFrame.requestId);
          }
        } catch (error) {
          if (isTransientFalResultLookupError(error)) {
            return {
              jobId,
              status: "processing",
              progressPercent,
              currentStage: `Finalizing photo ${frameIndex + 1}/${progressTarget}`,
              retryCount: data.retry_count ?? 0,
              debug: buildPackDebug(getPublicDebugLastError(data.last_error ?? undefined), queuePollSource),
              updatedAt: new Date().toISOString(),
            };
          }

          const reason = getProviderErrorMessage(error);
          return await requeueCurrentFrame(reason);
        }

        const outputs = getOutputsFromFalResult(result);
        if (outputs.length === 0) {
          return await requeueCurrentFrame("Provider returned an empty result.");
        }

        const firstOutput = outputs[0];
        const nextCompletedOutputs = [...packPlan.completedOutputs, firstOutput];
        const nextPackPlan: PackPlan = {
          ...packPlan,
          completedOutputs: nextCompletedOutputs,
          currentFrame: null,
          lastFrameError: null,
        };
        const nextPayload: JobRequestPayload = {
          ...payload,
          queueStatusUrl: null,
          queueResponseUrl: null,
          activeAttemptStartedAt: new Date().toISOString(),
          packPlan: nextPackPlan,
        };
        await updatePackJobState(data, nextPayload, {
          activeJobId: data.job_id,
          modelId: currentFrame.modelId,
          effectiveModelId: currentFrame.modelId,
          resolution: "1K",
          lastError: null,
        });

        if (nextCompletedOutputs.length >= progressTarget) {
          const finalOutputs = nextCompletedOutputs.slice(0, progressTarget);
          return {
            jobId,
            status: "completed",
            progressPercent: 100,
            currentStage: "Completed",
            previewUrl: finalOutputs[0],
            outputs: finalOutputs,
            outputUrls: finalOutputs,
            output_urls: finalOutputs,
            retryCount: data.retry_count ?? 0,
            debug: {
              ...buildPackDebug(undefined, queuePollSource),
              packProgressDone: finalOutputs.length,
              packCurrentModel: null,
            },
            updatedAt: new Date().toISOString(),
          };
        }

        return {
          jobId,
          status: "processing",
          progressPercent: Math.min(
            99,
            Math.round((nextCompletedOutputs.length / progressTarget) * 100),
          ),
          currentStage: `Generated ${nextCompletedOutputs.length}/${progressTarget}`,
          retryCount: data.retry_count ?? 0,
          debug: {
            ...buildPackDebug(undefined, queuePollSource),
            packProgressDone: nextCompletedOutputs.length,
          },
          updatedAt: new Date().toISOString(),
        };
      }

      return await requeueCurrentFrame(
        `fal queue status: ${String(queueStatus ?? "unknown")}`,
      );
    } catch (error) {
      if (!isFalProviderValidationError(error)) {
        throw error;
      }

      return await requeueCurrentFrame(getProviderErrorMessage(error));
    }
  }

  const queueStatusUrl = asNonEmptyString(data.request_payload?.queueStatusUrl);
  const queueResponseUrl = asNonEmptyString(data.request_payload?.queueResponseUrl);
  const queueStatusUrlPresent = Boolean(queueStatusUrl);
  const queueResponseUrlPresent = Boolean(queueResponseUrl);
  const modelHasEndpointSubpath = hasFalModelEndpointSubpath(data.model_id);
  let queuePollSource: "url" | "model_id" = queueStatusUrlPresent
    ? "url"
    : "model_id";
  const buildDebug = (lastError?: string) => ({
    referenceStrategy: data.request_payload?.referenceStrategy,
    identityMode: data.request_payload?.identityMode,
    referenceSource: data.request_payload?.referenceSource,
    queuePriority: data.request_payload?.queuePriority,
    queueStatusUrlPresent,
    queueResponseUrlPresent,
    queuePollSource,
    effectiveModelId: data.effective_model_id ?? data.model_id,
    activeJobId,
    lastError,
  });

  if (
    staleGenerationMessage &&
    data.request_payload &&
    isPhotoPackRequest(data.request_payload.mode, data.request_payload.outputCount)
  ) {
    return {
      jobId,
      status: "failed",
      progressPercent: 0,
      currentStage: "Failed",
      errorMessage: staleGenerationMessage,
      retryCount: data.retry_count ?? 0,
      debug: buildDebug(staleGenerationMessage),
      updatedAt: new Date().toISOString(),
    };
  }

    try {
      let status: FalQueueResponse;

      try {
        if (queueStatusUrl) {
          try {
            queuePollSource = "url";
            status = await falQueueStatusByUrl(queueStatusUrl);
          } catch (error) {
            if (modelHasEndpointSubpath) {
              throw error;
            }

            queuePollSource = "model_id";
            status = await falQueueStatus(data.model_id, activeJobId);
          }
        } else {
          queuePollSource = "model_id";
          status = await falQueueStatus(data.model_id, activeJobId);
        }
    } catch (error) {
      if (!isTransientFalStatusLookupError(error)) {
        if (!isFalProviderValidationError(error)) {
          throw error;
        }

        const retryResponse = await retryGeneration(data, getProviderErrorMessage(error));

        if (retryResponse) {
          return retryResponse;
        }

        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: providerFailureMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildDebug(providerFailureMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      if (staleGenerationMessage) {
        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: staleGenerationMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildDebug(staleGenerationMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        jobId,
        status: (data.retry_count ?? 0) > 0 ? "processing" : "queued",
        progressPercent: (data.retry_count ?? 0) > 0 ? 55 : 5,
        currentStage:
          (data.retry_count ?? 0) > 0
            ? "Checking generation status"
            : "Queued",
        retryCount: data.retry_count ?? 0,
        debug: buildDebug(undefined),
        updatedAt: new Date().toISOString(),
      };
    }

    const queueStatus = status?.status;
    const statusDerivedResponseUrl = getQueueResponseUrlFromResponse(status);
    const effectiveQueueResponseUrl = statusDerivedResponseUrl ?? queueResponseUrl;

    if (queueStatus === "COMPLETED") {
      let result: FalQueueResponse;
      try {
        if (effectiveQueueResponseUrl) {
          try {
            queuePollSource = "url";
            result = await falQueueResultByUrl(effectiveQueueResponseUrl);
          } catch (error) {
            if (modelHasEndpointSubpath) {
              throw error;
            }

            queuePollSource = "model_id";
            result = await falQueueResult(data.model_id, activeJobId);
          }
        } else {
          queuePollSource = "model_id";
          result = await falQueueResult(data.model_id, activeJobId);
        }
      } catch (error) {
        if (isTransientFalResultLookupError(error)) {
          if (staleGenerationMessage) {
            return {
              jobId,
              status: "failed",
              progressPercent: 0,
              currentStage: "Failed",
              errorMessage: staleGenerationMessage,
              retryCount: data.retry_count ?? 0,
              debug: buildDebug(staleGenerationMessage),
              updatedAt: new Date().toISOString(),
            };
          }

          return {
            jobId,
            status: "processing",
            progressPercent: 70,
            currentStage: "Finalizing result",
            retryCount: data.retry_count ?? 0,
            debug: buildDebug(getPublicDebugLastError(data.last_error ?? undefined)),
            updatedAt: new Date().toISOString(),
          };
        }

        throw error;
      }
      const outputs = getOutputsFromFalResult(result);

      if (outputs.length === 0) {
        const retryResponse = await retryGeneration(data, "Provider returned an empty result.");
        if (retryResponse) {
          return retryResponse;
        }

        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: providerFailureMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildDebug(providerFailureMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        jobId,
        status: "completed",
        progressPercent: 100,
        currentStage: "Completed",
        previewUrl: getPreviewUrl(result, outputs),
        outputs,
        outputUrls: outputs,
        output_urls: outputs,
        retryCount: data.retry_count ?? 0,
        debug: buildDebug(getPublicDebugLastError(data.last_error ?? undefined)),
        updatedAt: new Date().toISOString(),
      };
    }

    if (queueStatus === "IN_PROGRESS") {
      if (staleGenerationMessage) {
        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: staleGenerationMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildDebug(staleGenerationMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        jobId,
        status: "processing",
        progressPercent: 55,
        currentStage:
          data.mode === "video" ? "Rendering your video" : "Generating your image",
        retryCount: data.retry_count ?? 0,
        debug: buildDebug(getPublicDebugLastError(data.last_error ?? undefined)),
        updatedAt: new Date().toISOString(),
      };
    }

    if (queueStatus === "IN_QUEUE") {
      if (staleGenerationMessage) {
        return {
          jobId,
          status: "failed",
          progressPercent: 0,
          currentStage: "Failed",
          errorMessage: staleGenerationMessage,
          retryCount: data.retry_count ?? 0,
          debug: buildDebug(staleGenerationMessage),
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        jobId,
        status: "queued",
        progressPercent: 5,
        currentStage: "Queued",
        retryCount: data.retry_count ?? 0,
        debug: buildDebug(getPublicDebugLastError(data.last_error ?? undefined)),
        updatedAt: new Date().toISOString(),
      };
    }

    const retryResponse = await retryGeneration(
      data,
      `fal queue status: ${String(queueStatus ?? "unknown")}`,
    );

    if (retryResponse) {
      return retryResponse;
    }

    return {
      jobId,
      status: "failed",
      progressPercent: 0,
      currentStage: "Failed",
      errorMessage: providerFailureMessage,
      retryCount: data.retry_count ?? 0,
      debug: buildDebug(providerFailureMessage),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (!isFalProviderValidationError(error)) {
      throw error;
    }

    const retryResponse = await retryGeneration(data, getProviderErrorMessage(error));

    if (retryResponse) {
      return retryResponse;
    }

    return {
      jobId,
      status: "failed",
      progressPercent: 0,
      currentStage: "Failed",
      errorMessage: providerFailureMessage,
      retryCount: data.retry_count ?? 0,
      debug: {
        ...buildDebug(providerFailureMessage),
      },
      updatedAt: new Date().toISOString(),
    };
  }
}

async function retryGeneration(data: JobRecord, reason: string) {
  const requestPayload = data.request_payload;

  if (
    !requestPayload ||
    (data.retry_count ?? 0) >= getMaxGenerationRetries(requestPayload)
  ) {
    return null;
  }

  const nextRetryCount = (data.retry_count ?? 0) + 1;
  const retryReferenceImageUrl = requestPayload.referenceStrategy === "identity-first"
    ? nextRetryCount === 1
      ? getRetryReferenceImageUrl(requestPayload)
      : nextRetryCount === 2
      ? getAlternateReferenceImageUrl(requestPayload)
      : getStandardReferenceImageUrl(requestPayload)
    : getRetryReferenceImageUrl(requestPayload);
  const nextRouting = requestPayload.referenceStrategy === "identity-first" &&
      requestPayload.identityMode === "active" &&
      nextRetryCount >= 3
    ? {
        referenceStrategy: "standard" as const,
        identityMode: "fallback" as const,
      }
    : {
        referenceStrategy: requestPayload.referenceStrategy,
        identityMode: requestPayload.identityMode,
      };
  const retryPrompt = buildRetryPrompt(
    requestPayload.originalPrompt ?? requestPayload.prompt,
    requestPayload.mode,
    requestPayload.referenceMode,
    getReferenceSource(
      retryReferenceImageUrl,
      requestPayload.originalReferenceImageUrl,
      requestPayload.processedReferenceImageUrl,
    ),
    nextRouting.referenceStrategy,
  );
  const queuePriority = getQueuePriority(requestPayload.mode, requestPayload.tier);
  const falRequest = buildFalRequest(
    requestPayload.mode,
    requestPayload.tier,
    retryPrompt,
    requestPayload.ratio,
    requestPayload.resolution,
    requestPayload.outputCount,
    retryReferenceImageUrl,
    requestPayload.styleReferenceImageUrl,
    requestPayload.compositionReferenceImageUrl,
    nextRouting,
  );
  const response = await falQueueSubmit(
    falRequest.modelId,
    falRequest.input,
    queuePriority,
  );
  const retryJobId = getFalRequestId(response);
  const queueStatusUrl = getQueueStatusUrlFromResponse(response);
  const queueResponseUrl = getQueueResponseUrlFromResponse(response);

  const { error } = await supabase!
    .from("generation_jobs")
    .update({
      active_job_id: retryJobId,
      model_id: falRequest.modelId,
      effective_model_id: falRequest.modelId,
      resolution: falRequest.resolution ?? null,
      retry_count: nextRetryCount,
      last_error: reason,
      request_payload: {
        ...requestPayload,
        prompt: retryPrompt,
        referenceImageUrl: retryReferenceImageUrl,
        referenceSource: getReferenceSource(
          retryReferenceImageUrl,
          requestPayload.originalReferenceImageUrl,
          requestPayload.processedReferenceImageUrl,
        ),
        referenceStrategy: nextRouting.referenceStrategy,
        identityMode: nextRouting.identityMode,
        queuePriority,
        queueStatusUrl,
        queueResponseUrl,
        activeAttemptStartedAt: new Date().toISOString(),
      } satisfies JobRequestPayload,
    })
    .eq("job_id", data.job_id);

  if (error) {
    throw mapGenerationJobsError(error, "JOB_RETRY_UPDATE_FAILED");
  }

  return {
    jobId: data.job_id,
    status: "processing",
    progressPercent: 65,
    currentStage: "Retrying generation",
    retryCount: nextRetryCount,
    debug: {
      referenceStrategy: nextRouting.referenceStrategy,
      identityMode: nextRouting.identityMode,
      referenceSource: getReferenceSource(
        retryReferenceImageUrl,
        requestPayload.originalReferenceImageUrl,
        requestPayload.processedReferenceImageUrl,
      ),
      queuePriority,
      queueStatusUrlPresent: Boolean(queueStatusUrl),
      effectiveModelId: falRequest.modelId,
      activeJobId: retryJobId,
      lastError: reason,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function readGenerationBody(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const prompt = asNonEmptyString(formData.get("prompt"));
    const ratio = asNonEmptyString(formData.get("ratio"));
    const resolution = asNonEmptyString(formData.get("resolution"));
    const referenceMode = normalizeReferenceMode(formData.get("referenceMode"));
    const outputCount = asOptionalNumber(formData.get("outputCount"));
    const generationCost = asOptionalNumber(
      formData.get("generationCost") ?? formData.get("generation_cost"),
    );
    const styleReferenceUrl = asNonEmptyString(formData.get("styleReferenceUrl"));
    const compositionReferenceUrl = asNonEmptyString(
      formData.get("compositionReferenceUrl"),
    );
    const file = formData.get("referenceImage");
    const referenceFile = file instanceof File ? validateReferenceFile(file) : null;

    return {
      prompt,
      ratio,
      resolution,
      outputCount,
      generationCost,
      referenceMode,
      styleReferenceUrl,
      compositionReferenceUrl,
      referenceFile,
    };
  }

  const data = await req.json().catch(() => null);
  const prompt = asNonEmptyString(data?.prompt);
  const ratio = asNonEmptyString(data?.ratio);
  const resolution = asNonEmptyString(data?.resolution);
  const referenceMode = normalizeReferenceMode(
    data?.referenceMode ?? data?.reference_mode,
  );
  const outputCount = asOptionalNumber(data?.outputCount ?? data?.output_count);
  const generationCost = asOptionalNumber(
    data?.generationCost ?? data?.generation_cost,
  );
  const styleReferenceUrl = asNonEmptyString(
    data?.styleReferenceUrl ?? data?.style_reference_url,
  );
  const compositionReferenceUrl = asNonEmptyString(
    data?.compositionReferenceUrl ?? data?.composition_reference_url,
  );

  return {
    prompt,
    ratio,
    resolution,
    outputCount,
    generationCost,
    referenceMode,
    styleReferenceUrl,
    compositionReferenceUrl,
    referenceFile: null,
  };
}

function validateReferenceFile(file: File) {
  if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
    throw new HttpError(
      400,
      "REFERENCE_IMAGE_TOO_LARGE",
      "Reference image must be 10MB or smaller.",
    );
  }

  if (!SUPPORTED_REFERENCE_MIME_TYPES.has(file.type)) {
    throw new HttpError(
      400,
      "UNSUPPORTED_REFERENCE_IMAGE",
      "Reference image must be JPEG, PNG, WEBP, or BMP.",
    );
  }

  return file;
}

function validateTierReferenceFile(
  mode: Mode,
  tier: AccountTier,
  file: File | null,
) {
  if (mode !== "video" || tier !== "free" || !file) {
    return;
  }

  if (file.size > MAX_ECONOMY_REFERENCE_IMAGE_BYTES) {
    throw new HttpError(
      400,
      "REFERENCE_IMAGE_TOO_LARGE",
      "Reference image must be 8MB or smaller for the free video model.",
    );
  }
}

function getReferenceFileExtension(file: File) {
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/bmp":
      return "bmp";
    case "image/jpg":
    case "image/jpeg":
    default:
      return "jpg";
  }
}

function buildReferenceStoragePath(accountId: string, file: File) {
  const safeAccountId = accountId.replace(/[^a-zA-Z0-9_-]/g, "_") || "account";
  const extension = getReferenceFileExtension(file);
  return `${safeAccountId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

async function uploadToReferenceStorage(accountId: string, file: File) {
  const objectPath = buildReferenceStoragePath(accountId, file);
  const storage = supabase!.storage.from(REFERENCE_STORAGE_BUCKET);
  const { error: uploadError } = await storage.upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    throw new HttpError(
      502,
      "REFERENCE_IMAGE_UPLOAD_FAILED",
      uploadError.message,
    );
  }

  const { data, error: signedUrlError } = await storage.createSignedUrl(
    objectPath,
    REFERENCE_IMAGE_SIGNED_URL_TTL_SECONDS,
  );

  if (signedUrlError || !data?.signedUrl) {
    throw new HttpError(
      502,
      "REFERENCE_IMAGE_URL_FAILED",
      signedUrlError?.message || "Could not create a signed URL for the reference image.",
    );
  }

  return data.signedUrl;
}

function buildFalRequest(
  mode: Mode,
  tier: AccountTier,
  prompt: string,
  ratio: string | null,
  resolution: string | null,
  outputCount: number | null,
  referenceImageUrl: string | null,
  styleReferenceImageUrl: string | null,
  compositionReferenceImageUrl: string | null,
  routing?: { referenceStrategy: ReferenceStrategy; identityMode: IdentityMode },
) {
  if (mode === "image") {
    void routing;
    const normalizedOutputCount = normalizeImageOutputCount(outputCount);
    const isPhotoPack = isPhotoPackRequest(mode, outputCount);
    const stableReferenceModelId =
      env.falProImageReferenceModel || FAL_MODELS.imageReferencePro;
    const proTextModelId = env.falProImageTextModel || FAL_MODELS.imageTextPro;

    if (isPhotoPack) {
      const numImages = Math.min(normalizedOutputCount, getPackMaxOutputCount());
      const packModelId = getPackModelId(Boolean(referenceImageUrl));
      const packPrompt = buildPhotoPackSingleFramePrompt(prompt, 0, numImages);

      if (!packModelId) {
        throw new HttpError(
          503,
          "PHOTO_PACK_MODEL_NOT_CONFIGURED",
          "Photo session generation is not configured yet. Try again later.",
        );
      }

      if (isGptImageModel(packModelId)) {
        if (referenceImageUrl) {
          return {
            modelId: packModelId,
            resolution: "1K",
            input: {
              prompt: packPrompt,
              image_urls: buildEditReferenceImageUrls(
                referenceImageUrl,
                compositionReferenceImageUrl,
                styleReferenceImageUrl,
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
            prompt: packPrompt,
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
            prompt: packPrompt,
            image_urls: buildEditReferenceImageUrls(
              referenceImageUrl,
              compositionReferenceImageUrl,
              styleReferenceImageUrl,
            ),
            resolution: "1K",
            num_images: numImages,
            aspect_ratio: aspectRatio,
            output_format: "jpeg",
            limit_generations: true,
          },
        };
      }

      return {
        modelId: packModelId,
        resolution: "1K",
        input: {
          prompt: packPrompt,
          resolution: "1K",
          num_images: numImages,
          aspect_ratio: aspectRatio,
          output_format: "jpeg",
          limit_generations: true,
        },
      };
    }

    if (referenceImageUrl) {
      const numImages = normalizedOutputCount;
      if (isFluxImageModel(stableReferenceModelId)) {
        return {
          modelId: stableReferenceModelId,
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

      if (isNanoBananaImageModel(stableReferenceModelId)) {
        const imageUrls = buildEditReferenceImageUrls(
          referenceImageUrl,
          compositionReferenceImageUrl,
          styleReferenceImageUrl,
        );

        return {
          modelId: stableReferenceModelId,
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
        modelId: stableReferenceModelId,
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

    if (isFluxImageModel(proTextModelId)) {
      const numImages = normalizedOutputCount;
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
      const numImages = normalizedOutputCount;
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
        num_images: normalizedOutputCount,
        aspect_ratio: ratioToKlingAspectRatio(ratio, "9:16"),
        output_format: "jpeg",
      },
    };
  }

  if (referenceImageUrl) {
    if (
      routing?.referenceStrategy === "identity-first" &&
      routing.identityMode === "active"
    ) {
      return buildIdentityVideoRequest(
        tier,
        prompt,
        ratio,
        resolution,
        referenceImageUrl,
      );
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

function normalizeWan25Resolution(value: string | null, defaultResolution: string) {
  const resolution = value?.toLowerCase() ?? "";
  const supportedImageToVideo = new Set(["480p", "720p", "1080p"]);

  return supportedImageToVideo.has(resolution) ? resolution : defaultResolution;
}

function normalizeImageOutputCount(value: number | null) {
  if (!value || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(MAX_IMAGE_OUTPUT_COUNT, Math.floor(value)));
}

function normalizeWanTextResolution(value: string | null, defaultResolution: string) {
  const resolution = value?.toLowerCase() ?? "";
  const supportedTextToVideo = new Set(["720p", "1080p"]);

  if (resolution === "480p") {
    return "720p";
  }

  return supportedTextToVideo.has(resolution) ? resolution : defaultResolution;
}

function getStandardModelId(
  mode: Mode,
  tier: AccountTier,
  hasReferenceImage: boolean,
  outputCount?: number | null,
) {
  if (mode === "image") {
    void tier;
    if (isPhotoPackRequest(mode, outputCount ?? null)) {
      return getPackModelId(hasReferenceImage);
    }

    if (hasReferenceImage) {
      return env.falProImageReferenceModel || FAL_MODELS.imageReferencePro;
    }

    return env.falProImageTextModel || FAL_MODELS.imageTextPro;
  }

  if (hasReferenceImage) {
    return tier === "free"
      ? FAL_MODELS.videoReferenceEconomy
      : FAL_MODELS.videoReference;
  }

  return tier === "free" ? FAL_MODELS.videoTextEconomy : FAL_MODELS.videoText;
}

function getRequestedModelId(
  mode: Mode,
  tier: AccountTier,
  hasReferenceImage: boolean,
  outputCount: number | null,
  routing: { referenceStrategy: ReferenceStrategy; identityMode: IdentityMode },
) {
  if (mode === "image") {
    void routing;
    return getStandardModelId(mode, tier, hasReferenceImage, outputCount);
  }

  if (
    hasReferenceImage &&
    !isPhotoPackRequest(mode, outputCount) &&
    routing.referenceStrategy === "identity-first" &&
    routing.identityMode === "active"
  ) {
    return getIdentityModelId(mode, tier) ??
      getStandardModelId(mode, tier, hasReferenceImage, outputCount);
  }

  return getStandardModelId(mode, tier, hasReferenceImage, outputCount);
}

function isFluxImageModel(modelId: string) {
  return /flux/i.test(modelId);
}

function isNanoBananaImageModel(modelId: string) {
  return /nano-banana/i.test(modelId);
}

function isGptImageModel(modelId: string) {
  return /gpt-image-2/i.test(modelId);
}

function ratioToGptImageSize(ratio: string | null) {
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

function ratioToNanoBananaAspectRatio(
  ratio: string | null,
  fallbackAspectRatio: string,
) {
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

function ratioToKlingAspectRatio(
  ratio: string | null,
  fallbackAspectRatio: string,
) {
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

function ratioToWanAspectRatio(ratio: string | null) {
  switch (ratio) {
    case "1:1":
    case "3:4":
    case "4:3":
    case "9:16":
    case "16:9":
      return ratio;
    case "4:5":
      return "3:4";
    default:
      return undefined;
  }
}

function ratioToFluxAspectRatio(
  ratio: string | null,
  fallbackAspectRatio: string,
) {
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

function ratioToVeoLiteAspectRatio(ratio: string | null) {
  return ratio === "16:9" ? "16:9" : "9:16";
}

async function enforceRateLimit(req: Request, accountId: string) {
  const ipAddress = getClientIp(req);
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS,
  ).toISOString();
  const bucketKey = `${accountId}:${ipAddress ?? "unknown"}:${windowStart}`;

  const { data, error } = await supabase!
    .from("generation_rate_limits")
    .select("request_count")
    .eq("bucket_key", bucketKey)
    .maybeSingle<{ request_count: number }>();

  if (error) {
    throw new HttpError(502, "RATE_LIMIT_LOOKUP_FAILED", error.message);
  }

  const nextCount = (data?.request_count ?? 0) + 1;

  if (nextCount > RATE_LIMIT_MAX_STARTS_PER_HOUR) {
    throw new HttpError(
      429,
      "GENERATION_RATE_LIMITED",
      "Too many generation requests. Try again later.",
    );
  }

  const { error: upsertError } = await supabase!
    .from("generation_rate_limits")
    .upsert({
      bucket_key: bucketKey,
      account_id: accountId,
      ip_address: ipAddress,
      window_start: windowStart,
      request_count: nextCount,
      updated_at: now.toISOString(),
    });

  if (upsertError) {
    throw new HttpError(502, "RATE_LIMIT_UPDATE_FAILED", upsertError.message);
  }
}

function getAccountId(req: Request) {
  const accountId = req.headers.get("x-account-id")?.trim();

  if (!accountId) {
    throw new HttpError(400, "MISSING_ACCOUNT_ID", "Missing account id.");
  }

  return accountId;
}

function getClientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

function getFalRequestId(response: unknown) {
  const candidate = response as { request_id?: unknown; requestId?: unknown };
  const requestId = candidate.request_id ?? candidate.requestId;

  if (typeof requestId !== "string" || !requestId.trim()) {
    throw new HttpError(
      502,
      "FAL_INVALID_RESPONSE",
      "fal.ai did not return a request id.",
    );
  }

  return requestId;
}

function getProviderErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "The provider could not process this generation.";
}

function getProviderErrorStatus(error: unknown) {
  const value = error as { status?: unknown; response?: { status?: unknown } };
  const status = value?.status ?? value?.response?.status;
  return typeof status === "number" ? status : null;
}

function isFalProviderValidationError(error: unknown) {
  const status = getProviderErrorStatus(error);
  const message = getProviderErrorMessage(error);

  return (
    (typeof status === "number" && status >= 400 && status < 500) ||
    /unprocessable entity|validation|invalid/i.test(message)
  );
}

function isTransientFalStatusLookupError(error: unknown) {
  const status = getProviderErrorStatus(error);
  const message = getProviderErrorMessage(error);

  if (status === null) {
    return true;
  }

  if (status === 404 || status === 408 || status === 409 || status === 425 || status === 429) {
    return true;
  }

  if (status >= 500) {
    return true;
  }

  return /failed to fetch the generation status|request.*not found|timeout|temporar|unavailable|network|connection/i
    .test(message);
}

function isTransientFalResultLookupError(error: unknown) {
  const status = getProviderErrorStatus(error);
  const message = getProviderErrorMessage(error);

  if (status === null) {
    return true;
  }

  if (status === 400 || status === 404 || status === 408 || status === 409 || status === 425 || status === 429) {
    return true;
  }

  if (status >= 500) {
    return true;
  }

  return /not completed|not ready|request.*not found|timeout|temporar|unavailable|network|connection/i
    .test(message);
}

function hasFalModelEndpointSubpath(modelId: string) {
  return modelId.split("/").filter(Boolean).length > 2;
}

function getOutputsFromFalResult(data: unknown) {
  const container = data as {
    data?: unknown;
    response?: unknown;
    payload?: unknown;
  };
  const source = container?.data ?? container?.response ?? container?.payload ?? data;
  const value = source as {
    images?: Array<{ url?: unknown }>;
    image?: { url?: unknown };
    video?: { url?: unknown };
    response?: {
      images?: Array<{ url?: unknown }>;
      image?: { url?: unknown };
      video?: { url?: unknown };
    };
  };
  const responsePayload = value.response ?? value;
  const imageUrls = Array.isArray(responsePayload.images)
    ? responsePayload.images
        .map((image) => image?.url)
        .filter((url): url is string => typeof url === "string" && Boolean(url))
      : [];
  const singleImageUrl = typeof responsePayload.image?.url === "string" && responsePayload.image.url
    ? responsePayload.image.url
    : null;

  if (imageUrls.length > 0) {
    return imageUrls;
  }

  if (singleImageUrl) {
    return [singleImageUrl];
  }

  return typeof responsePayload.video?.url === "string" && responsePayload.video.url
    ? [responsePayload.video.url]
    : [];
}

function getPreviewUrl(data: unknown, outputs: string[]) {
  const container = data as {
    data?: unknown;
  };
  const source = container?.data ?? data;
  const value = source as { preview_url?: unknown; previewUrl?: unknown };

  if (typeof value.preview_url === "string" && value.preview_url) {
    return value.preview_url;
  }

  if (typeof value.previewUrl === "string" && value.previewUrl) {
    return value.previewUrl;
  }

  return outputs[0] ?? undefined;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function jsonError(error: unknown) {
  if (isGenerationJobsSchemaError(error)) {
    return json(
      {
        message: "Generation backend is updating. Try again in a minute.",
        code: "BACKEND_SCHEMA_OUTDATED",
      },
      { status: 503 },
    );
  }

  if (error instanceof HttpError) {
    return json(
      { message: error.message, code: error.code },
      { status: error.status },
    );
  }

  const message = error instanceof Error ? error.message : "Request failed.";
  return json({ message, code: "GENERATION_PROXY_FAILED" }, { status: 502 });
}
