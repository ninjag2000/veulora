# App Review Response - Guideline 1.1

Hello App Review,

Thank you for the re-evaluation and for identifying the Guideline 1.1 concern. We
revised StudioBloom to present a clearly moderated portrait, headshot, pet,
product, editorial photo-pack, and short-video experience.

Changes in this submission:

- Removed the previously published preset groups and assets associated with
  dating themes, suggestive portrait styling, tobacco, violent crime, fear/horror,
  weapons, and other themes that could be interpreted as objectionable.
- Replaced all seven App Store screenshots and rewrote the English and Russian
  metadata. The new storefront shows only adults in neutral, fully clothed poses,
  pets, products, and professional/editorial use cases.
- The app now publishes presets through an explicit reviewed allowlist. Presets
  outside that reviewed catalog are not available from the home screens, category
  screens, direct links, or history retry.
- Added server-side prompt-policy enforcement for both image and video requests,
  including retries. The app displays a neutral safety-policy message when a
  request cannot be generated.
- Added automated safety checks for every uploaded reference image before credit
  consumption. Generated images and generated video frames are also checked before
  results are delivered.
- Safety services fail closed. If a required safety check is unavailable, the
  generation does not continue. Credits are not charged before input checks, and
  credits are restored when a generated result cannot be delivered after an
  output check.
- Added a visible **Safety policy** action in both image and video Content Lab.
  It explains allowed portrait/product/pet/editorial uses and prohibited sexual,
  violent, hateful, dangerous, exploitative, and non-consensual uses without
  exposing filter implementation details.
- Updated App Privacy answers to declare Photos or Videos, Other User Content,
  User ID, and Purchase History as linked data used for App Functionality, with
  Tracking set to No. The privacy policy identifies Supabase, fal.ai, and Adapty.
- Set the App Store age rating to 13+ using the higher-rating override and answered
  the user-generated-content and content-control questions to reflect the app's
  private prompt/media workflow and automatic safety controls.

Reviewer test paths:

1. Safe generation: open **Image > Content Lab**, enter `Professional studio
   headshot of an adult in business attire with neutral lighting`, and generate.
   The same policy entry point is available in **Video > Content Lab**.
2. Blocked request: in either Content Lab, enter `Create graphic violence with a
   weapon`. The request is stopped with `This request cannot be generated under
   StudioBloom's safety policy.` No result is generated and no credits are
   retained for that request.
3. Policy disclosure: tap **Safety policy** directly below the prompt field in
   either Content Lab.
4. AI processing disclosure: on a fresh install, the blocking consent dialog
   identifies the data sent and names Supabase and fal.ai before any AI processing
   can begin.

These controls materially reduce the chance that StudioBloom can be used to create
or distribute objectionable content; we do not claim that any automated system can
provide absolute prevention. We will keep the reviewed catalog and safety controls
under ongoing review.

Best regards,

StudioBloom Team
