import type {
  AppEntitlements,
  BootstrapPayload,
  ExitOffer,
  FeaturedBanner,
  GenerationJob,
  GenerationSnapshot,
  GenerationStatus,
  HistoryItem,
  OnboardingSlide,
  PhotoGuidelinesContent,
  PresetSection,
  SubscriptionPlan,
  Template,
  VideoSection,
} from "@/lib/types";
import type {
  ServerGenerationCreateResponse,
  ServerGenerationStatusResponse,
} from "@/lib/api-types";

type Dict = Record<string, unknown>;

function asRecord(value: unknown): Dict | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Dict;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asObjectArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Dict => Boolean(asRecord(item)))
    : [];
}

function mapOnboardingSlide(data: Dict): OnboardingSlide {
  return {
    id: asString(data.id),
    title: asString(data.title),
    subtitle: asString(data.subtitle) || undefined,
    heroAsset: asString(data.heroAsset ?? data.hero_asset),
    insetAsset: asString(data.insetAsset ?? data.inset_asset) || undefined,
    theme:
      (asString(data.theme, "portrait") as OnboardingSlide["theme"]) ?? "portrait",
    animationType:
      (asString(data.animationType ?? data.animation_type, "float") as OnboardingSlide["animationType"]) ??
      "float",
    ctaLabel: asString(data.ctaLabel ?? data.cta_label, "Continue"),
  };
}

function mapTemplate(data: Dict): Template {
  return {
    id: asString(data.id),
    kind: (asString(data.kind) as Template["kind"]) || undefined,
    title: asString(data.title),
    subtitle: asString(data.subtitle) || undefined,
    description: asString(data.description),
    category: asString(data.category),
    stylePrompt:
      asString(data.stylePrompt ?? data.style_prompt) || undefined,
    compositionPrompt:
      asString(data.compositionPrompt ?? data.composition_prompt) || undefined,
    styleReferenceUrl:
      asString(data.styleReferenceUrl ?? data.style_reference_url) || undefined,
    compositionReferenceUrl:
      asString(data.compositionReferenceUrl ?? data.composition_reference_url) ||
      undefined,
    coverUrl: asString(data.coverUrl ?? data.cover_image ?? data.cover_url),
    examples: asStringArray(data.examples),
    previewVideoUrl:
      asString(data.previewVideoUrl ?? data.preview_video_url) || undefined,
    modeType: asString(data.modeType ?? data.mode_type, "image") as Template["modeType"],
    referenceMode:
      (asString(
        data.referenceMode ?? data.reference_mode,
        "none"
      ) as Template["referenceMode"]) || undefined,
    isPro: asBoolean(data.isPro ?? data.is_pro),
    defaultPrompt: asString(data.defaultPrompt ?? data.default_prompt),
    generationCost: asNumber(data.generationCost ?? data.generation_cost, 0),
    inputRequirements: asStringArray(
      data.inputRequirements ?? data.input_requirements
    ),
    previewCount: asNumber(data.previewCount ?? data.preview_count, 0) || undefined,
    photoPackSize:
      asNumber(data.photoPackSize ?? data.photo_pack_size, 0) || undefined,
    motionPreset: asString(data.motionPreset ?? data.motion_preset) || undefined,
  };
}

function mapFeaturedBanner(data: Dict): FeaturedBanner {
  return {
    id: asString(data.id),
    title: asString(data.title),
    subtitle: asString(data.subtitle),
    imageUrl: asString(data.imageUrl ?? data.image_url),
    ctaLabel: asString(data.ctaLabel ?? data.cta_label, "Try now"),
    presetId: asString(data.presetId ?? data.preset_id),
    isPro: asBoolean(data.isPro ?? data.is_pro),
  };
}

function mapPresetSection(data: Dict): PresetSection {
  return {
    id: asString(data.id),
    title: asString(data.title),
    layoutType: asString(data.layoutType ?? data.layout_type, "hero") as PresetSection["layoutType"],
    items: asObjectArray(data.items).map(mapTemplate),
    seeAllSlug: asString(data.seeAllSlug ?? data.see_all_slug) || undefined,
  };
}

function mapVideoSection(data: Dict): VideoSection {
  return {
    id: asString(data.id),
    title: asString(data.title),
    items: asObjectArray(data.items).map(mapTemplate),
    seeAllSlug: asString(data.seeAllSlug ?? data.see_all_slug),
  };
}

function mapSubscriptionPlan(data: Dict): SubscriptionPlan {
  return {
    id: asString(data.id),
    title: asString(data.title),
    subtitle: asString(data.subtitle),
    allowance: asString(data.allowance),
    priceText: asString(data.priceText ?? data.price_text),
    period: asString(data.period),
    badgeText: asString(data.badgeText ?? data.badge_text) || undefined,
    isDefault: asBoolean(data.isDefault ?? data.is_default),
    productId: asString(data.productId ?? data.product_id) || undefined,
    offeringId: asString(data.offeringId ?? data.offering_id) || undefined,
    packageType: asString(data.packageType ?? data.package_type) || undefined,
  };
}

function mapPhotoGuidelines(data: Dict): PhotoGuidelinesContent {
  return {
    title: asString(data.title),
    goodTitle: asString(data.goodTitle ?? data.good_title),
    badTitle: asString(data.badTitle ?? data.bad_title),
    goodCriteria: asStringArray(data.goodCriteria ?? data.good_criteria),
    badCriteria: asStringArray(data.badCriteria ?? data.bad_criteria),
    goodExamples: asStringArray(data.goodExamples ?? data.good_examples),
    badExamples: asStringArray(data.badExamples ?? data.bad_examples),
  };
}

function mapExitOffer(data: Dict): ExitOffer {
  return {
    id: asString(data.id),
    discountPercent: asNumber(
      data.discountPercent ?? data.discount_percent,
      0
    ),
    planId: asString(data.planId ?? data.plan_id) || undefined,
    title: asString(data.title),
    subtitle: asString(data.subtitle) || undefined,
    oldPrice: asString(data.oldPrice ?? data.old_price),
    newPrice: asString(data.newPrice ?? data.new_price),
    durationMs: asNumber(data.durationMs ?? data.duration_ms, 0),
    tokenGrant: asNumber(data.tokenGrant ?? data.token_grant, 0),
    grantsPro: asBoolean(data.grantsPro ?? data.grants_pro),
    productId: asString(data.productId ?? data.product_id) || undefined,
    offeringId: asString(data.offeringId ?? data.offering_id) || undefined,
    packageType: asString(data.packageType ?? data.package_type) || undefined,
  };
}

export function mapBootstrapPayload(data: unknown): Partial<BootstrapPayload> {
  const value = asRecord(data);

  if (!value) {
    return {};
  }

  return {
    brandName: asString(value.brandName ?? value.brand_name),
    onboardingSlides: asObjectArray(
      value.onboardingSlides ?? value.onboarding_slides
    ).map(mapOnboardingSlide),
    featuredBanner: asRecord(value.featuredBanner ?? value.featured_banner)
      ? mapFeaturedBanner(
          asRecord(value.featuredBanner ?? value.featured_banner) as Dict
        )
      : undefined,
    imageSections: asObjectArray(
      value.imageSections ?? value.image_sections
    ).map(mapPresetSection),
    videoSections: asObjectArray(
      value.videoSections ?? value.video_sections
    ).map(mapVideoSection),
    subscriptionPlans: asObjectArray(
      value.subscriptionPlans ?? value.subscription_plans
    ).map(mapSubscriptionPlan),
    paywallBenefits: asStringArray(
      value.paywallBenefits ?? value.paywall_benefits
    ),
    paywallHeroAssets: asStringArray(
      value.paywallHeroAssets ?? value.paywall_hero_assets
    ),
    exitOffer: asRecord(value.exitOffer ?? value.exit_offer)
      ? mapExitOffer(asRecord(value.exitOffer ?? value.exit_offer) as Dict)
      : undefined,
    photoGuidelines: asRecord(value.photoGuidelines ?? value.photo_guidelines)
      ? mapPhotoGuidelines(
          asRecord(value.photoGuidelines ?? value.photo_guidelines) as Dict
        )
      : undefined,
  };
}

export function mapEntitlementsPayload(data: unknown): AppEntitlements | null {
  const value = asRecord(data);

  if (!value) {
    return null;
  }

  return {
    isPro: asBoolean(value.isPro ?? value.is_pro),
    currentCredits: asNumber(value.currentCredits ?? value.current_credits, 0),
    subscriptionPlan:
      asString(value.subscriptionPlan ?? value.subscription_plan) || null,
    dailyFreeRemaining: asNumber(
      value.dailyFreeRemaining ?? value.daily_free_remaining,
      0
    ),
  };
}

export function mapHistoryItem(data: unknown): HistoryItem | null {
  const value = asRecord(data);

  if (!value) {
    return null;
  }

  return {
    id: asString(value.id),
    jobId: asString(value.jobId ?? value.job_id),
    templateId:
      asString(value.templateId ?? value.template_id) || undefined,
    type: asString(value.type, "image") as HistoryItem["type"],
    status: asString(value.status, "processing") as HistoryItem["status"],
    previewUrl: asString(value.previewUrl ?? value.preview_url),
    outputUrls: asStringArray(
      value.outputUrls ?? value.output_urls ?? value.outputs
    ),
    createdAt:
      asString(value.createdAt ?? value.created_at) || new Date().toISOString(),
    presetTitle: asString(value.presetTitle ?? value.preset_title),
    promptSnippet: asString(value.promptSnippet ?? value.prompt_snippet),
    isProResult: asBoolean(value.isProResult ?? value.is_pro_result),
    errorMessage:
      asString(value.errorMessage ?? value.error_message) || undefined,
  };
}

export function mapHistoryPayload(data: unknown) {
  if (Array.isArray(data)) {
    return data.map(mapHistoryItem).filter((item): item is HistoryItem => Boolean(item));
  }

  const value = asRecord(data);
  const items = Array.isArray(value?.items)
    ? value.items
    : Array.isArray(value?.historyItems)
    ? value.historyItems
    : Array.isArray(value?.history_items)
    ? value.history_items
    : [];

  return items.map(mapHistoryItem).filter((item): item is HistoryItem => Boolean(item));
}

export function mapGenerationCreatePayload(data: ServerGenerationCreateResponse) {
  return {
    jobId: asString(data.jobId ?? data.job_id),
    status: asString(data.status, "queued") as GenerationStatus,
    estimatedWaitSec: asNumber(
      data.estimatedWaitSec ?? data.estimated_wait_sec,
      0
    ),
    historyItemId: asString(data.historyItemId ?? data.history_item_id),
  };
}

export function getHelperTextForStatus(
  mode: GenerationJob["mode"],
  status: GenerationStatus
) {
  switch (status) {
    case "queued":
      return "We are preparing your request.";
    case "uploading":
      return "Uploading your reference assets.";
    case "processing":
      return mode === "video"
        ? "Video generation may take a little longer."
        : "Your result will be saved to History automatically.";
    case "finalizing":
      return "Adding the final polish to your result.";
    case "completed":
      return "Your result is ready.";
    case "failed":
      return "Something went wrong while generating.";
  }
}

export function mapRemoteStatusToSnapshot(
  job: GenerationJob,
  data: ServerGenerationStatusResponse
): GenerationSnapshot {
  const status = asString(data.status, job.status) as GenerationStatus;
  const currentStage =
    asString(data.currentStage ?? data.current_stage) ||
    (status === "processing" && job.mode === "video"
      ? "Rendering your video"
      : status === "processing"
      ? "Creating your image"
      : job.currentStage);

  return {
    status,
    progressPercent: asNumber(
      data.progressPercent ?? data.progress_percent,
      job.progressPercent
    ),
    currentStage,
    helperText: getHelperTextForStatus(job.mode, status),
    errorMessage: asString(data.errorMessage ?? data.error_message) || undefined,
  };
}
