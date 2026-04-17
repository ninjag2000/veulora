import type { BootstrapPayload, Template, VideoSection } from "@/lib/types";

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

export function findVideoSectionBySlug(catalog: BootstrapPayload, slug: string) {
  return catalog.videoSections.find((section) => section.seeAllSlug === slug);
}

export function findPlanById(catalog: BootstrapPayload, id: string) {
  return catalog.subscriptionPlans.find((plan) => plan.id === id);
}
