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

export function createGenerationJob(
  params: CreateGenerationParams,
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
    createdAt: Date.now(),
    mockDurationMs: template.modeType === "video" ? 26000 : 15000,
    generationCost: template.generationCost,
    isPro: template.isPro,
    outputs: buildMockOutputs(template),
    shouldFail: failTerms.some((term) =>
      params.prompt.toLowerCase().includes(term)
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
  return template.examples.slice(0, 4);
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
