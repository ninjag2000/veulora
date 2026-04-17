export interface ServerGenerationCreateResponse {
  jobId?: string;
  job_id?: string;
  status?: string;
  estimatedWaitSec?: number;
  estimated_wait_sec?: number;
  historyItemId?: string;
  history_item_id?: string;
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
  errorCode?: string;
  error_code?: string;
  errorMessage?: string;
  error_message?: string;
}
