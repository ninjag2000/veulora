export type RootMode = "image" | "video" | "history";
export type TemplateMode = "image" | "video";
export type TemplateReferenceMode = "none" | "human-portrait" | "human-closeup";
export type PaywallMode = "soft" | "hard";
export type PaywallSource =
  | "onboarding"
  | "credit_limit"
  | "premium_feature"
  | "export"
  | "video_generation";
export type HistoryFilter = "all" | "image" | "video";
export type RatioOption = "1:1" | "3:4" | "4:5" | "9:16";
export type VideoResolution = "480p" | "720p" | "1080p";
export type TemplateImageSource = string | number;
export type GenerationStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "finalizing"
  | "completed"
  | "failed";

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle?: string;
  heroAsset: TemplateImageSource;
  insetAsset?: TemplateImageSource;
  theme: "portrait" | "fashion" | "editorial" | "motion";
  animationType:
    | "float"
    | "parallax"
    | "breathing"
    | "inset-reveal"
    | "motion-hint";
  ctaLabel: string;
}

export interface Template {
  id: string;
  kind?: "single" | "photoPack";
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  stylePrompt?: string;
  compositionPrompt?: string;
  styleReferenceUrl?: string;
  compositionReferenceUrl?: string;
  coverUrl: TemplateImageSource;
  examples: TemplateImageSource[];
  previewVideoUrl?: string;
  modeType: TemplateMode;
  referenceMode?: TemplateReferenceMode;
  isPro: boolean;
  defaultPrompt: string;
  generationCost: number;
  inputRequirements: string[];
  previewCount?: number;
  photoPackSize?: number;
  motionPreset?: string;
}

export interface FeaturedBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: TemplateImageSource;
  ctaLabel: string;
  presetId: string;
  isPro: boolean;
}

export interface PresetSection {
  id: string;
  title: string;
  layoutType: "hero" | "two-grid" | "single-banner" | "horizontal";
  items: Template[];
  seeAllSlug?: string;
}

export interface VideoSection {
  id: string;
  title: string;
  items: Template[];
  seeAllSlug: string;
}

export interface SubscriptionPlan {
  id: string;
  title: string;
  subtitle: string;
  allowance: string;
  priceText: string;
  period: string;
  badgeText?: string;
  isDefault: boolean;
  productId?: string;
  offeringId?: string;
  packageType?: string;
}

export interface ExitOffer {
  id: string;
  discountPercent: number;
  planId?: string;
  title: string;
  subtitle?: string;
  oldPrice: string;
  newPrice: string;
  durationMs: number;
  tokenGrant: number;
  grantsPro?: boolean;
  productId?: string;
  offeringId?: string;
  packageType?: string;
}

export interface PhotoGuidelinesContent {
  title: string;
  goodTitle: string;
  badTitle: string;
  goodCriteria: string[];
  badCriteria: string[];
  goodExamples: TemplateImageSource[];
  badExamples: TemplateImageSource[];
}

export interface BootstrapPayload {
  brandName: string;
  onboardingSlides: OnboardingSlide[];
  featuredBanner: FeaturedBanner;
  imageSections: PresetSection[];
  videoSections: VideoSection[];
  subscriptionPlans: SubscriptionPlan[];
  paywallBenefits: string[];
  paywallHeroAssets: TemplateImageSource[];
  exitOffer: ExitOffer;
  photoGuidelines: PhotoGuidelinesContent;
}

export interface AppEntitlements {
  isPro: boolean;
  currentCredits: number;
  subscriptionPlan: string | null;
  dailyFreeRemaining: number;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  videoGuidelinesSeen: boolean;
}

export interface GenerationJob {
  id: string;
  historyItemId: string;
  engine: "mock" | "remote";
  mode: TemplateMode;
  templateId: string;
  presetTitle: string;
  category: string;
  prompt: string;
  previewAsset: TemplateImageSource;
  referenceImageUri?: string;
  ratio?: RatioOption;
  resolution?: VideoResolution;
  outputCount?: number;
  createdAt: number;
  mockDurationMs?: number;
  generationCost: number;
  isPro: boolean;
  outputs: TemplateImageSource[];
  shouldFail?: boolean;
  status: GenerationStatus;
  progressPercent: number;
  currentStage: string;
  helperText: string;
  estimatedWaitSec?: number;
  lastPolledAt?: number;
  errorMessage?: string;
}

export interface GenerationSnapshot {
  status: GenerationStatus;
  progressPercent: number;
  currentStage: string;
  helperText: string;
  errorMessage?: string;
}

export interface HistoryItem {
  id: string;
  jobId: string;
  templateId?: string;
  type: TemplateMode;
  status: "completed" | "processing" | "failed";
  previewUrl: TemplateImageSource;
  outputUrls: TemplateImageSource[];
  createdAt: string;
  presetTitle: string;
  promptSnippet: string;
  isProResult: boolean;
  errorMessage?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
}

export interface CreateGenerationParams {
  templateId: string;
  prompt?: string;
  referenceImageUri?: string;
  ratio?: RatioOption;
  resolution?: VideoResolution;
  outputCount?: number;
}

export type CreateGenerationResult =
  | {
      kind: "success";
      jobId: string;
    }
  | {
      kind: "paywall";
      source: PaywallSource;
      message?: string;
    }
  | {
      kind: "error";
      message: string;
      temporaryBackendUnavailable?: boolean;
    };

export interface PersistedStore {
  onboardingCompleted: boolean;
  aiProcessingConsentAccepted?: boolean;
  accountId: string;
  entitlements: AppEntitlements;
  settings: AppSettings;
  history: HistoryItem[];
  jobs: GenerationJob[];
}
