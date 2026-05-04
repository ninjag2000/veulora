export interface ServerGenerationCreateResponse {
  jobId?: string;
  job_id?: string;
  status?: string;
  estimatedWaitSec?: number;
  estimated_wait_sec?: number;
  historyItemId?: string;
  history_item_id?: string;
  effectiveTier?: "free" | "pro";
  effective_tier?: "free" | "pro";
  effectiveModelId?: string;
  effective_model_id?: string;
  effectiveResolution?: string;
  effective_resolution?: string;
  retryCount?: number;
  retry_count?: number;
  debug?: {
    referenceStrategy?: string;
    identityMode?: string;
    referenceSource?: string;
    effectiveModelId?: string;
    effectiveResolution?: string;
  };
}

export interface ServerGenerationStatusResponse {
  jobId?: string;
  job_id?: string;
  status?: string;
  progressPercent?: number;
  progress_percent?: number;
  currentStage?: string;
  current_stage?: string;
  previewUrl?: string;
  preview_url?: string;
  outputs?: string[];
  outputUrls?: string[];
  output_urls?: string[];
  retryCount?: number;
  retry_count?: number;
  errorCode?: string;
  error_code?: string;
  errorMessage?: string;
  error_message?: string;
  debug?: {
    referenceStrategy?: string;
    identityMode?: string;
    referenceSource?: string;
    effectiveModelId?: string;
    activeJobId?: string;
    lastError?: string;
  };
}
