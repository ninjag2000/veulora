import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH =
  process.env.JOB_STORE_PATH?.trim() || path.join(SERVER_DIR, "data", "jobs.json");

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

export function loadJobs() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return new Map();
    const entries = Object.entries(parsed)
      .map(([jobId, value]) => [jobId, normalizeJobRecord(value)])
      .filter((entry) => entry[1] !== null);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

export function saveJobs(map) {
  ensureStoreDir();
  const entries = [...map.entries()]
    .map(([jobId, value]) => [jobId, normalizeJobRecord(value)])
    .filter((entry) => entry[1] !== null);
  const obj = Object.fromEntries(entries);
  fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2), "utf8");
}

function normalizeJobRecord(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const modelId = typeof value.modelId === "string" ? value.modelId : null;
  if (!modelId) {
    return null;
  }

  const mode = value.mode === "video" ? "video" : "image";
  const createdAt =
    typeof value.createdAt === "string" && value.createdAt.trim()
      ? value.createdAt
      : new Date().toISOString();
  const activeJobId =
    typeof value.activeJobId === "string" && value.activeJobId.trim()
      ? value.activeJobId
      : null;
  const retryCount =
    typeof value.retryCount === "number" && Number.isFinite(value.retryCount)
      ? value.retryCount
      : 0;
  const requestedModelId =
    typeof value.requestedModelId === "string" && value.requestedModelId.trim()
      ? value.requestedModelId
      : modelId;
  const effectiveModelId =
    typeof value.effectiveModelId === "string" && value.effectiveModelId.trim()
      ? value.effectiveModelId
      : modelId;
  const resolution =
    typeof value.resolution === "string" && value.resolution.trim()
      ? value.resolution
      : null;
  const lastError =
    typeof value.lastError === "string" && value.lastError.trim()
      ? value.lastError
      : null;
  const requestContext =
    value.requestContext && typeof value.requestContext === "object"
      ? value.requestContext
      : null;

  return {
    modelId,
    mode,
    createdAt,
    activeJobId,
    retryCount,
    requestedModelId,
    effectiveModelId,
    resolution,
    lastError,
    requestContext,
  };
}
