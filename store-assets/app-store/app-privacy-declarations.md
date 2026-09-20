# App Store Connect Privacy And Age Rating Checklist

Complete these selections for StudioBloom before submitting the next build. The
answers include data processed by integrated third parties, as required by App
Store Connect.

## App Privacy

Privacy Policy URL: `https://hollybit.app/privacy`

Tracking: **No**

StudioBloom does not use collected data for targeted advertising, advertising
measurement, sharing with a data broker, or linking with third-party data for
tracking.

### User Content > Photos or Videos

- Collected: **Yes**
- Linked to the user: **Yes**
- Used for tracking: **No**
- Purpose: **App Functionality**
- Data: reference photos, identity-profile photos, product photos, generated
  images, and generated videos associated with the persisted StudioBloom account
  ID and generation history.
- Processing: Supabase hosts the StudioBloom backend and temporary generation
  records/media references. fal.ai receives selected photos or videos and
  generation settings to perform AI processing and safety checks.

### User Content > Other User Content

- Collected: **Yes**
- Linked to the user: **Yes**
- Used for tracking: **No**
- Purpose: **App Functionality**
- Data: prompts, negative prompts, preset choices, and generation settings
  associated with the persisted StudioBloom account ID.
- Processing: Supabase processes the request and job record. fal.ai receives the
  prompt and generation settings needed to perform AI generation and safety
  checks.

### Identifiers > User ID

- Collected: **Yes**
- Linked to the user: **Yes**
- Used for tracking: **No**
- Purpose: **App Functionality**
- Data: the persisted StudioBloom/Supabase account ID used for credit balance,
  entitlement, generation history, and job ownership.
- Processing: Supabase stores and validates the account ID. Adapty associates its
  customer profile with the app account for subscription and purchase entitlement
  handling.

### Purchases > Purchase History

- Collected: **Yes**
- Linked to the user: **Yes**
- Used for tracking: **No**
- Purpose: **App Functionality**
- Data: subscription status, product identifiers, restore status, and purchased
  credit-pack entitlement.
- Processing: Apple processes the App Store transaction. Adapty validates and
  synchronizes purchase entitlements. Supabase stores the resulting entitlement
  and credit state for the StudioBloom account.

### Final Privacy Check

- Do not select advertising, developer marketing, analytics, or tracking as a
  purpose unless the production app is changed to use the declared data for that
  purpose.
- Confirm the public privacy policy names Supabase, fal.ai, and Adapty and
  describes the same categories, purposes, linkage, retention/deletion behavior,
  and user choices.
- Revisit these answers whenever an SDK or backend data flow changes.

## Age Rating

Open **App Information > Age Ratings > Set Up/Edit Age Ratings**.

### In-App Controls And Capabilities

- Parental controls: **No**
- Age assurance: **No**
- Content controls/safety filtering: **Yes**. StudioBloom uses a reviewed catalog,
  text checks, reference-media checks, and generated-media checks. This is an
  automatic safety control, not a parental-control feature.
- User-generated content: **Yes**. Users provide prompts and media for private AI
  generation; there is no public feed or user-to-user sharing inside the app.
- Messaging or chat: **No**
- Social media: **No**
- Advertising: **No**
- Unrestricted web access: **No**. External support, privacy, and legal links open
  specific URLs; the app does not provide a general browser.

### Content Descriptors

Answer **None** for prohibited sexual content, graphic violence, hateful content,
dangerous activity, substances, gambling, profanity, and fear themes because the
published catalog excludes these themes and custom generation is moderated. If
future reviewed catalog content changes, update the answers before release.

### Rating Override

1. Continue to **Additional Information**.
2. Under **Age Categories and Override**, choose **Override to Higher Age Rating**.
3. Select **13+**.
4. Do not select **Made for Kids**.
5. Save and verify the global and region-specific ratings shown by App Store
   Connect before submission.

Apple notes that privacy answers must include integrated third-party partners and
that a higher age-rating override can be selected when the developer believes it
better reflects the app. Reconfirm the live App Store Connect wording at each
submission because the questionnaire can change.
