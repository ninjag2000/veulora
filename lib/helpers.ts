import type { HistoryItem } from "@/lib/types";

export const STORAGE_KEY = "veloura.store.v1";
export const EXIT_OFFER_DURATION_MS = 24 * 60 * 60 * 1000;

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAccountId() {
  return `vlr_${Math.random().toString(36).slice(2, 6)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();
}

export function formatCredits(value: number) {
  return `${value} credits`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTimer(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0"
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function getFileExtension(url: string, fallback: "jpg" | "mp4") {
  const cleanUrl = url.split("?")[0] ?? url;
  const extension = cleanUrl.split(".").pop();
  if (!extension || extension.length > 5) {
    return fallback;
  }
  return extension;
}

export function getCurrentOutput(item: HistoryItem, index: number) {
  if (item.outputUrls.length === 0) {
    return item.previewUrl;
  }
  return item.outputUrls[index] ?? item.outputUrls[0];
}

export function isVideoAsset(url: string) {
  return url.includes(".mp4") || url.includes(".mov") || url.includes("video");
}
