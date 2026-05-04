import { apiRequest, jsonBody } from "@/services/api-client";
import { isLiveApiConfigured } from "@/lib/env";
import { generateId } from "@/lib/helpers";
import type {
  CreateGenerationParams,
  GenerationJob,
  HistoryItem,
  Template,
} from "@/lib/types";
import type {
  ServerGenerationCreateResponse,
  ServerGenerationStatusResponse,
} from "@/lib/api-types";
import {
  getHelperTextForStatus,
  mapGenerationCreatePayload,
  mapRemoteStatusToSnapshot,
} from "@/services/backend-mappers";

function buildReferenceUploadPart(referenceImageUri: string) {
  const cleanUri = referenceImageUri.split("?")[0] ?? referenceImageUri;
  const rawExtension = cleanUri.split(".").pop()?.toLowerCase();
  const extension =
    rawExtension && ["jpg", "jpeg", "png", "webp"].includes(rawExtension)
      ? rawExtension
      : "jpg";
  const type =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";
  const nameExtension = extension === "jpeg" ? "jpg" : extension;

  return {
    uri: referenceImageUri,
    name: `reference.${nameExtension}`,
    type,
  } as any;
}

function getTemplateRemoteUrl(source: Template["coverUrl"] | Template["examples"][number]) {
  return typeof source === "string" && source.trim().length > 0 ? source : null;
}

function getStyleReferenceUrl(template: Template) {
  if (typeof template.styleReferenceUrl === "string" && template.styleReferenceUrl.trim()) {
    return template.styleReferenceUrl.trim();
  }

  return (
    template.examples.map(getTemplateRemoteUrl).find((item) => Boolean(item)) ??
    getTemplateRemoteUrl(template.coverUrl)
  );
}

function getCompositionReferenceUrl(template: Template) {
  if (
    typeof template.compositionReferenceUrl === "string" &&
    template.compositionReferenceUrl.trim()
  ) {
    return template.compositionReferenceUrl.trim();
  }

  return getTemplateRemoteUrl(template.coverUrl) ?? getStyleReferenceUrl(template);
}

export async function createRemoteGenerationJob(
  params: CreateGenerationParams & { prompt: string; modelPrompt?: string },
  template: Template,
  accountId: string
) {
  const requestPrompt = (params.modelPrompt ?? params.prompt).trim();
  const endpoint =
    template.modeType === "video" ? "/generation/video" : "/generation/image";
  const styleReferenceUrl = getStyleReferenceUrl(template);
  const compositionReferenceUrl = getCompositionReferenceUrl(template);

  const payloadBase = {
    templateId: template.id,
    template_id: template.id,
    prompt: requestPrompt,
    referenceMode: template.referenceMode,
    reference_mode: template.referenceMode,
    ratio: params.ratio,
    resolution: params.resolution,
    outputCount: params.outputCount,
    output_count: params.outputCount,
    styleReferenceUrl,
    style_reference_url: styleReferenceUrl,
    compositionReferenceUrl,
    composition_reference_url: compositionReferenceUrl,
    generationCost: template.generationCost,
    generation_cost: template.generationCost,
    modeType: template.modeType,
    mode_type: template.modeType,
  };

  const response = params.referenceImageUri
      ? await (() => {
        const formData = new FormData();
        formData.append("templateId", template.id);
        formData.append("prompt", requestPrompt);
        if (template.referenceMode) {
          formData.append("referenceMode", template.referenceMode);
        }
        if (params.ratio) {
          formData.append("ratio", params.ratio);
        }
        if (params.resolution) {
          formData.append("resolution", params.resolution);
        }
        if (params.outputCount) {
          formData.append("outputCount", String(params.outputCount));
        }
        if (template.generationCost > 0) {
          formData.append("generationCost", String(template.generationCost));
        }
        if (styleReferenceUrl) {
          formData.append("styleReferenceUrl", styleReferenceUrl);
        }
        if (compositionReferenceUrl) {
          formData.append("compositionReferenceUrl", compositionReferenceUrl);
        }
        formData.append(
          "referenceImage",
          buildReferenceUploadPart(params.referenceImageUri)
        );
        return apiRequest<ServerGenerationCreateResponse>(endpoint, {
          method: "POST",
          accountId,
          body: formData,
        });
      })()
    : await apiRequest<ServerGenerationCreateResponse>(endpoint, {
        method: "POST",
        accountId,
        body: jsonBody(payloadBase),
      });

  const mapped = mapGenerationCreatePayload(response);
  const status = mapped.status;
  const helperText = getHelperTextForStatus(template.modeType, status);

  const job: GenerationJob = {
    id: mapped.jobId || generateId("remote_job"),
    historyItemId: mapped.historyItemId || generateId("history"),
    engine: "remote",
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
    generationCost: template.generationCost,
    isPro: template.isPro,
    outputs: [],
    status,
    progressPercent: 0,
    currentStage:
      status === "processing"
        ? template.modeType === "video"
          ? "Rendering your video"
          : "Creating your image"
        : "Preparing your request",
    helperText,
    estimatedWaitSec: mapped.estimatedWaitSec || undefined,
    lastPolledAt: Date.now(),
  };

  const historyItem: HistoryItem = {
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

  return { job, historyItem };
}

export async function pollRemoteGenerationJob(
  accountId: string,
  job: GenerationJob
) {
  if (!isLiveApiConfigured()) {
    return job;
  }

  const response = await apiRequest<ServerGenerationStatusResponse>(
    `/generation/${encodeURIComponent(job.id)}`,
    {
      method: "GET",
      accountId,
    }
  );

  const snapshot = mapRemoteStatusToSnapshot(job, response);
  const outputs =
    response.outputs ?? response.outputUrls ?? response.output_urls ?? job.outputs;
  const previewAsset =
    response.previewUrl ?? response.preview_url ?? outputs?.[0] ?? job.previewAsset;

  return {
    ...job,
    previewAsset,
    outputs,
    status: snapshot.status,
    progressPercent: snapshot.progressPercent,
    currentStage: snapshot.currentStage,
    helperText: snapshot.helperText,
    errorMessage: snapshot.errorMessage,
    lastPolledAt: Date.now(),
  } satisfies GenerationJob;
}
