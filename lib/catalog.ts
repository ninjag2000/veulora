import { bootstrapPayload, templates } from "@/lib/mock-data";
import type { BootstrapPayload, Template, TemplateMode } from "@/lib/types";

function normalizePresetIdParts(id: string) {
  const normalized = id.toLowerCase();
  const hyphenated = normalized.replace(/[_\s]+/g, "-");
  const compact = normalized.replace(/[^a-z0-9]+/g, "");

  return { hyphenated, compact };
}

function isExplicitVideoContentLabPresetId(id: string | null | undefined) {
  if (!id) {
    return false;
  }

  const { hyphenated, compact } = normalizePresetIdParts(id);

  return (
    hyphenated.includes("video-content-lab") ||
    hyphenated.includes("content-lab-video") ||
    compact.includes("videocontentlab") ||
    compact.includes("contentlabvideo")
  );
}

export function isContentLabPresetId(id: string | null | undefined) {
  if (!id) {
    return false;
  }

  const { hyphenated, compact } = normalizePresetIdParts(id);

  return hyphenated.includes("content-lab") || compact.includes("contentlab");
}

export function isVideoContentLabPresetId(id: string | null | undefined) {
  if (!id) {
    return false;
  }

  return isExplicitVideoContentLabPresetId(id) || isContentLabPresetId(id);
}

export function getAllTemplates(catalog: BootstrapPayload) {
  const seen = new Map<string, Template>();

  for (const item of catalog.imageSections.flatMap((section) => section.items)) {
    seen.set(item.id, item);
  }

  for (const item of catalog.videoSections.flatMap((section) => section.items)) {
    seen.set(item.id, item);
  }

  const featured = catalog.imageSections
    .flatMap((section) => section.items)
    .find((item) => item.id === catalog.featuredBanner.presetId);

  if (featured) {
    seen.set(featured.id, featured);
  }

  return [...seen.values()];
}

export function findTemplateById(catalog: BootstrapPayload, id: string) {
  return getAllTemplates(catalog).find((item) => item.id === id);
}

export function getContentLabFallbackTemplate() {
  return (
    templates.find((item) => item.id === "content-lab") ??
    getAllTemplates(bootstrapPayload).find((item) => item.id === "content-lab")
  );
}

export function getVideoContentLabFallbackTemplate() {
  return (
    templates.find((item) => item.id === "content-lab-video") ??
    getAllTemplates(bootstrapPayload).find(
      (item) => item.id === "content-lab-video"
    )
  );
}

export function findTemplateByIdWithContentLabFallback(
  catalog: BootstrapPayload,
  id: string,
  expectedMode?: TemplateMode
) {
  const template = findTemplateById(catalog, id);

  if (template && (!expectedMode || template.modeType === expectedMode)) {
    return template;
  }

  if (expectedMode === "video" && isVideoContentLabPresetId(id)) {
    return getVideoContentLabFallbackTemplate();
  }

  if (expectedMode === "image" && isContentLabPresetId(id)) {
    return getContentLabFallbackTemplate();
  }

  if (isExplicitVideoContentLabPresetId(id)) {
    return getVideoContentLabFallbackTemplate();
  }

  if (isContentLabPresetId(id)) {
    return getContentLabFallbackTemplate();
  }

  return undefined;
}

export function findVideoSectionBySlug(catalog: BootstrapPayload, slug: string) {
  return catalog.videoSections.find((section) => section.seeAllSlug === slug);
}

export function findImageSectionBySlug(catalog: BootstrapPayload, slug: string) {
  return catalog.imageSections.find((section) => section.seeAllSlug === slug);
}

export function findPlanById(catalog: BootstrapPayload, id: string) {
  return catalog.subscriptionPlans.find((plan) => plan.id === id);
}
