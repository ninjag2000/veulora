# App Store Safety Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep StudioBloom's Content Lab while preventing objectionable text, reference media, and generated media from reaching users, and prepare compliant App Store catalog and declarations.

**Architecture:** A dependency-free shared policy module provides identical prompt decisions to React Native, Express, and the Supabase Edge Function. Server adapters call fal.ai's NSFW classifier for images and extract representative video frames before classification; generation fails closed and uses the existing idempotent refund paths. A reviewed catalog allowlist and regenerated storefront assets remove risky marketing without deleting source assets.

**Tech Stack:** Expo 55, React Native 0.83, TypeScript 5.9, Node.js ESM/Express, Deno Supabase Edge Functions, Supabase Postgres/Storage, fal.ai queue and synchronous APIs, Python Pillow screenshot compositor.

**Spec:** `docs/superpowers/specs/2026-09-20-app-store-safety-compliance-design.md`

## Global Constraints

- Keep Content Lab for both photo and video.
- Do not change existing generation-model `safety_tolerance` values.
- The server is authoritative; client validation is only early feedback.
- Reject unsafe references before consuming credits.
- Never expose unsafe outputs in result/history responses.
- Fail closed with `CONTENT_SAFETY_UNAVAILABLE` when moderation cannot return a valid result.
- Do not log raw prompts, uploaded media, generated media, or blocked-term details.
- Use the existing server-side `FAL_KEY`; add no client secret and no new provider.
- Apply the same public codes and user-facing copy to Edge and Express backends.
- App Store metadata must avoid glamour, dating, unrestricted-generation, and mature-content language.
- Submitted screenshots must show actual UI and fully clothed adults in neutral poses.
- Override the App Store age rating to `13+`; prohibited content remains blocked for every age.

## Review Focus

- Unicode and punctuation evasion such as `n.u.d.e`, Cyrillic/Latin character mixing, and repeated spaces must still be blocked.
- Safe professional prompts containing words such as `shoot`, `model`, `blood orange`, or `weapon-free` must not be rejected by substring accidents.
- A classifier timeout, HTTP 5xx, or malformed body must fail closed without consuming credits or leaking provider details.
- Retrying or repeatedly polling a completed job must not classify twice, debit twice, or refund twice.
- A restricted preset must be absent from featured banners, sections, category routes, template lookup, history retry, and search-like lookup helpers.

---

### Task 1: Shared Text Safety Policy

**Files:**
- Create: `shared/content-safety.js`
- Create: `shared/content-safety.d.ts`
- Create: `shared/content-safety.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `normalizeSafetyText(value: string): string`
- Produces: `evaluatePromptSafety(prompt: string): { safe: true } | { safe: false; category: SafetyCategory }`
- Produces: `assertSafePrompt(prompt: string): void`, throwing `ContentSafetyError`
- Produces: `CONTENT_SAFETY_INSTRUCTION: string`
- Produces: `parseNsfwProbability(payload: unknown): number | null`
- Produces: `isUnsafeNsfwProbability(value: number, threshold?: number): boolean`

- [ ] **Step 1: Add failing policy tests**

Create `shared/content-safety.test.mjs` with `node:test` cases for allowed professional prompts, all policy categories in English and Russian, punctuation/spacing evasion, Cyrillic/Latin confusables, and false positives (`blood orange product photo`, `weapon-free fantasy scene`, `fashion model headshot`). Assert only stable categories, never matched terms.

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePromptSafety,
  isUnsafeNsfwProbability,
  parseNsfwProbability,
} from "./content-safety.js";

test("blocks punctuation-obfuscated nudity requests", () => {
  assert.deepEqual(evaluatePromptSafety("remove clothes, make n.u.d.e"), {
    safe: false,
    category: "sexual_content",
  });
});

test("allows safe editorial language without substring matches", () => {
  assert.deepEqual(
    evaluatePromptSafety("blood orange product shoot, weapon-free fantasy poster"),
    { safe: true },
  );
});

test("treats malformed classifier payloads as unavailable", () => {
  assert.equal(parseNsfwProbability({ probability: 0.9 }), null);
  assert.equal(parseNsfwProbability({ nsfw_probability: 0.21 }), 0.21);
  assert.equal(isUnsafeNsfwProbability(0.21), true);
});
```

- [ ] **Step 2: Run the policy tests and verify RED**

Run: `node --test shared/content-safety.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `shared/content-safety.js`.

- [ ] **Step 3: Implement the dependency-free policy module**

Use token and phrase-boundary matching after Unicode normalization. Normalize known Cyrillic/Latin confusables only for safety matching. Keep explicit categories: `sexual_content`, `minors`, `graphic_violence`, `self_harm`, `hate_extremism`, `weapons_crime`, `drugs_tobacco`, `non_consensual`, and `policy_evasion`. Set `NSFW_PROBABILITY_THRESHOLD` to `0.2` and reject non-finite/out-of-range classifier values as unavailable.

The immutable instruction must state that every person is an adult, fully clothed, non-sexualized, unharmed, and not participating in illegal, hateful, dangerous, or exploitative activity.

- [ ] **Step 4: Add typings and the test script**

Add exact union types to `shared/content-safety.d.ts` and add:

```json
"test:safety": "node --test shared/content-safety.test.mjs"
```

- [ ] **Step 5: Run tests and typecheck**

Run: `node --test shared/content-safety.test.mjs`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the shared policy**

```bash
git add shared/content-safety.js shared/content-safety.d.ts shared/content-safety.test.mjs package.json
git commit -m "feat: add shared generation safety policy"
```

### Task 2: Enforce Text Safety In Every Generation Entry Point

**Files:**
- Modify: `services/generation-service.ts:15-30`
- Modify: `providers/app-provider.tsx:900-940`
- Modify: `server/index.js:2380-2765`
- Modify: `supabase/functions/generation/index.ts:2281-2530`
- Modify: `supabase/functions/generation/index.ts:4720-4790`
- Create: `scripts/verify-safety-wiring.mjs`

**Interfaces:**
- Consumes: `evaluatePromptSafety`, `assertSafePrompt`, `CONTENT_SAFETY_INSTRUCTION`
- Produces: HTTP `422` with code `CONTENT_SAFETY_BLOCKED`
- Produces: client message `This request cannot be generated under StudioBloom's safety policy.`

- [ ] **Step 1: Add a failing wiring verification**

Create `scripts/verify-safety-wiring.mjs` to read both backend files and assert they import `assertSafePrompt`, call it before `consumeGenerationCredits`/`consumeCredits`, append `CONTENT_SAFETY_INSTRUCTION`, and re-check retry prompts.

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const edge = await readFile("supabase/functions/generation/index.ts", "utf8");
const express = await readFile("server/index.js", "utf8");
assert.match(edge, /assertSafePrompt\(body\.prompt\)/);
assert.ok(edge.indexOf("assertSafePrompt(body.prompt)") < edge.indexOf("consumeGenerationCredits("));
assert.match(express, /assertSafePrompt\(prompt\)/);
assert.ok(express.indexOf("assertSafePrompt(prompt)") < express.indexOf("consumeCredits("));
```

- [ ] **Step 2: Run wiring verification and verify RED**

Run: `node scripts/verify-safety-wiring.mjs`

Expected: FAIL on missing `assertSafePrompt` wiring.

- [ ] **Step 3: Replace client blocked-term logic**

Import `evaluatePromptSafety` in `services/generation-service.ts`. Preserve empty/short prompt messages, then return the neutral policy message for every blocked category. Do not expose the category or matched phrase in UI copy.

- [ ] **Step 4: Enforce Edge text safety before side effects**

Import the shared module using a relative file import. In `createGeneration`, call `assertSafePrompt(body.prompt)` immediately after body parsing and before account entitlement preparation, uploads, and credit consumption. Map `ContentSafetyError` to `HttpError(422, "CONTENT_SAFETY_BLOCKED", ...)`. Append `CONTENT_SAFETY_INSTRUCTION` after the approved model prompt so user text cannot override it.

- [ ] **Step 5: Enforce Express text safety before side effects**

Perform the same check in both `/generation/image` and `/generation/video` before upload and `consumeCredits`. Use the same status, code, and public message.

- [ ] **Step 6: Protect retry paths**

Before resubmitting a stored prompt in Edge `retryGeneration` and Express `retryGenerationJob`, call `assertSafePrompt` against `originalPrompt ?? prompt` and append the immutable instruction exactly once. Tests must assert repeated retries do not duplicate the instruction.

- [ ] **Step 7: Verify wiring and behavior**

Run: `node scripts/verify-safety-wiring.mjs`

Expected: PASS.

Run: `npm run test:safety`

Expected: PASS.

Run: `npm run typecheck && node --check server/index.js`

Expected: PASS.

- [ ] **Step 8: Commit text enforcement**

```bash
git add services/generation-service.ts providers/app-provider.tsx server/index.js supabase/functions/generation/index.ts scripts/verify-safety-wiring.mjs
git commit -m "feat: enforce prompt safety on generation servers"
```

### Task 3: Build Fal Image And Video Moderation Adapters

**Files:**
- Create: `server/content-moderation.js`
- Create: `server/content-moderation.test.mjs`
- Create: `supabase/functions/_shared/content-moderation.ts`
- Create: `supabase/functions/_shared/content-moderation_test.ts`

**Interfaces:**
- Produces: `moderateImageUrl(url: string): Promise<{ status: "safe"; probability: number } | { status: "unsafe"; probability: number }>`
- Produces: `extractVideoModerationFrames(url: string): Promise<string[]>`
- Produces: `moderateVideoUrl(url: string): Promise<ModerationDecision>`
- Throws: `ContentSafetyUnavailableError` for timeout, non-2xx, empty frames, and malformed classifier payloads

- [ ] **Step 1: Write failing Express adapter tests**

Inject a `runModel(modelId, input)` dependency so tests use real adapter logic without network calls. Cover probability `0.19` safe, `0.2` unsafe, malformed output unavailable, HTTP/model rejection unavailable, and video extraction checking first/middle/last frames.

```js
test("fails closed when classifier returns malformed output", async () => {
  const moderate = createContentModerator(async () => ({}));
  await assert.rejects(
    () => moderate.moderateImageUrl("https://example.com/image.jpg"),
    ContentSafetyUnavailableError,
  );
});
```

- [ ] **Step 2: Run Express adapter tests and verify RED**

Run: `node --test server/content-moderation.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the Express adapter**

Use `fal.subscribe("fal-ai/imageutils/nsfw", { input: { image_url } })`. For videos, call `fal-ai/ffmpeg-api/extract-frame` three times with `frame_type` values `first`, `middle`, and `last`, deduplicate returned URLs, then classify all three. Any unsafe frame makes the video unsafe; any unavailable check fails closed.

- [ ] **Step 4: Write and run failing Deno adapter tests**

Create equivalent dependency-injected tests using `Deno.test` and a fake `runModel` function.

Run: `deno test supabase/functions/_shared/content-moderation_test.ts`

Expected: FAIL because the Edge adapter does not exist.

- [ ] **Step 5: Implement the Edge adapter**

Use authenticated POST requests to `https://fal.run/<model-id>` with `Authorization: Key ${FAL_KEY}`, `Content-Type: application/json`, and an `AbortController` timeout of 20 seconds. Parse the documented `nsfw_probability` field and frame `images[].url` fields. Do not log request bodies or media URLs.

- [ ] **Step 6: Run both adapter suites**

Run: `node --test server/content-moderation.test.mjs`

Expected: PASS.

Run: `deno test supabase/functions/_shared/content-moderation_test.ts`

Expected: PASS.

Update `test:safety` to:

```json
"test:safety": "node --test shared/content-safety.test.mjs server/content-moderation.test.mjs"
```

- [ ] **Step 7: Commit moderation adapters**

```bash
git add server/content-moderation.js server/content-moderation.test.mjs supabase/functions/_shared/content-moderation.ts supabase/functions/_shared/content-moderation_test.ts package.json
git commit -m "feat: add fail-closed media moderation adapters"
```

### Task 4: Moderate Reference Media Before Credit Consumption

**Files:**
- Modify: `server/index.js:2380-2765`
- Modify: `supabase/functions/generation/index.ts:2281-2530`
- Modify: `supabase/functions/generation/index.ts:5100-5160`
- Modify: `scripts/verify-safety-wiring.mjs`

**Interfaces:**
- Consumes: `moderateImageUrl`
- Produces: `CONTENT_SAFETY_BLOCKED` with no debit for unsafe references
- Produces: `CONTENT_SAFETY_UNAVAILABLE` with no debit for unavailable moderation

- [ ] **Step 1: Extend wiring verification to fail on ordering**

Assert `moderateImageUrl(referenceImageUrl)` appears after upload but before `consumeGenerationCredits`/`consumeCredits` in image and video routes. Assert identity reference images are also moderated with `Promise.all` and every decision must be safe.

- [ ] **Step 2: Run verification and confirm RED**

Run: `node scripts/verify-safety-wiring.mjs`

Expected: FAIL on missing reference moderation.

- [ ] **Step 3: Integrate reference checks in Edge**

Moderate the original uploaded reference and every identity-profile reference before preprocessing and before credit consumption. On unsafe input, delete the Supabase temporary object when its storage path is known, then throw `HttpError(422, "CONTENT_SAFETY_BLOCKED", "This reference image cannot be used under StudioBloom's safety policy. No credits were charged.")`.

- [ ] **Step 4: Integrate reference checks in Express**

Moderate fal storage URLs before calling `consumeCredits`. Return the same codes and public messages. Do not retry a moderation block as a provider generation failure.

- [ ] **Step 5: Verify ordering and regression checks**

Run: `node scripts/verify-safety-wiring.mjs && npm run test:safety`

Expected: PASS.

Run: `npm run typecheck && deno check --unstable-sloppy-imports supabase/functions/generation/index.ts && node --check server/index.js`

Expected: PASS.

- [ ] **Step 6: Commit reference moderation**

```bash
git add server/index.js supabase/functions/generation/index.ts scripts/verify-safety-wiring.mjs
git commit -m "feat: moderate references before charging credits"
```

### Task 5: Moderate Generated Outputs And Refund Safely

**Files:**
- Modify: `server/index.js:2768-2977`
- Modify: `supabase/functions/generation/index.ts:3853-4700`
- Modify: `supabase/functions/generation/index.ts:220-300`
- Modify: `scripts/verify-safety-wiring.mjs`

**Interfaces:**
- Consumes: `moderateImageUrl`, `moderateVideoUrl`
- Produces: persisted terminal failure `CONTENT_SAFETY_BLOCKED`
- Reuses: `refundFailedGenerationCredits` idempotency
- Persists: `request_payload.outputModeration` summary with status and completion timestamp, no URLs or raw content

- [ ] **Step 1: Add failing output-safety wiring checks**

Assert both poll implementations call output moderation after extracting outputs and before any `status: "completed"` response. Assert unsafe/unavailable branches invoke existing refund helpers and persist a terminal failure so subsequent polls do not reclassify or re-refund.

- [ ] **Step 2: Run verification and confirm RED**

Run: `node scripts/verify-safety-wiring.mjs`

Expected: FAIL on missing output moderation.

- [ ] **Step 3: Moderate Express outputs**

For image jobs, classify every output URL. For video jobs, classify first/middle/last extracted frames. Store a moderation terminal flag in the local job record. Unsafe output returns a neutral failed response and calls `refundFailedGenerationCredits`; unavailable moderation returns `CONTENT_SAFETY_UNAVAILABLE` and also refunds because the generation already consumed credits.

- [ ] **Step 4: Moderate normal Edge outputs**

Before `persistGenerationResponse(... completed ...)`, classify all image outputs or extracted video frames. Persist only `safe`, threshold version, and timestamp. Unsafe or unavailable results become terminal failures and use `refundFailedGenerationCredits`.

- [ ] **Step 5: Moderate photo-pack frames before accumulation**

Classify each completed frame before adding it to `packPlan.completedOutputs`. A blocked frame terminates the whole pack, removes output URLs from the public response, and refunds once. A repeated poll sees the persisted terminal state and performs no new classifier calls.

- [ ] **Step 6: Verify idempotency and compilation**

Run: `node scripts/verify-safety-wiring.mjs && npm run test:safety`

Expected: PASS, including explicit static assertions for terminal-state short-circuiting.

Run: `npm run typecheck && deno check --unstable-sloppy-imports supabase/functions/generation/index.ts && node --check server/index.js`

Expected: PASS.

- [ ] **Step 7: Commit output moderation**

```bash
git add server/index.js supabase/functions/generation/index.ts scripts/verify-safety-wiring.mjs
git commit -m "feat: block unsafe generated media"
```

### Task 6: Publish Only Reviewed Catalog Content

**Files:**
- Create: `lib/catalog-safety.ts`
- Create: `scripts/verify-safe-catalog.mjs`
- Modify: `lib/mock-data.ts:5958-7056`
- Modify: `lib/catalog.ts:1-125`
- Modify: `providers/app-provider.tsx` where remote bootstrap is accepted

**Interfaces:**
- Produces: `filterSafeCatalog(payload: BootstrapPayload): BootstrapPayload`
- Produces: `isRestrictedPresetId(id: string): boolean`
- Consumes: explicit reviewed section and preset allowlists

- [ ] **Step 1: Add a failing catalog verification script**

The script reads `lib/mock-data.ts` and the exported restricted-ID list, then asserts the submitted catalog filters IDs such as `cinematic-noir-cigarette-glow`, `fan-stadium-kiss-cam`, `film-mafia-table-call`, `film-viking-nightmare`, `photo-dance-skeleton-dance`, every `subtle-horror` item, dating-themed photo items, and suggestive glamour assets. Add mock-object tests showing restricted featured banners and empty sections are removed.

- [ ] **Step 2: Run the verification and confirm RED**

Run: `node scripts/verify-safe-catalog.mjs`

Expected: FAIL because restricted IDs remain reachable.

- [ ] **Step 3: Implement reviewed allowlists and filtering**

Keep Content Lab IDs explicitly allowed. Filter local bootstrap data, remote bootstrap data, `templates`, `featuredBanner`, image/video sections, photo-pack sections, and direct `getTemplate`/category helpers. If a remote featured banner is restricted, fall back to a reviewed professional-headshot or product preset.

- [ ] **Step 4: Protect history retries and deep links**

When history references a now-restricted preset, disable retry and route to the safe home screen with `This preset is no longer available.` Direct generator routes must reject restricted IDs before rendering controls.

- [ ] **Step 5: Run catalog and type checks**

Run: `node scripts/verify-safe-catalog.mjs && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit safe catalog publication**

```bash
git add lib/catalog-safety.ts lib/mock-data.ts lib/catalog.ts providers/app-provider.tsx scripts/verify-safe-catalog.mjs app screens
git commit -m "feat: publish reviewed generation catalog"
```

### Task 7: Add Clear Safety UX Without Revealing Filter Rules

**Files:**
- Modify: `providers/app-provider.tsx:70-175`
- Modify: `screens/photo-generator-screen.tsx`
- Modify: `screens/video-generator-screen.tsx`
- Modify: `components/upload-first-controls.tsx`
- Create: `components/safety-policy-modal.tsx`

**Interfaces:**
- Consumes: backend codes `CONTENT_SAFETY_BLOCKED`, `CONTENT_SAFETY_UNAVAILABLE`
- Produces: neutral toast/modal copy and a visible `Safety policy` action in both Content Labs

- [ ] **Step 1: Add failing static UX assertions**

Extend `scripts/verify-safety-wiring.mjs` to require both error-code mappings, the exact no-credit reference message, the Content Lab safety-policy action, and absence of matched-term/category interpolation in user-facing strings.

- [ ] **Step 2: Run verification and confirm RED**

Run: `node scripts/verify-safety-wiring.mjs`

Expected: FAIL on missing UX mappings.

- [ ] **Step 3: Map backend safety errors**

Map `CONTENT_SAFETY_BLOCKED` to `This request cannot be generated under StudioBloom's safety policy.` Map `CONTENT_SAFETY_UNAVAILABLE` to `Safety checks are temporarily unavailable. No credits were charged. Try again later.` Keep these out of the backend-unavailable schema warning path.

- [ ] **Step 4: Add the safety policy modal**

Use the existing `AppModal` visual language. Explain allowed portrait/product/pet/editorial uses and prohibited sexual, violent, hateful, dangerous, exploitative, or non-consensual uses. Include support and privacy links already present in the app; do not list keywords.

- [ ] **Step 5: Add policy entry points to both Content Labs**

Place a compact text action below the prompt field so it does not alter the 3:4 upload area. Ensure keyboard dismissal and modal focus work on iPhone and iPad compatibility mode.

- [ ] **Step 6: Verify UX and typecheck**

Run: `node scripts/verify-safety-wiring.mjs && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit safety UX**

```bash
git add providers/app-provider.tsx screens/photo-generator-screen.tsx screens/video-generator-screen.tsx components/upload-first-controls.tsx components/safety-policy-modal.tsx scripts/verify-safety-wiring.mjs
git commit -m "feat: explain generation safety policy"
```

### Task 8: Replace Storefront Metadata And Screenshots

**Files:**
- Modify: `store-assets/app-store/aso-metadata.md`
- Modify: `scripts/draw_app_store_screenshots.py`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/01-start-screen.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/02-glamour-style-with-ai.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/03-trendy-effects.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/04-cute-pet-photos.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/05-viral-ai-dance-video.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/06-place-logo-product.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/07-realistic-photo-shoots.png`
- Replace: `store-assets/app-store/ios-6.7-iphone17-bg/contact-sheet.png`
- Create: `store-assets/app-store/app-review-response-1.1.md`
- Create: `store-assets/app-store/app-privacy-declarations.md`

**Interfaces:**
- Produces: seven 1290x2796 App Store images and one review-ready response
- Produces: exact App Store privacy and age-rating checklist

- [ ] **Step 1: Add a failing storefront audit**

Create `scripts/audit-app-store-safety.mjs` to reject risky terms in metadata/captions and verify all seven output dimensions. Scan for `glamour`, `dating`, `kiss`, `sexy`, `unrestricted`, `horror`, `weapon`, `cigarette`, and `mafia` with phrase-boundary matching.

- [ ] **Step 2: Run the audit and confirm RED**

Run: `node scripts/audit-app-store-safety.mjs`

Expected: FAIL on current glamour metadata and screenshots.

- [ ] **Step 3: Rewrite English and Russian metadata**

Describe StudioBloom as a moderated portrait, headshot, pet, product, photo-pack, and short-video studio. State that custom prompts are subject to built-in safety checks. Remove dating/glamour/unrestricted claims and add a concise safety statement to review notes.

- [ ] **Step 4: Update the screenshot compositor**

Use reviewed app captures and neutral source assets only. Set captions exactly to `AI PORTRAITS & VIDEOS`, `PROFESSIONAL HEADSHOTS`, `EDITORIAL PHOTO PACKS`, `PET PORTRAITS`, `PRODUCT VISUALS`, `CINEMATIC MOTION`, and `CREATIVE CONTROLS`. Every visible person must be an adult, fully clothed, and neutrally posed.

- [ ] **Step 5: Regenerate and inspect screenshots**

Run: `python3 scripts/draw_app_store_screenshots.py`

Expected: seven images plus `contact-sheet.png` written to `store-assets/app-store/ios-6.7-iphone17-bg/`.

Open the contact sheet at original resolution and manually verify no cleavage-focused crops, lingerie-like outfits, suggestive poses, weapons, substances, horror, or third-party marks.

- [ ] **Step 6: Write App Store Connect declarations**

In `app-privacy-declarations.md`, provide exact selections: Photos or Videos and Other User Content are collected, linked to the user through the persisted StudioBloom account ID, and used for App Functionality; User ID is collected, linked, and used for App Functionality; Purchase History is collected, linked, and used for App Functionality. Tracking is `No`. Name Supabase, fal.ai, and Adapty where each processes the declared data. Include steps to override to `13+` and answer content-control questions accurately.

- [ ] **Step 7: Draft the Apple response**

State the removed preset groups/screenshots, server text enforcement, reference/output media moderation, fail-closed behavior, credit handling, `13+` rating, corrected privacy labels, and paths for safe/blocked reviewer tests. Do not claim absolute prevention or mention undisclosed implementation secrets.

- [ ] **Step 8: Run storefront audit**

Run: `node scripts/audit-app-store-safety.mjs`

Expected: PASS with all dimensions and text checks.

- [ ] **Step 9: Commit storefront package**

```bash
git add store-assets/app-store scripts/draw_app_store_screenshots.py scripts/audit-app-store-safety.mjs
git commit -m "chore: prepare compliant App Store storefront"
```

### Task 9: End-to-End Verification And Submission Checklist

**Files:**
- Modify: `README.md`
- Create: `docs/app-store-safety-release-checklist.md`
- Modify: `app.json`

**Interfaces:**
- Produces: release build number `6`
- Produces: reproducible deploy, smoke-test, and App Store submission checklist

- [ ] **Step 1: Document production deployment order**

Deploy the Edge Function before distributing the client build so server enforcement is active for old clients. Document required `FAL_KEY`, existing Supabase secrets, moderation endpoint health check, and rollback steps that preserve blocking rather than bypass it.

- [ ] **Step 2: Increment the iOS build number**

Change `expo.ios.buildNumber` from `5` to `6`. Do not change bundle identifier `app.codex.studiobloom` or introduce EAS instructions.

- [ ] **Step 3: Run all automated checks**

Run:

```bash
npm run test:safety
node scripts/verify-safety-wiring.mjs
node scripts/verify-safe-catalog.mjs
node scripts/audit-app-store-safety.mjs
npm run typecheck
deno test supabase/functions/_shared/content-moderation_test.ts
deno check --unstable-sloppy-imports supabase/functions/generation/index.ts
node --check server/index.js
```

Expected: every command exits `0`.

- [ ] **Step 4: Run on-device smoke tests**

Verify safe photo, safe video, photo pack, and Content Lab prompts complete. Verify blocked English/Russian/evasive prompts reject before processing. Verify an unsafe reference rejects with no credit change. Verify simulated classifier failure fails closed. Verify unsafe-output fixtures become terminal failures and refund once.

- [ ] **Step 5: Inspect the release build**

Build with the existing Xcode workflow, install on iPhone and the App Review iPad compatibility target, and verify Content Lab safety links, consent disclosure, purchases, restore, history, and restricted deep links.

- [ ] **Step 6: Complete manual App Store Connect changes**

Upload build `1.0 (6)`, replace screenshots and metadata, publish corrected App Privacy answers, override age rating to `13+`, attach review notes, and reply to the removal message using `app-review-response-1.1.md`. Do not submit until every manual declaration matches the production build.

- [ ] **Step 7: Commit release checklist**

```bash
git add README.md docs/app-store-safety-release-checklist.md app.json
git commit -m "docs: add App Store safety release checklist"
```
