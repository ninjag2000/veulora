import assert from "node:assert/strict";
import fs from "node:fs/promises";

import ts from "typescript";

const safetySource = await fs.readFile(
  new URL("../lib/catalog-safety.ts", import.meta.url),
  "utf8"
);
const mockDataSource = await fs.readFile(
  new URL("../lib/mock-data.ts", import.meta.url),
  "utf8"
);
const catalogSource = await fs.readFile(
  new URL("../lib/catalog.ts", import.meta.url),
  "utf8"
);
const providerSource = await fs.readFile(
  new URL("../providers/app-provider.tsx", import.meta.url),
  "utf8"
);
const photoRouteSource = await fs.readFile(
  new URL("../app/(app)/generator/[presetId].tsx", import.meta.url),
  "utf8"
);
const videoRouteSource = await fs.readFile(
  new URL("../app/(app)/video-generator/[presetId].tsx", import.meta.url),
  "utf8"
);
const resultScreenSource = await fs.readFile(
  new URL("../screens/result-screen.tsx", import.meta.url),
  "utf8"
);

const compiled = ts.transpileModule(safetySource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const safety = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const restrictedIds = [
  "cinematic-noir-cigarette-glow",
  "fan-stadium-kiss-cam",
  "film-mafia-table-call",
  "film-viking-nightmare",
  "photo-dance-skeleton-dance",
  "single-dating-app-hero",
  "pack-cafe-date-shoot",
  "glamour-speed",
];

for (const id of restrictedIds) {
  assert.match(mockDataSource, new RegExp(`id: ["']${id}["']`));
  assert.equal(safety.isRestrictedPresetId(id), true, `${id} must be restricted`);
}

for (const id of [
  "subtle-shark-shadows",
  "subtle-haunting-doll",
  "subtle-vampire-velvet",
  "subtle-forest-changeling",
  "subtle-mirror-echo",
  "subtle-candle-flicker",
]) {
  assert.match(mockDataSource, new RegExp(`id: ["']${id}["']`));
  assert.equal(safety.isRestrictedPresetId(id), true, `${id} must be restricted`);
}

assert.equal(safety.isRestrictedPresetId("content-lab"), false);
assert.equal(safety.isRestrictedPresetId("content-lab-video"), false);
assert.equal(safety.isRestrictedPresetId("headshot-pro"), false);
assert.equal(safety.isRestrictedPresetId("pack-product-adshot"), false);

const template = (id, title = id) => ({
  id,
  title,
  description: title,
  category: "Test",
  coverUrl: `${id}.jpg`,
  examples: [`${id}.jpg`],
  modeType: "image",
  isPro: false,
  defaultPrompt: title,
  generationCost: 1,
  inputRequirements: [],
});

const unsafeCatalog = {
  brandName: "Test",
  onboardingSlides: [],
  featuredBanner: {
    id: "unsafe-feature",
    title: "Unsafe",
    subtitle: "Unsafe",
    imageUrl: "unsafe.jpg",
    ctaLabel: "Try",
    presetId: "glamour-speed",
    isPro: false,
  },
  imageSections: [
    {
      id: "profile-upgrades",
      title: "Profiles",
      layoutType: "horizontal",
      items: [template("headshot-pro", "Professional Headshot")],
      seeAllSlug: "profile-upgrades",
    },
    {
      id: "subtle-horror",
      title: "Horror",
      layoutType: "horizontal",
      items: [template("subtle-haunting-doll")],
      seeAllSlug: "subtle-horror",
    },
  ],
  videoSections: [],
  subscriptionPlans: [],
  paywallBenefits: [],
  paywallHeroAssets: [],
  exitOffer: {},
  creditPacks: [],
  photoGuidelines: {},
};

const filtered = safety.filterSafeCatalog(unsafeCatalog);
assert.equal(filtered.featuredBanner.presetId, "headshot-pro");
assert.equal(filtered.imageSections.length, 1);
assert.deepEqual(filtered.imageSections[0].items.map((item) => item.id), [
  "headshot-pro",
]);
assert.equal(unsafeCatalog.imageSections.length, 2, "filter must not mutate input");

assert.match(mockDataSource, /filterSafeTemplates\(allTemplates\)/);
assert.match(mockDataSource, /filterSafeCatalog\(unreviewedBootstrapPayload\)/);
assert.match(catalogSource, /isRestrictedPresetId\(id\)/);
assert.match(catalogSource, /filterSafeCatalog\(catalog\)/);
assert.match(providerSource, /const safeCatalog = filterSafeCatalog\(payload\.catalog\)/);
assert.match(providerSource, /isRestrictedPresetId\(originalJob\.templateId\)/);
assert.match(providerSource, /This preset is no longer available\./);
assert.match(photoRouteSource, /isRestrictedPresetId\(params\.presetId\)/);
assert.match(videoRouteSource, /isRestrictedPresetId\(params\.presetId\)/);
assert.match(resultScreenSource, /disabled=\{retryUnavailable\}/);

console.log("Safe catalog publication verified.");
