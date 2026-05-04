import { generateId, clamp } from "@/lib/helpers";
import type {
  CreateGenerationParams,
  GenerationJob,
  GenerationSnapshot,
  HistoryItem,
  Template,
} from "@/lib/types";

const blockedTerms = ["nsfw", "nude", "weapon", "blood", "violence"];
const failTerms = ["timeout", "fail", "error"];

export function validatePromptSafety(prompt: string) {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) {
    return "Add a prompt before generating.";
  }
  if (normalized.length < 4) {
    return "Prompt is too short. Add a few more words.";
  }
  if (blockedTerms.some((term) => normalized.includes(term))) {
    return "This request is blocked by the safety policy. Try a safer prompt.";
  }
  return null;
}

function buildCardFirstImagePrompt(prompt: string, template: Template) {
  const stylePrompt =
    template.stylePrompt?.trim() ||
    template.description.trim() ||
    template.defaultPrompt.trim();
  const compositionPrompt =
    template.compositionPrompt?.trim() ||
    (template.kind === "photoPack"
      ? "Create a cohesive premium editorial photo series with consistent location, wardrobe palette, lighting setup, camera language, and color grade while varying poses and crop distance across the set."
      : template.referenceMode === "human-closeup"
      ? "Frame the result as a premium close-up portrait with a clear face, strong subject separation, refined skin texture, and polished studio-level composition."
      : "Frame the result as a single-subject editorial portrait with confident pose direction, readable environment design, natural anatomy, and clean foreground-background separation.");
  const outputInstruction =
    template.kind === "photoPack"
      ? "Generate the full set inside one unified preset concept instead of mixing different styles between images."
      : "Generate one final image that stays fully inside this preset concept.";

  return [
    "Follow the preset card art direction first.",
    `Preset style direction: ${stylePrompt}`,
    `Preset composition direction: ${compositionPrompt}`,
    outputInstruction,
    "Keep the final result inside the preset's lighting, palette, styling, camera feel, and environment logic.",
    "Treat the user's request as a refinement of subject details, expression, or small scene nuances, not as permission to switch to a different visual style.",
    `User request to interpret inside this preset: ${prompt.trim()}`,
  ].join(" ");
}

export function buildImageGenerationPrompt(prompt: string, template: Template) {
  return buildCardFirstImagePrompt(prompt, template);
}

export function buildImageReferencePrompt(prompt: string, template: Template) {
  const multiImageInstruction =
    template.kind === "photoPack"
      ? "Keep the same person consistent across every generated image in the set."
      : "Create one image of that same person in the preset scene.";

  return [
    buildCardFirstImagePrompt(prompt, template),
    "This is a reference-based edit, not a generic beautification pass.",
    "Use the uploaded reference photo as the person to preserve.",
    "Treat the uploaded reference crop as the subject anchor only, not as the final background or wardrobe scene.",
    "When extra preset reference images are provided, use them aggressively for composition, scene design, wardrobe direction, lighting, color palette, and finish.",
    "Use the first uploaded image as the identity subject anchor, the composition reference to control framing and camera language, and the style reference to control mood, styling, palette, and surface treatment.",
    "Apply the selected preset strongly enough that different preset cards produce clearly different edits from the same source photo.",
    "Place that same person naturally into the environment, styling, and composition implied by this preset.",
    "Keep the person's face, identity, skin tone, body proportions, and overall likeness clearly recognizable from the uploaded photo.",
    "Preserve the same facial structure, hairline, hair color, eyebrows, eyes, nose, lips, and age impression from the uploaded person.",
    "Do not beautify, idealize, de-age, re-cast, or transform the subject into a different woman or a generic beauty model.",
    "Do not change ethnicity, facial proportions, jawline, eye shape, nose shape, lip shape, or other identity-defining traits.",
    "Do not preserve the original selfie room, background clutter, or accidental camera angle unless the preset explicitly calls for it.",
    "Change the background, outfit styling, lighting, pose direction, and art direction as needed to match the preset clearly and visibly.",
    multiImageInstruction,
  ].join(" ");
}

export function buildVideoReferencePrompt(prompt: string) {
  return [
    prompt.trim(),
    "Use the uploaded reference photo as the exact person to preserve in the video.",
    "Treat the uploaded reference crop as the subject anchor only, not as the final background or wardrobe scene.",
    "Place that same person naturally into the preset scene, motion, lighting, styling, and environment implied by the preset.",
    "Keep the person's face, identity, skin tone, body proportions, and overall likeness recognizable from the uploaded photo throughout the clip.",
    "Preserve the same facial structure, hairline, hair color, eyebrows, eyes, nose, lips, and age impression from the uploaded person.",
    "Do not replace the subject with a lookalike, a prettier model, or a different person with softened or reshaped features.",
    "Animate that same person inside the preset setting instead of creating a different subject.",
  ].join(" ");
}

export function createGenerationJob(
  params: CreateGenerationParams & { prompt: string; modelPrompt?: string },
  template: Template
): GenerationJob {
  return {
    id: generateId("job"),
    historyItemId: generateId("history"),
    engine: "mock",
    mode: template.modeType,
    templateId: template.id,
    presetTitle: template.title,
    category: template.category,
    prompt: params.prompt.trim(),
    previewAsset: params.referenceImageUri ?? template.coverUrl,
    referenceImageUri: params.referenceImageUri,
    ratio: params.ratio,
    resolution: params.resolution,
    outputCount: params.outputCount,
    createdAt: Date.now(),
    mockDurationMs: template.modeType === "video" ? 26000 : 15000,
    generationCost: template.generationCost,
    isPro: template.isPro,
    outputs: buildMockOutputs(template),
    shouldFail: failTerms.some((term) =>
      (params.modelPrompt ?? params.prompt).toLowerCase().includes(term)
    ),
    status: "queued",
    progressPercent: 0,
    currentStage: "Preparing your request",
    helperText: "We are validating your inputs and warming up the pipeline.",
  };
}

function buildMockOutputs(template: Template) {
  if (template.modeType === "video") {
    return [template.previewVideoUrl ?? template.examples[0] ?? template.coverUrl];
  }
  return template.examples.slice(0, template.kind === "photoPack" ? 8 : 4);
}

export function deriveGenerationSnapshot(job: GenerationJob): GenerationSnapshot {
  if (job.engine === "remote") {
    return {
      status: job.status,
      progressPercent: job.progressPercent,
      currentStage: job.currentStage,
      helperText: job.helperText,
      errorMessage: job.errorMessage,
    };
  }

  const progress = clamp(
    (Date.now() - job.createdAt) / (job.mockDurationMs ?? 1),
    0,
    1
  );

  if (job.shouldFail && progress > 0.72) {
    return {
      status: "failed",
      progressPercent: 72,
      currentStage: "Generation failed",
      helperText: "Something went wrong while generating.",
      errorMessage: "The provider timed out before returning a valid result.",
    };
  }

  if (progress >= 1) {
    return {
      status: "completed",
      progressPercent: 100,
      currentStage: "Completed",
      helperText: "Your result is ready.",
    };
  }

  if (progress < 0.12) {
    return {
      status: job.referenceImageUri ? "uploading" : "queued",
      progressPercent: Math.round(progress * 100),
      currentStage: job.referenceImageUri
        ? "Uploading assets"
        : "Preparing your request",
      helperText: "We are validating your inputs and warming up the pipeline.",
    };
  }

  if (progress < 0.28) {
    return {
      status: "processing",
      progressPercent: Math.round(progress * 100),
      currentStage: "Preparing model",
      helperText: "This usually takes less than a minute.",
    };
  }

  if (progress < 0.88) {
    return {
      status: "processing",
      progressPercent: Math.round(progress * 100),
      currentStage: job.mode === "video" ? "Rendering your video" : "Creating your image",
      helperText:
        job.mode === "video"
          ? "Video generation may take a little longer."
          : "Your result will be saved to History automatically.",
    };
  }

  return {
    status: "finalizing",
    progressPercent: Math.round(progress * 100),
    currentStage: "Finalizing",
    helperText: "Adding the last polish and preparing your result.",
  };
}

export function buildProcessingHistoryItem(job: GenerationJob): HistoryItem {
  return {
    id: job.historyItemId,
    jobId: job.id,
    templateId: job.templateId,
    type: job.mode,
    status: "processing",
    previewUrl: job.previewAsset,
    outputUrls: [],
    createdAt: new Date(job.createdAt).toISOString(),
    presetTitle: job.presetTitle,
    promptSnippet: job.prompt,
    isProResult: job.isPro,
  };
}

export function buildCompletedHistoryItem(job: GenerationJob): HistoryItem {
  return {
    id: job.historyItemId,
    jobId: job.id,
    templateId: job.templateId,
    type: job.mode,
    status: "completed",
    previewUrl: job.mode === "image" ? job.outputs[0] ?? job.previewAsset : job.previewAsset,
    outputUrls: job.outputs,
    createdAt: new Date(job.createdAt).toISOString(),
    presetTitle: job.presetTitle,
    promptSnippet: job.prompt,
    isProResult: job.isPro,
  };
}

export function buildFailedHistoryItem(job: GenerationJob, errorMessage: string) {
  return {
    id: job.historyItemId,
    jobId: job.id,
    templateId: job.templateId,
    type: job.mode,
    status: "failed",
    previewUrl: job.previewAsset,
    outputUrls: [],
    createdAt: new Date(job.createdAt).toISOString(),
    presetTitle: job.presetTitle,
    promptSnippet: job.prompt,
    isProResult: job.isPro,
    errorMessage,
  } satisfies HistoryItem;
}
