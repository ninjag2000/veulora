import { bootstrapPayload } from "@/lib/mock-data";
import type {
  AppEntitlements,
  BootstrapPayload,
  HistoryItem,
  PersistedStore,
} from "@/lib/types";
import { delay } from "@/lib/helpers";
import { apiRequest } from "@/services/api-client";
import {
  mapBootstrapPayload,
  mapEntitlementsPayload,
  mapHistoryPayload,
} from "@/services/backend-mappers";
import { isLiveApiConfigured } from "@/lib/env";

function mergeCatalog(
  remote: Partial<BootstrapPayload>,
  fallback: BootstrapPayload
): BootstrapPayload {
  return {
    brandName: remote.brandName || fallback.brandName,
    onboardingSlides:
      remote.onboardingSlides?.length ? remote.onboardingSlides : fallback.onboardingSlides,
    featuredBanner: remote.featuredBanner ?? fallback.featuredBanner,
    imageSections:
      remote.imageSections?.length ? remote.imageSections : fallback.imageSections,
    videoSections:
      remote.videoSections?.length ? remote.videoSections : fallback.videoSections,
    subscriptionPlans:
      remote.subscriptionPlans?.length
        ? remote.subscriptionPlans
        : fallback.subscriptionPlans,
    paywallBenefits:
      remote.paywallBenefits?.length
        ? remote.paywallBenefits
        : fallback.paywallBenefits,
    paywallHeroAssets:
      remote.paywallHeroAssets?.length
        ? remote.paywallHeroAssets
        : fallback.paywallHeroAssets,
    exitOffer: remote.exitOffer ?? fallback.exitOffer,
    photoGuidelines: remote.photoGuidelines ?? fallback.photoGuidelines,
  };
}

export async function loadBootstrapCatalog(
  accountId: string,
  persisted: PersistedStore | null,
  initialEntitlements: AppEntitlements
) {
  if (!isLiveApiConfigured()) {
    await delay(1600);
    return {
      catalog: bootstrapPayload,
      entitlements: persisted?.entitlements ?? initialEntitlements,
      history: persisted?.history ?? ([] as HistoryItem[]),
    };
  }

  const [bootstrapResult, historyResult, entitlementsResult] =
    await Promise.allSettled([
      apiRequest<unknown>("/settings/bootstrap", {
        method: "GET",
        accountId,
      }),
      apiRequest<unknown>("/history", {
        method: "GET",
        accountId,
      }),
      apiRequest<unknown>("/entitlements", {
        method: "GET",
        accountId,
      }),
    ]);

  const catalog =
    bootstrapResult.status === "fulfilled"
      ? mergeCatalog(mapBootstrapPayload(bootstrapResult.value), bootstrapPayload)
      : bootstrapPayload;

  const history =
    historyResult.status === "fulfilled"
      ? mapHistoryPayload(historyResult.value)
      : persisted?.history ?? [];

  const entitlements =
    entitlementsResult.status === "fulfilled"
      ? mapEntitlementsPayload(entitlementsResult.value) ??
        persisted?.entitlements ??
        initialEntitlements
      : persisted?.entitlements ?? initialEntitlements;

  return {
    catalog,
    history,
    entitlements,
  };
}

export async function refreshRemoteEntitlements(accountId: string) {
  if (!isLiveApiConfigured()) {
    return null;
  }

  const response = await apiRequest<unknown>("/entitlements", {
    method: "GET",
    accountId,
  });

  return mapEntitlementsPayload(response);
}

export async function notifyRestorePurchases(accountId: string) {
  if (!isLiveApiConfigured()) {
    return;
  }

  await apiRequest("/restore-purchases", {
    method: "POST",
    accountId,
    body: JSON.stringify({}),
  });
}
