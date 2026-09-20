# App Store Safety Release Checklist

Release target: **StudioBloom 1.0 (6)**  
Bundle identifier: **app.codex.studiobloom**

Do not submit until every automated item passes and every manual item is checked
against the production build.

## 1. Automated Release Gate

Run from the repository root:

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

- [ ] Every command exits with status `0`.
- [ ] `app.json` contains iOS build number `6`.
- [ ] `app.json` still contains bundle identifier `app.codex.studiobloom`.
- [ ] No production provider safety-tolerance setting was loosened.

## 2. Backend Before Client

- [ ] Confirm the linked Supabase project is the production project.
- [ ] Confirm `FAL_KEY` is present in Supabase secrets, or confirm the production
      Vault secret `fal_ai_key` and `get_fal_ai_key` RPC are healthy.
- [ ] Confirm existing `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `ADAPTY_SECRET_KEY`,
      `ADAPTY_ACCESS_LEVEL_ID`, and `FAL_WEBHOOK_SECRET` configuration.
- [ ] Apply pending migrations with `supabase db push`.
- [ ] Deploy the authenticated generation function:
      `supabase functions deploy generation`.
- [ ] If the relay changed, deploy it after generation:
      `supabase functions deploy fal-webhook --no-verify-jwt`.
- [ ] Do not distribute the client until production safety smoke tests pass.

## 3. Production Safety Health Check

Use a dedicated production test account and record before/after credit balances.

- [ ] Safe portrait prompt reaches the moderation path and completes.
- [ ] Controlled prohibited prompt returns `CONTENT_SAFETY_BLOCKED` before
      processing and does not reduce credits.
- [ ] Safe reference image passes input moderation.
- [ ] Controlled unsafe-reference fixture returns `CONTENT_SAFETY_BLOCKED` and
      does not reduce credits.
- [ ] In a controlled non-production check, an unavailable classifier returns
      `CONTENT_SAFETY_UNAVAILABLE`; generation does not continue.
- [ ] Generated-image moderation runs before delivery.
- [ ] Generated-video first, middle, and final frame checks run before delivery.
- [ ] An unsafe-output fixture produces one terminal failure and exactly one
      refund, including repeated polling.

## 4. On-Device Smoke Tests

Run on a physical iPhone and on the App Review iPad compatibility target.

- [ ] Safe single-photo generation completes and can be saved/shared.
- [ ] Safe video generation completes and starts on the generated scene.
- [ ] Safe photo pack completes with every output available.
- [ ] Image Content Lab safe prompt completes.
- [ ] Video Content Lab safe prompt completes.
- [ ] Blocked English prompt stops before processing.
- [ ] Blocked Russian prompt stops before processing.
- [ ] Spaced/obfuscated prohibited prompt stops before processing.
- [ ] Rejected input and unavailable safety checks show neutral copy and no
      matched rule details.
- [ ] **Safety policy** opens below both Content Lab prompt fields after the
      keyboard is dismissed.
- [ ] Fresh-install AI disclosure blocks the app until accepted and identifies
      Supabase and fal.ai before data is sent.
- [ ] Purchases and Restore work through Adapty.
- [ ] History opens completed safe results.
- [ ] Restricted preset deep links return to a safe home screen with
      `This preset is no longer available.`
- [ ] Restricted history jobs cannot be retried.

## 5. Xcode Release Inspection

- [ ] Open the existing iOS workspace in Xcode; do not use an EAS build.
- [ ] Clean build artifacts if required, archive Release build `1.0 (6)`, and
      validate the archive.
- [ ] Confirm bundle identifier `app.codex.studiobloom` and build number `6` in
      the archive.
- [ ] Install the archived build on iPhone and the iPad compatibility target.
- [ ] Repeat consent, Content Lab policy, generation, purchase, restore, history,
      and restricted-link smoke tests from the archive.

## 6. Storefront And Declarations

- [ ] Upload the seven images from
      `store-assets/app-store/ios-6.7-iphone17-bg/`.
- [ ] Paste English and Russian metadata from
      `store-assets/app-store/aso-metadata.md`.
- [ ] Apply every selection in
      `store-assets/app-store/app-privacy-declarations.md`.
- [ ] Confirm Tracking is **No**.
- [ ] Confirm Photos or Videos, Other User Content, User ID, and Purchase History
      are declared as linked and used for App Functionality.
- [ ] Confirm Supabase, fal.ai, and Adapty are named in the public privacy policy.
- [ ] Override the age rating to **13+** and do not select Made for Kids.
- [ ] Add the review notes and reviewer test paths.
- [ ] Reply to the removal message with
      `store-assets/app-store/app-review-response-1.1.md`.
- [ ] Submit only after App Store Connect declarations match the archived
      production build.

## 7. Rollback

- [ ] Keep the last known safety-capable Edge Function revision available.
- [ ] If production health checks fail, stop distribution and redeploy that
      safety-capable revision.
- [ ] Do not restore any backend revision that bypasses prompt, input, or output
      moderation.
- [ ] Leave generation fail-closed while a moderation dependency is unavailable.
- [ ] After rollback, repeat credit, blocked-request, and terminal-refund checks
      before resuming distribution.
