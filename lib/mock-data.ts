import type {
  BootstrapPayload,
  FeaturedBanner,
  OnboardingSlide,
  PresetSection,
  SubscriptionPlan,
  Template,
  VideoSection,
} from "@/lib/types";
import { EXIT_OFFER_DURATION_MS } from "@/lib/helpers";

const gallery = {
  portraitA:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
  portraitB:
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  portraitC:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
  portraitD:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
  portraitE:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
  portraitF:
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80",
  fashionA:
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
  fashionB:
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
  fashionC:
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
  fashionD:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
  glamA:
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=1200&q=80",
  glamB:
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
  glamC:
    "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=1200&q=80",
  videoPoster:
    "https://images.unsplash.com/photo-1508182314998-3bd49473002f?auto=format&fit=crop&w=1200&q=80",
  videoPosterB:
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80",
  videoPosterC:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  goodA:
    "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=800&q=80",
  goodB:
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=800&q=80",
  badA:
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=30",
  badB:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=25",
};

const sampleVideo = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "styles",
    title: "Try yourself in different looks and styles",
    heroAsset: gallery.portraitA,
    insetAsset: gallery.portraitC,
    theme: "portrait",
    animationType: "float",
    ctaLabel: "Continue",
  },
  {
    id: "outfit",
    title: "Change location, outfit and look in one tap",
    heroAsset: gallery.fashionA,
    insetAsset: gallery.portraitB,
    theme: "fashion",
    animationType: "parallax",
    ctaLabel: "Continue",
  },
  {
    id: "prompt",
    title: "Write your ideas and enjoy the result",
    subtitle: "Portrait in cinematic lavender lighting with editorial styling.",
    heroAsset: gallery.glamA,
    theme: "editorial",
    animationType: "breathing",
    ctaLabel: "Continue",
  },
  {
    id: "video",
    title: "Turn your photos into realistic videos",
    heroAsset: gallery.videoPoster,
    insetAsset: gallery.portraitD,
    theme: "motion",
    animationType: "motion-hint",
    ctaLabel: "Start creating",
  },
];

export const templates: Template[] = [
  {
    id: "content-lab",
    title: "Content Lab",
    subtitle: "Your fastest route to premium AI portraits",
    description:
      "Turn one photo and a short prompt into polished editorial content.",
    category: "Portrait",
    coverUrl: gallery.glamA,
    examples: [gallery.glamA, gallery.glamB, gallery.glamC, gallery.portraitE],
    modeType: "image",
    isPro: false,
    defaultPrompt: "High-fashion portrait with soft pink-violet lighting.",
    generationCost: 2,
    inputRequirements: ["1 portrait photo", "Visible face", "Good lighting"],
    previewCount: 12,
  },
  {
    id: "glamour-speed",
    title: "Glamour at Speed",
    subtitle: "Glossy beauty portraits with strong makeup direction",
    description:
      "Create a beauty-campaign look with glossy skin, soft glow, and premium styling.",
    category: "Glamour",
    coverUrl: gallery.glamB,
    examples: [gallery.glamB, gallery.glamC, gallery.portraitA, gallery.fashionB],
    modeType: "image",
    isPro: true,
    defaultPrompt: "Luxury beauty campaign portrait with glossy skin.",
    generationCost: 3,
    inputRequirements: ["1 front-facing photo", "Single person", "No sunglasses"],
    previewCount: 8,
  },
  {
    id: "headshot-pro",
    title: "Professional Headshot",
    subtitle: "Founder-grade portraits in a premium studio style",
    description:
      "Generate polished headshots with natural skin tones and elegant lighting.",
    category: "Professional Headshot",
    coverUrl: gallery.portraitD,
    examples: [gallery.portraitD, gallery.portraitF, gallery.portraitB, gallery.fashionC],
    modeType: "image",
    isPro: false,
    defaultPrompt: "Professional headshot with modern studio lighting.",
    generationCost: 2,
    inputRequirements: ["1 portrait photo", "Neutral expression", "Sharp focus"],
    previewCount: 6,
  },
  {
    id: "vintage-muse",
    title: "Vintage Muse",
    subtitle: "Retro editorial mood with cinematic grain",
    description:
      "Wrap your portrait in a fashion archive aesthetic with vintage tones.",
    category: "Vintage",
    coverUrl: gallery.fashionB,
    examples: [gallery.fashionB, gallery.fashionD, gallery.portraitE, gallery.fashionA],
    modeType: "image",
    isPro: false,
    defaultPrompt: "Vintage fashion editorial with soft grain and plum tones.",
    generationCost: 2,
    inputRequirements: ["1 portrait photo", "Face visible", "Natural light preferred"],
    previewCount: 10,
  },
  {
    id: "anime-pulse",
    title: "Anime Pulse",
    subtitle: "A bold stylized look with crisp outlines",
    description:
      "Transform yourself into a polished anime character while preserving likeness.",
    category: "Anime",
    coverUrl: gallery.portraitC,
    examples: [gallery.portraitC, gallery.portraitA, gallery.glamA, gallery.glamB],
    modeType: "image",
    isPro: true,
    defaultPrompt: "Anime-inspired portrait with vivid but elegant styling.",
    generationCost: 3,
    inputRequirements: ["1 portrait photo", "Single person", "Well-lit face"],
    previewCount: 16,
  },
  {
    id: "dance-loop",
    title: "Dancing Glow",
    subtitle: "Animate a portrait into a subtle dance loop",
    description:
      "Create a short social-ready dance clip from one front-facing portrait.",
    category: "Dancing",
    coverUrl: gallery.videoPoster,
    examples: [gallery.videoPoster],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    isPro: false,
    defaultPrompt: "Gentle body movement and confident dance energy.",
    generationCost: 8,
    inputRequirements: ["1 clear front-facing photo", "Single person", "Good lighting"],
    motionPreset: "dance-soft",
  },
  {
    id: "celebrity-wave",
    title: "Celebrity Wave",
    subtitle: "Stylized premiere-camera motion",
    description:
      "Turn your portrait into a red-carpet style motion preset with camera energy.",
    category: "Celebrity",
    coverUrl: gallery.videoPosterB,
    examples: [gallery.videoPosterB],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    isPro: true,
    defaultPrompt: "Subtle smile, camera flash moments, celebrity energy.",
    generationCost: 10,
    inputRequirements: ["1 clear portrait", "Visible face", "Neutral background"],
    motionPreset: "celebrity-wave",
  },
  {
    id: "fantasy-breeze",
    title: "Fantasy Breeze",
    subtitle: "Dreamy motion with flowing fabrics and light",
    description:
      "Add magical movement, drifting fabric, and premium fantasy ambience.",
    category: "Fantasy",
    coverUrl: gallery.videoPosterC,
    examples: [gallery.videoPosterC],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    isPro: true,
    defaultPrompt: "Ethereal motion, soft light, cinematic fantasy mood.",
    generationCost: 10,
    inputRequirements: ["1 clear front-facing photo", "Single subject", "Bright face"],
    motionPreset: "fantasy-drift",
  },
  {
    id: "runway-turn",
    title: "Runway Turn",
    subtitle: "A short luxury catwalk clip",
    description:
      "Generate a compact runway clip with premium pacing and fashion posture.",
    category: "Runway",
    coverUrl: gallery.fashionD,
    examples: [gallery.fashionD],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    isPro: false,
    defaultPrompt: "Luxury catwalk turn with confident movement.",
    generationCost: 8,
    inputRequirements: ["1 front-facing portrait", "Single person", "High quality input"],
    motionPreset: "runway-turn",
  },
];

function template(id: string) {
  const value = templates.find((item) => item.id === id);
  if (!value) {
    throw new Error(`Template ${id} is missing from mock data.`);
  }
  return value;
}

export const featuredBanner: FeaturedBanner = {
  id: "featured-content-lab",
  title: "Content Lab",
  subtitle: "Prompt, upload, and get premium social-ready portraits in minutes.",
  imageUrl: gallery.glamC,
  ctaLabel: "Try now",
  presetId: "content-lab",
  isPro: false,
};

export const imageSections: PresetSection[] = [
  {
    id: "trending",
    title: "Trending looks",
    layoutType: "hero",
    items: [template("content-lab"), template("headshot-pro")],
  },
  {
    id: "fabulous-era",
    title: "Fabulous era",
    layoutType: "two-grid",
    items: [template("vintage-muse"), template("anime-pulse")],
  },
  {
    id: "glamour",
    title: "Glamour at speed",
    layoutType: "single-banner",
    items: [template("glamour-speed")],
  },
];

export const videoSections: VideoSection[] = [
  {
    id: "dancing",
    title: "Dancing",
    items: [template("dance-loop"), template("runway-turn")],
    seeAllSlug: "dancing",
  },
  {
    id: "celebrity",
    title: "Celebrity",
    items: [template("celebrity-wave"), template("runway-turn")],
    seeAllSlug: "celebrity",
  },
  {
    id: "fantasy",
    title: "Fantasy",
    items: [template("fantasy-breeze"), template("dance-loop")],
    seeAllSlug: "fantasy",
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "monthly",
    title: "Monthly",
    subtitle: "Flexible access",
    allowance: "140 AI credits every month",
    priceText: "$14.99",
    period: "per month",
    isDefault: false,
    packageType: "MONTHLY",
  },
  {
    id: "yearly",
    title: "Yearly",
    subtitle: "Best for creators",
    allowance: "2200 AI credits per year",
    priceText: "$79.99",
    period: "per year",
    badgeText: "Save 56%",
    isDefault: true,
    packageType: "ANNUAL",
  },
];

export const bootstrapPayload: BootstrapPayload = {
  brandName: "Veloura AI",
  onboardingSlides,
  featuredBanner,
  imageSections,
  videoSections,
  subscriptionPlans,
  paywallBenefits: [
    "1000+ AI styles",
    "High-resolution results",
    "No watermarks",
    "Faster image and video generation",
  ],
  paywallHeroAssets: [
    gallery.glamA,
    gallery.glamB,
    gallery.fashionA,
    gallery.fashionB,
    gallery.videoPoster,
  ],
  exitOffer: {
    id: "weekly-exit-offer",
    discountPercent: 40,
    planId: "monthly",
    title: "Limited PRO offer",
    oldPrice: "$14.99",
    newPrice: "$8.99",
    durationMs: EXIT_OFFER_DURATION_MS,
  },
  photoGuidelines: {
    title: "Choose photos",
    goodTitle: "Use clear front-facing photos",
    badTitle: "Do not use",
    goodCriteria: [
      "High-quality color photo",
      "One person only",
      "Full face visible",
      "Face is centered and sharp",
    ],
    badCriteria: [
      "Blurred or dark photos",
      "Profile-only angles",
      "Face covered by glasses or hands",
      "Extreme close-ups or multiple faces",
    ],
    goodExamples: [gallery.goodA, gallery.goodB],
    badExamples: [gallery.badA, gallery.badB],
  },
};
