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
  const extension = referenceImageUri.split(".").pop()?.toLowerCase() ?? "jpg";
  const type =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  return {
    uri: referenceImageUri,
    name: `reference.${extension}`,
    type,
  } as any;
}

export async function createRemoteGenerationJob(
  params: CreateGenerationParams,
  template: Template,
  accountId: string
) {
  const endpoint =
    template.modeType === "video" ? "/generation/video" : "/generation/image";

  const payloadBase = {
    templateId: template.id,
    template_id: template.id,
    prompt: params.prompt.trim(),
    ratio: params.ratio,
    generationCost: template.generationCost,
    generation_cost: template.generationCost,
    modeType: template.modeType,
    mode_type: template.modeType,
  };

  const response = params.referenceImageUri
    ? await (() => {
        const formData = new FormData();
        formData.append("templateId", template.id);
        formData.append("prompt", params.prompt.trim());
        if (params.ratio) {
          formData.append("ratio", params.ratio);
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
