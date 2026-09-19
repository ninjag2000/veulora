# App Store Safety Compliance Design

## Context

Apple removed StudioBloom from the App Store under Guideline 1.1 because the
app or its metadata could be used to create objectionable content. The current
release advertises free-form Content Lab generation, exposes several risky
presets, uses suggestive storefront imagery, and relies mostly on provider
moderation. Client-side prompt validation only blocks a small English keyword
list and can be bypassed by direct API calls.

The compliance update keeps Content Lab and the current model safety tolerance.
It adds server-enforced text and image moderation, removes unreviewed or risky
catalog content from the public app, and corrects App Store age and privacy
disclosures.

## Goals

- Prevent prohibited requests from reaching a generation model.
- Prevent unsafe reference images and generated outputs from being processed or
  displayed.
- Keep Content Lab available for safe creative requests.
- Ensure rejected requests do not consume credits.
- Present only reviewed, general-audience presets and screenshots.
- Give App Review specific, verifiable instructions for testing the safeguards.
- Correct the age rating and privacy declarations.

## Non-goals

- Changing the existing `safety_tolerance` model parameter.
- Removing Content Lab.
- Building user reporting, social feeds, or public sharing. StudioBloom does not
  publish user-generated content to other users.
- Allowing mature content behind an age gate. Prohibited content remains blocked
  for every user.

## Safety Policy

The policy blocks requests involving:

- nudity, pornography, sexual acts, fetish content, or sexualized posing;
- requests to undress a person or replace clothing with lingerie, underwear, or
  similarly sexualized clothing;
- sexualized minors or ambiguous-age subjects in mature scenarios;
- graphic injury, gore, torture, suicide, self-harm, or realistic killing;
- hate, extremist propaganda, targeted humiliation, or degrading protected
  groups;
- illegal drugs, instructions for dangerous acts, or celebratory tobacco use;
- realistic weapon use, threats, or criminal facilitation;
- non-consensual intimate imagery, abusive deepfakes, or sexualization of an
  identifiable person;
- attempts to bypass or negate the safety policy.

Benign professional, fashion, fitness, fantasy, pet, product, and cinematic
requests remain available. Negative prompts are not interpreted as generation
intent, but their length and structure still receive normal input validation.

The same policy and public error codes apply to the mobile client, Supabase Edge
Function, and local Express backend. The server remains authoritative.

## Request Flow

1. The client performs a fast local text check to provide immediate feedback.
2. The server normalizes and checks the original user prompt before uploads,
   entitlement lookup, or credit consumption.
3. Reference images are uploaded to temporary storage and classified with the
   existing fal.ai account using `fal-ai/imageutils/nsfw`.
4. An unsafe reference is deleted where possible, the request is rejected with
   `CONTENT_SAFETY_BLOCKED`, and no credits are consumed.
5. A safe request receives an immutable safety instruction appended by the
   server. Client text cannot override this instruction.
6. Generation proceeds using the existing model routing.
7. Every returned image or video poster/frame is classified before completion is
   exposed to the app. Unsafe output URLs are not returned or written to user
   history.
8. Unsafe outputs mark the job failed and trigger the existing idempotent credit
   refund path.

Moderation fails closed. If the classifier is unavailable or returns an invalid
response, generation stops with `CONTENT_SAFETY_UNAVAILABLE`; credits are not
consumed, or are refunded if generation already started.

## Text Moderation

Text moderation is deterministic and server-side so it does not require a new
provider or secret. A dedicated module contains normalized English and Russian
terms, phrase patterns, and evasion normalization for punctuation and spacing.
It returns a stable policy category without logging the raw prompt.

The client mirrors the common rules for responsiveness, but a request is only
considered approved after the server check. The server checks both photo and
video generation endpoints, including retries. Stored retry payloads retain the
already-approved prompt and cannot substitute new client text.

## Image Moderation

The production Edge Function and local Express backend use
`fal-ai/imageutils/nsfw` with the existing server-side `FAL_KEY`. Reference
images are checked before credit consumption. Generated images are checked
before completion. Video output is checked using its generated poster or a
representative frame already produced by the existing video-poster flow; if a
safe frame cannot be obtained, completion fails closed.

Moderation results are reduced to `safe`, `unsafe`, or `unavailable`. Diagnostic
logs may include request ID, policy stage, and classification outcome, but not
raw prompts, uploaded media, or generated media.

## Catalog And Storefront

The public catalog uses an explicit reviewed allowlist rather than attempting to
identify risky content only by title. The first compliance release excludes
presets or sections centered on cigarettes, horror, mafia/criminal themes,
weapons, kissing/dating scenarios, skeleton transformations, or suggestive
glamour imagery. Assets can remain in the repository but must not be reachable
through navigation, search, featured banners, or retry/history entry points.

The App Store screenshot set will contain only actual app UI and fully clothed
adult subjects in neutral poses. The seven captions will focus on:

1. AI portraits and videos
2. Professional headshots
3. Editorial photo packs
4. Pet portraits
5. Product visuals
6. Safe cinematic motion
7. Creative controls

Metadata will remove `glamour`, dating-style language, and broad claims about
unrestricted prompt creation. Content Lab will be described as accepting custom
prompts subject to built-in safety checks.

## App Store Declarations

The age-rating questionnaire will be completed accurately and overridden to
`13+` where the calculated rating is lower. This does not permit mature content;
it reflects the presence of generative AI and content controls.

The App Privacy response must no longer state `Data Not Collected`. It should
declare, at minimum:

- Photos or Videos: collected for App Functionality;
- Other User Content: prompts and generation settings, collected for App
  Functionality;
- User ID or equivalent pseudonymous account identifier, if represented by the
  production account implementation;
- Purchase History for subscription and consumable entitlement handling.

Tracking remains `No` unless the implementation changes. Linkage answers must
match the production identifiers and retention behavior. The privacy policy must
name Supabase and fal.ai, describe temporary processing and retention, and state
the safety-moderation purpose.

## User Experience

Blocked requests show a neutral message such as: `This request cannot be
generated under StudioBloom's safety policy.` The message does not echo unsafe
text. A short `Safety policy` link is visible in Content Lab and opens the
existing legal/support surface. Reference-image rejection clearly states that no
credits were charged.

The UI does not reveal individual blocked keywords because doing so would make
evasion easier. Repeated blocked requests are subject to the existing request
rate limits.

## Testing

- Unit tests cover allowed and blocked English/Russian prompts, punctuation
  evasion, false-positive-sensitive safe prompts, and stable error categories.
- Edge and Express endpoint tests verify server enforcement cannot be bypassed by
  skipping the client.
- Moderation adapter tests cover safe, unsafe, malformed, and unavailable fal.ai
  responses.
- Credit tests verify no debit before reference approval and idempotent refund
  after unsafe output.
- Catalog tests verify restricted IDs cannot appear in sections, featured
  banners, category routes, search, or retry navigation.
- `npm run typecheck`, Deno checks, Node syntax checks, and on-device generation
  smoke tests run before submission.
- Store screenshots receive a manual visual review at full resolution.

## App Review Notes

Review notes will identify the Content Lab path and provide safe and blocked test
prompts. They will state that text moderation is server-enforced, reference and
output images are classified, moderation fails closed, and blocked requests do
not consume credits. The response to Apple will list removed presets and
screenshots, the corrected age/privacy declarations, and the new build number.

## Success Criteria

- Direct API calls with prohibited prompts are rejected before generation.
- Unsafe references and outputs never reach history or result views.
- Safe portrait, pet, product, headshot, photo-pack, and video flows still work.
- No restricted catalog item is reachable in the submitted build.
- Store metadata and screenshots are appropriate for a general storefront
  audience.
- App Store Connect no longer reports `4+` or `Data Not Collected` for the
  submitted version.
