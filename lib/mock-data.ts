import type {
  BootstrapPayload,
  FeaturedBanner,
  OnboardingSlide,
  PresetSection,
  SubscriptionPlan,
  Template,
  TemplateReferenceMode,
  VideoSection,
} from "@/lib/types";
import { EXIT_OFFER_DURATION_MS } from "@/lib/helpers";

const gallery = {
  portraitA: require("../assets/photo-generated/beauty-cover.png"),
  portraitB: require("../assets/photo-generated/headshot-cover.png"),
  portraitC: require("../assets/photo-generated/anime-cover.png"),
  portraitD: require("../assets/photo-generated/headshot-cover.png"),
  portraitE: require("../assets/photo-generated/city-editorial-cover.png"),
  portraitF: require("../assets/photo-generated/vintage-cover.png"),
  fashionA: require("../assets/photo-generated/city-editorial-cover.png"),
  fashionB: require("../assets/photo-generated/vintage-cover.png"),
  fashionC: require("../assets/photo-generated/studio-beauty-cover.png"),
  fashionD: require("../assets/photo-generated/summer-lifestyle-cover.png"),
  contentLabA: require("../assets/photo-generated/content-lab-wide-1.png"),
  contentLabB: require("../assets/photo-generated/content-lab-wide-2.png"),
  contentLabC: require("../assets/photo-generated/content-lab-wide-3.png"),
  glamA: require("../assets/photo-generated/beauty-cover.png"),
  glamB: require("../assets/photo-generated/studio-beauty-cover.png"),
  glamC: require("../assets/photo-generated/beauty-cover.png"),
  onboardingHeroStyles: require("../assets/photo-generated/onboarding-hero-styles.png"),
  onboardingHeroOutfit: require("../assets/photo-generated/onboarding-hero-outfit.png"),
  onboardingHeroPrompt: require("../assets/photo-generated/onboarding-hero-prompt.png"),
  onboardingHeroVideo: require("../assets/photo-generated/onboarding-hero-video.png"),
  onboardingInsetA: require("../assets/photo-generated/onboarding-inset-a.png"),
  onboardingInsetB: require("../assets/photo-generated/onboarding-inset-b.png"),
  onboardingInsetC: require("../assets/photo-generated/onboarding-inset-c.png"),
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
  videoCovers: [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1512310604669-443f26c35f52?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1508182314998-3bd49473002f?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&h=1200&q=80",
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&h=1200&q=75",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&h=1200&q=75",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&h=1200&q=75",
  ],
  photoPackCovers: [
    require("../assets/photo-generated/beauty-cover.png"),
    require("../assets/photo-generated/headshot-cover.png"),
    require("../assets/photo-generated/vintage-cover.png"),
    require("../assets/photo-generated/anime-cover.png"),
    require("../assets/photo-generated/city-editorial-cover.png"),
    require("../assets/photo-generated/summer-lifestyle-cover.png"),
    require("../assets/photo-generated/studio-beauty-cover.png"),
    require("../assets/photo-generated/fantasy-couture-cover.png"),
    require("../assets/photo-generated/beauty-cover.png"),
    require("../assets/photo-generated/headshot-cover.png"),
    require("../assets/photo-generated/vintage-cover.png"),
    require("../assets/photo-generated/anime-cover.png"),
    require("../assets/photo-generated/city-editorial-cover.png"),
    require("../assets/photo-generated/summer-lifestyle-cover.png"),
    require("../assets/photo-generated/studio-beauty-cover.png"),
    require("../assets/photo-generated/fantasy-couture-cover.png"),
    require("../assets/photo-generated/beauty-cover.png"),
    require("../assets/photo-generated/headshot-cover.png"),
    require("../assets/photo-generated/vintage-cover.png"),
    require("../assets/photo-generated/anime-cover.png"),
    require("../assets/photo-generated/city-editorial-cover.png"),
    require("../assets/photo-generated/summer-lifestyle-cover.png"),
    require("../assets/photo-generated/studio-beauty-cover.png"),
    require("../assets/photo-generated/fantasy-couture-cover.png"),
  ],
};

const referenceGallery = {
  closeBeautyComp: gallery.videoCovers[4],
  softGlamStyle: gallery.videoCovers[0],
  latteStyle: gallery.videoCovers[2],
  cleanGirlStyle: gallery.goodA,
  fashionStreetComp: gallery.videoCovers[1],
  pinkStreetStyle: gallery.videoCovers[1],
  leatherStyle: gallery.videoCovers[3],
  goldenHourStyle: gallery.videoCovers[6],
  professionalComp: gallery.videoCovers[8],
  ceoStyle: gallery.videoPosterB,
  datingStyle: gallery.goodB,
  founderStyle: gallery.videoCovers[10],
  fantasyComp: gallery.videoCovers[22],
  iceQueenStyle: gallery.videoCovers[20],
  cyberMuseStyle: gallery.videoCovers[21],
  angelGlowStyle: gallery.videoCovers[19],
  lifestyleComp: gallery.videoCovers[7],
  cafeStyle: gallery.videoPosterC,
  rooftopStyle: gallery.videoCovers[28],
  beachStyle: gallery.videoCovers[24],
  travelComp: gallery.videoCovers[12],
  parisStyle: gallery.videoCovers[27],
  tokyoStyle: gallery.videoCovers[21],
  dubaiStyle: gallery.videoCovers[26],
  adComp: gallery.goodA,
  perfumeStyle: gallery.videoPoster,
  sodaStyle: gallery.videoCovers[23],
  sneakerStyle: gallery.videoCovers[25],
  cinemaComp: gallery.videoCovers[18],
  noirStyle: gallery.badA,
  scifiStyle: gallery.videoCovers[21],
  romcomStyle: gallery.videoCovers[9],
  retroComp: gallery.videoCovers[2],
  y2kStyle: gallery.videoCovers[12],
  seventiesStyle: gallery.videoCovers[29],
  supermodelStyle: gallery.videoCovers[4],
  holidayComp: gallery.videoCovers[19],
  newYearStyle: gallery.videoCovers[28],
  valentineStyle: gallery.videoCovers[6],
  christmasStyle: gallery.videoCovers[19],
  avatarComp: gallery.videoCovers[22],
  avatar3dStyle: gallery.videoCovers[30],
  animeStyle: gallery.videoCovers[22],
  gameHeroStyle: gallery.videoCovers[20],
  packLuxuryComp: gallery.videoCovers[28],
  pinkPorscheStyle: gallery.videoCovers[26],
  villaStyle: gallery.videoCovers[25],
  champagneStyle: gallery.videoCovers[12],
  packCarsComp: gallery.videoCovers[1],
  convertibleStyle: gallery.videoCovers[25],
  nightDriveStyle: gallery.videoCovers[21],
  gasStationStyle: gallery.videoCovers[23],
  packSummerComp: gallery.videoCovers[24],
  picnicStyle: gallery.videoCovers[25],
  packCityComp: gallery.videoCovers[28],
  oldMoneyStyle: gallery.videoCovers[3],
  subwayStyle: gallery.videoCovers[21],
  packStudioComp: gallery.videoCovers[8],
  glossyStudioStyle: gallery.videoCovers[0],
  monochromeStyle: gallery.badA,
  colorGelStyle: gallery.videoCovers[21],
  packFantasyComp: gallery.videoCovers[22],
  crystalStyle: gallery.videoCovers[20],
  celestialStyle: gallery.videoCovers[19],
  rosePalaceStyle: gallery.videoCovers[6],
  contentLabComp: gallery.videoCovers[18],
  contentLabStyle: gallery.videoCovers[0],
  headshotStyle: gallery.videoCovers[8],
  vintageStyle: gallery.videoCovers[29],
} as const;

const localPhotoPackAssets: Record<string, number[]> = {
  "pack-beach-cover-girl": [
    require("../assets/photo-packs/pack-beach-cover-girl/01.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/02.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/03.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/04.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/05.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/06.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/07.jpg"),
    require("../assets/photo-packs/pack-beach-cover-girl/08.jpg"),
  ],
  "pack-cafe-date-shoot": [
    require("../assets/photo-packs/pack-cafe-date-shoot/01.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/02.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/03.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/04.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/05.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/06.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/07.jpg"),
    require("../assets/photo-packs/pack-cafe-date-shoot/08.jpg"),
  ],
  "pack-pink-porsche-effect": [
    require("../assets/photo-packs/pack-pink-porsche-effect/01.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/02.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/03.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/04.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/05.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/06.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/07.jpg"),
    require("../assets/photo-packs/pack-pink-porsche-effect/08.jpg"),
  ],
  "pack-private-villa-day": [
    require("../assets/photo-packs/pack-private-villa-day/01.png"),
    require("../assets/photo-packs/pack-private-villa-day/02.png"),
    require("../assets/photo-packs/pack-private-villa-day/03.png"),
    require("../assets/photo-packs/pack-private-villa-day/04.png"),
    require("../assets/photo-packs/pack-private-villa-day/05.png"),
    require("../assets/photo-packs/pack-private-villa-day/06.png"),
    require("../assets/photo-packs/pack-private-villa-day/07.png"),
    require("../assets/photo-packs/pack-private-villa-day/08.png"),
  ],
  "pack-champagne-balcony": [
    require("../assets/photo-packs/pack-champagne-balcony/01.png"),
    require("../assets/photo-packs/pack-champagne-balcony/02.png"),
    require("../assets/photo-packs/pack-champagne-balcony/03.png"),
    require("../assets/photo-packs/pack-champagne-balcony/04.png"),
    require("../assets/photo-packs/pack-champagne-balcony/05.png"),
    require("../assets/photo-packs/pack-champagne-balcony/06.png"),
    require("../assets/photo-packs/pack-champagne-balcony/07.png"),
    require("../assets/photo-packs/pack-champagne-balcony/08.png"),
  ],
  "pack-convertible-summer": [
    require("../assets/photo-packs/pack-convertible-summer/01.png"),
    require("../assets/photo-packs/pack-convertible-summer/02.png"),
    require("../assets/photo-packs/pack-convertible-summer/03.png"),
    require("../assets/photo-packs/pack-convertible-summer/04.png"),
    require("../assets/photo-packs/pack-convertible-summer/05.png"),
    require("../assets/photo-packs/pack-convertible-summer/06.png"),
    require("../assets/photo-packs/pack-convertible-summer/07.png"),
    require("../assets/photo-packs/pack-convertible-summer/08.png"),
  ],
  "pack-night-drive-flash": [
    require("../assets/photo-packs/pack-night-drive-flash/01.png"),
    require("../assets/photo-packs/pack-night-drive-flash/02.png"),
    require("../assets/photo-packs/pack-night-drive-flash/03.png"),
    require("../assets/photo-packs/pack-night-drive-flash/04.png"),
    require("../assets/photo-packs/pack-night-drive-flash/05.png"),
    require("../assets/photo-packs/pack-night-drive-flash/06.png"),
    require("../assets/photo-packs/pack-night-drive-flash/07.png"),
    require("../assets/photo-packs/pack-night-drive-flash/08.png"),
  ],
  "pack-gas-station-glam": [
    require("../assets/photo-packs/pack-gas-station-glam/01.png"),
    require("../assets/photo-packs/pack-gas-station-glam/02.png"),
    require("../assets/photo-packs/pack-gas-station-glam/03.png"),
    require("../assets/photo-packs/pack-gas-station-glam/04.png"),
    require("../assets/photo-packs/pack-gas-station-glam/05.png"),
    require("../assets/photo-packs/pack-gas-station-glam/06.png"),
    require("../assets/photo-packs/pack-gas-station-glam/07.png"),
    require("../assets/photo-packs/pack-gas-station-glam/08.png"),
  ],
  "pack-glossy-studio-set": [
    require("../assets/photo-packs/pack-glossy-studio-set/01.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/02.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/03.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/04.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/05.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/06.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/07.jpg"),
    require("../assets/photo-packs/pack-glossy-studio-set/08.jpg"),
  ],
  "pack-old-money-streets": [
    require("../assets/photo-packs/pack-old-money-streets/01.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/02.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/03.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/04.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/05.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/06.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/07.jpg"),
    require("../assets/photo-packs/pack-old-money-streets/08.jpg"),
  ],
  "pack-rooftop-editorial": [
    require("../assets/photo-packs/pack-rooftop-editorial/01.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/02.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/03.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/04.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/05.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/06.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/07.jpg"),
    require("../assets/photo-packs/pack-rooftop-editorial/08.jpg"),
  ],
  "pack-subway-star": [
    require("../assets/photo-packs/pack-subway-star/01.png"),
    require("../assets/photo-packs/pack-subway-star/02.png"),
    require("../assets/photo-packs/pack-subway-star/03.png"),
    require("../assets/photo-packs/pack-subway-star/04.png"),
    require("../assets/photo-packs/pack-subway-star/05.png"),
    require("../assets/photo-packs/pack-subway-star/06.png"),
    require("../assets/photo-packs/pack-subway-star/07.png"),
    require("../assets/photo-packs/pack-subway-star/08.png"),
  ],
  "pack-monochrome-icons": [
    require("../assets/photo-packs/pack-monochrome-icons/01.png"),
    require("../assets/photo-packs/pack-monochrome-icons/02.png"),
    require("../assets/photo-packs/pack-monochrome-icons/03.png"),
    require("../assets/photo-packs/pack-monochrome-icons/04.png"),
    require("../assets/photo-packs/pack-monochrome-icons/05.png"),
    require("../assets/photo-packs/pack-monochrome-icons/06.png"),
    require("../assets/photo-packs/pack-monochrome-icons/07.png"),
    require("../assets/photo-packs/pack-monochrome-icons/08.png"),
  ],
  "pack-color-gel-beauty": [
    require("../assets/photo-packs/pack-color-gel-beauty/01.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/02.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/03.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/04.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/05.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/06.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/07.png"),
    require("../assets/photo-packs/pack-color-gel-beauty/08.png"),
  ],
  "pack-celestial-muse": [
    require("../assets/photo-packs/pack-celestial-muse/01.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/02.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/03.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/04.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/05.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/06.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/07.jpg"),
    require("../assets/photo-packs/pack-celestial-muse/08.jpg"),
  ],
  "pack-crystal-garden": [
    require("../assets/photo-packs/pack-crystal-garden/01.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/02.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/03.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/04.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/05.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/06.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/07.jpg"),
    require("../assets/photo-packs/pack-crystal-garden/08.jpg"),
  ],
  "pack-rose-palace": [
    require("../assets/photo-packs/pack-rose-palace/01.jpg"),
    require("../assets/photo-packs/pack-rose-palace/02.jpg"),
    require("../assets/photo-packs/pack-rose-palace/03.jpg"),
    require("../assets/photo-packs/pack-rose-palace/04.jpg"),
    require("../assets/photo-packs/pack-rose-palace/05.jpg"),
    require("../assets/photo-packs/pack-rose-palace/06.jpg"),
    require("../assets/photo-packs/pack-rose-palace/07.jpg"),
    require("../assets/photo-packs/pack-rose-palace/08.jpg"),
  ],
};

const localVideoPreviewAssets: Record<string, number> = {
  "visual-patch-insta-bangs-spray": require("../assets/video-previews/visual-patch-insta-bangs-spray.jpg"),
  "visual-patch-long-hair-magic": require("../assets/video-previews/visual-patch-long-hair-magic.jpg"),
  "visual-patch-red-or-white-glow": require("../assets/video-previews/visual-patch-red-or-white-glow.jpg"),
  "visual-patch-liquid-metal-face": require("../assets/video-previews/visual-patch-liquid-metal-face.jpg"),
  "makeover-spotlight-entrance": require("../assets/video-previews/makeover-spotlight-entrance.jpg"),
  "makeover-backstage-glam": require("../assets/video-previews/makeover-backstage-glam.jpg"),
  "makeover-neon-entrance": require("../assets/video-previews/makeover-neon-entrance.jpg"),
  "makeover-honey-bee-look": require("../assets/video-previews/makeover-honey-bee-look.jpg"),
  "makeover-cleopatra-reborn": require("../assets/video-previews/makeover-cleopatra-reborn.jpg"),
  "makeover-red-carpet-night": require("../assets/video-previews/makeover-red-carpet-night.jpg"),
  "many-faces-winter-sovereign": require("../assets/video-previews/many-faces-winter-sovereign.jpg"),
  "many-faces-krampus-creature": require("../assets/video-previews/many-faces-krampus-creature.jpg"),
  "many-faces-cubic-avatar": require("../assets/video-previews/many-faces-cubic-avatar.jpg"),
  "many-faces-plushy-cuddle": require("../assets/video-previews/many-faces-plushy-cuddle.jpg"),
  "party-tricks-bald-swipe": require("../assets/video-previews/party-tricks-bald-swipe.jpg"),
  "party-tricks-cry-me-a-river": require("../assets/video-previews/party-tricks-cry-me-a-river.jpg"),
  "party-tricks-money-tornado": require("../assets/video-previews/party-tricks-money-tornado.jpg"),
  "party-tricks-private-airplane-pose": require("../assets/video-previews/party-tricks-private-airplane-pose.jpg"),
  "social-dream-mount": require("../assets/video-previews/social-dream-mount.jpg"),
  "social-private-jet-wave": require("../assets/video-previews/social-private-jet-wave.jpg"),
  "social-luxury-phone-flip": require("../assets/video-previews/social-luxury-phone-flip.jpg"),
  "social-suit-swagger": require("../assets/video-previews/social-suit-swagger.jpg"),
  "social-emoji-check": require("../assets/video-previews/social-emoji-check.jpg"),
  "social-old-photo-revival": require("../assets/video-previews/social-old-photo-revival.jpg"),
  "film-villain-close-up": require("../assets/video-previews/film-villain-close-up.jpg"),
  "film-velvet-throne": require("../assets/video-previews/film-velvet-throne.jpg"),
  "film-mafia-table-call": require("../assets/video-previews/film-mafia-table-call.jpg"),
  "film-magical-letter": require("../assets/video-previews/film-magical-letter.jpg"),
  "film-prophecy-card": require("../assets/video-previews/film-prophecy-card.jpg"),
  "film-viking-nightmare": require("../assets/video-previews/film-viking-nightmare.jpg"),
  "winter-santa-glow": require("../assets/video-previews/winter-santa-glow.jpg"),
  "winter-mrs-claus-portrait": require("../assets/video-previews/winter-mrs-claus-portrait.jpg"),
  "winter-snowglobe-walk": require("../assets/video-previews/winter-snowglobe-walk.jpg"),
  "winter-reindeer-parade": require("../assets/video-previews/winter-reindeer-parade.jpg"),
  "mythic-first-new-year-fire": require("../assets/video-previews/mythic-first-new-year-fire.jpg"),
  "mythic-moon-queen-rise": require("../assets/video-previews/mythic-moon-queen-rise.jpg"),
  "mythic-last-night-of-the-old": require("../assets/video-previews/mythic-last-night-of-the-old.jpg"),
  "mythic-turning-tide": require("../assets/video-previews/mythic-turning-tide.jpg"),
  "mythic-lucky-dragon": require("../assets/video-previews/mythic-lucky-dragon.jpg"),
  "mythic-phoenix-ember": require("../assets/video-previews/mythic-phoenix-ember.jpg"),
  "photo-dance-oriental-phonk": require("../assets/video-previews/photo-dance-oriental-phonk.jpg"),
  "photo-dance-skeleton-dance": require("../assets/video-previews/photo-dance-skeleton-dance.jpg"),
  "photo-dance-hand-heart-beat": require("../assets/video-previews/photo-dance-hand-heart-beat.jpg"),
  "photo-dance-runway-turn": require("../assets/video-previews/photo-dance-runway-turn.jpg"),
  "subtle-shark-shadows": require("../assets/video-previews/subtle-shark-shadows.jpg"),
  "subtle-haunting-doll": require("../assets/video-previews/subtle-haunting-doll.jpg"),
  "subtle-vampire-velvet": require("../assets/video-previews/subtle-vampire-velvet.jpg"),
  "subtle-forest-changeling": require("../assets/video-previews/subtle-forest-changeling.jpg"),
  "camera-360-orbit": require("../assets/video-previews/camera-360-orbit.jpg"),
  "camera-lego-blast": require("../assets/video-previews/camera-lego-blast.jpg"),
  "camera-dollhouse-zoom": require("../assets/video-previews/camera-dollhouse-zoom.jpg"),
  "camera-beam-me-up": require("../assets/video-previews/camera-beam-me-up.jpg"),
  "pet-honey-bee-pet": require("../assets/video-previews/pet-honey-bee-pet.jpg"),
  "pet-paw-princess": require("../assets/video-previews/pet-paw-princess.jpg"),
  "pet-welcome-meow": require("../assets/video-previews/pet-welcome-meow.jpg"),
  "pet-tiny-royal-pup": require("../assets/video-previews/pet-tiny-royal-pup.jpg"),
  "pet-royal-puppy-coronation": require("../assets/video-previews/pet-royal-puppy-coronation.jpg"),
  "pet-cat-doorstep-wave": require("../assets/video-previews/pet-cat-doorstep-wave.jpg"),
  "pet-pink-princess-pup": require("../assets/video-previews/pet-pink-princess-pup.jpg"),
  "pet-bumblebee-boop": require("../assets/video-previews/pet-bumblebee-boop.jpg"),
  "animal-corgi-castle-run": require("../assets/video-previews/animal-corgi-castle-run.jpg"),
  "animal-kitten-magic-book": require("../assets/video-previews/animal-kitten-magic-book.jpg"),
  "animal-poodle-fashion-walk": require("../assets/video-previews/animal-poodle-fashion-walk.jpg"),
  "animal-bunny-flower-hop": require("../assets/video-previews/animal-bunny-flower-hop.jpg"),
  "animal-parrot-neon-dance": require("../assets/video-previews/animal-parrot-neon-dance.jpg"),
  "animal-hamster-dj-booth": require("../assets/video-previews/animal-hamster-dj-booth.jpg"),
  "animal-fox-forest-glow": require("../assets/video-previews/animal-fox-forest-glow.jpg"),
  "animal-horse-golden-trot": require("../assets/video-previews/animal-horse-golden-trot.jpg"),
  "animal-panda-bamboo-wave": require("../assets/video-previews/animal-panda-bamboo-wave.jpg"),
  "animal-penguin-snow-slide": require("../assets/video-previews/animal-penguin-snow-slide.jpg"),
  "animal-owl-moon-blink": require("../assets/video-previews/animal-owl-moon-blink.jpg"),
  "animal-turtle-island-stroll": require("../assets/video-previews/animal-turtle-island-stroll.jpg"),
  "animal-rabbit-teacup-spin": require("../assets/video-previews/animal-rabbit-teacup-spin.jpg"),
  "animal-cat-space-captain": require("../assets/video-previews/animal-cat-space-captain.jpg"),
  "animal-puppy-superhero-landing": require("../assets/video-previews/animal-puppy-superhero-landing.jpg"),
  "animal-kitten-ballet-twirl": require("../assets/video-previews/animal-kitten-ballet-twirl.jpg"),
  "animal-dog-surf-splash": require("../assets/video-previews/animal-dog-surf-splash.jpg"),
  "animal-guinea-pig-chef": require("../assets/video-previews/animal-guinea-pig-chef.jpg"),
  "animal-ferret-treasure-hunt": require("../assets/video-previews/animal-ferret-treasure-hunt.jpg"),
  "animal-little-dragon-pet": require("../assets/video-previews/animal-little-dragon-pet.jpg"),
  "ads-city-truck-spot": require("../assets/video-previews/ads-city-truck-spot.jpg"),
  "ads-poster-product-reveal": require("../assets/video-previews/ads-poster-product-reveal.jpg"),
  "ads-milk-splash-ad": require("../assets/video-previews/ads-milk-splash-ad.jpg"),
  "ads-sunglasses-close-up": require("../assets/video-previews/ads-sunglasses-close-up.jpg"),
  "dance-loop": require("../assets/video-previews/dance-loop.jpg"),
  "celebrity-wave": require("../assets/video-previews/celebrity-wave.jpg"),
  "fantasy-breeze": require("../assets/video-previews/fantasy-breeze.jpg"),
  "runway-turn": require("../assets/video-previews/runway-turn.jpg"),
};

const sampleVideo = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";
const videoInputRequirements = [
  "1 clear front-facing photo",
  "Single subject",
  "Good lighting",
];

type VideoPresetDraft = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  promptFocus: string;
};

type VideoSectionDraft = {
  id: string;
  title: string;
  seeAllSlug: string;
  items: VideoPresetDraft[];
};

const CLOSEUP_IMAGE_TEMPLATE_IDS = new Set([
  "glamour-speed",
  "headshot-pro",
  "single-soft-glam-closeup",
  "single-latte-makeup",
  "single-clean-girl-glow",
  "single-ceo-glow",
  "single-founder-headshot",
]);

const CLOSEUP_VIDEO_TEMPLATE_IDS = new Set([
  "visual-patch-liquid-metal-face",
  "film-villain-close-up",
  "ads-sunglasses-close-up",
]);

function getImageReferenceMode(id: string): TemplateReferenceMode {
  if (id === "content-lab") {
    return "none";
  }

  return CLOSEUP_IMAGE_TEMPLATE_IDS.has(id)
    ? "human-closeup"
    : "human-portrait";
}

function getVideoReferenceMode(id: string): TemplateReferenceMode {
  if (id.startsWith("pet-") || id.startsWith("animal-")) {
    return "none";
  }

  return CLOSEUP_VIDEO_TEMPLATE_IDS.has(id)
    ? "human-closeup"
    : "human-portrait";
}

const videoLibrarySections: VideoSectionDraft[] = [
  {
    id: "visual-patch",
    title: "Visual Patch",
    seeAllSlug: "visual-patch",
    items: [
      {
        id: "visual-patch-insta-bangs-spray",
        title: "Insta Bangs Spray",
        subtitle: "A playful hair-change reveal",
        description: "Animate a portrait with a fast beauty edit and glossy social energy.",
        category: "Visual",
        promptFocus: "hair makeover reveal with playful beauty energy",
      },
      {
        id: "visual-patch-long-hair-magic",
        title: "Long Hair Magic",
        subtitle: "Soft flowing hair movement",
        description: "Create a polished transformation with longer hair motion and camera drift.",
        category: "Visual",
        promptFocus: "long flowing hair transformation with soft movement",
      },
      {
        id: "visual-patch-red-or-white-glow",
        title: "Red Or White Glow",
        subtitle: "Color-swap fashion mood",
        description: "Shift the styling into a red-and-white editorial reveal.",
        category: "Visual",
        promptFocus: "red and white styling reveal with fashion glow",
      },
      {
        id: "visual-patch-liquid-metal-face",
        title: "Liquid Metal Face",
        subtitle: "Reflective futuristic texture",
        description: "Give a portrait a sleek liquid-metal finish with premium motion.",
        category: "Visual",
        promptFocus: "liquid metal face texture with futuristic reflections",
      },
    ],
  },
  {
    id: "makeover-studio",
    title: "Makeover Studio",
    seeAllSlug: "makeover-studio",
    items: [
      {
        id: "makeover-spotlight-entrance",
        title: "Spotlight Entrance",
        subtitle: "Stage-ready reveal",
        description: "Turn the subject into a dramatic stage entrance with warm lights.",
        category: "Makeover",
        promptFocus: "spotlight stage entrance with graceful reveal",
      },
      {
        id: "makeover-backstage-glam",
        title: "Backstage Glam",
        subtitle: "Satin prep-room reveal",
        description: "Create a polished backstage beauty moment with vanity lights, poised movement, and premium editorial glamour.",
        category: "Makeover",
        promptFocus: "backstage glam reveal with satin light, poised turn, premium beauty motion",
      },
      {
        id: "makeover-neon-entrance",
        title: "Neon Entrance",
        subtitle: "Electric stage arrival",
        description: "Animate a fashion-forward entrance with neon edge, sleek posture, and high-energy show lighting.",
        category: "Makeover",
        promptFocus: "neon stage entrance with fashion confidence, glowing lights, sleek camera move",
      },
      {
        id: "makeover-honey-bee-look",
        title: "Honey Bee Look",
        subtitle: "Cute costume motion",
        description: "Add a bright costume-inspired makeover with charming movement.",
        category: "Makeover",
        promptFocus: "honey bee inspired costume look with cheerful movement",
      },
      {
        id: "makeover-cleopatra-reborn",
        title: "Cleopatra Reborn",
        subtitle: "Regal gold styling",
        description: "Create a royal portrait motion with gold accessories and a calm gaze.",
        category: "Makeover",
        promptFocus: "regal golden Cleopatra inspired styling",
      },
      {
        id: "makeover-red-carpet-night",
        title: "Red Carpet Night",
        subtitle: "Flash-lit gala moment",
        description: "Animate a premium evening look with camera flashes and poised movement.",
        category: "Makeover",
        promptFocus: "red carpet gala pose with camera flashes",
      },
    ],
  },
  {
    id: "many-faces",
    title: "Many Faces",
    seeAllSlug: "many-faces",
    items: [
      {
        id: "many-faces-winter-sovereign",
        title: "Winter Sovereign",
        subtitle: "Royal cold-weather fantasy",
        description: "Transform the subject into a winter ruler with cinematic atmosphere.",
        category: "Faces",
        promptFocus: "winter royal transformation with elegant cold atmosphere",
      },
      {
        id: "many-faces-krampus-creature",
        title: "Krampus Creature",
        subtitle: "Dark fantasy persona",
        description: "Create a stylized folklore transformation with theatrical movement.",
        category: "Faces",
        promptFocus: "dark folklore costume transformation with theatrical motion",
      },
      {
        id: "many-faces-cubic-avatar",
        title: "Cubic Avatar",
        subtitle: "Blocky game-style look",
        description: "Turn the portrait into a playful cubic avatar with animated charm.",
        category: "Faces",
        promptFocus: "cubic game avatar transformation with playful motion",
      },
      {
        id: "many-faces-plushy-cuddle",
        title: "Plushy Cuddle",
        subtitle: "Soft toy-like makeover",
        description: "Add cozy plush styling and a gentle camera push.",
        category: "Faces",
        promptFocus: "soft plush toy inspired makeover with cozy motion",
      },
    ],
  },
  {
    id: "party-tricks",
    title: "Party Tricks",
    seeAllSlug: "party-tricks",
    items: [
      {
        id: "party-tricks-bald-swipe",
        title: "Bald Swipe",
        subtitle: "Comedic swipe transition",
        description: "Animate a cheeky before-after swipe with confident expression.",
        category: "Party",
        promptFocus: "comedic bald swipe transition with confident expression",
      },
      {
        id: "party-tricks-cry-me-a-river",
        title: "Cry Me A River",
        subtitle: "Oversized comic tears",
        description: "Create an exaggerated emotional reaction with glossy stylized tears.",
        category: "Party",
        promptFocus: "oversized comic tears with expressive face motion",
      },
      {
        id: "party-tricks-money-tornado",
        title: "Money Tornado",
        subtitle: "Floating cash moment",
        description: "Spin the scene into a playful luxury moment with flying bills.",
        category: "Party",
        promptFocus: "floating money tornado with playful luxury energy",
      },
      {
        id: "party-tricks-private-airplane-pose",
        title: "Private Airplane Pose",
        subtitle: "Jet-set confidence",
        description: "Add a travel-luxury pose with a smooth cinematic camera move.",
        category: "Party",
        promptFocus: "private airplane pose with jet set confidence",
      },
    ],
  },
  {
    id: "social-viral-hits",
    title: "Social Viral Hits",
    seeAllSlug: "social-viral-hits",
    items: [
      {
        id: "social-dream-mount",
        title: "Dream Mount",
        subtitle: "Fantasy ride reveal",
        description: "Make the subject feel like they are arriving in a fantasy viral scene.",
        category: "Viral",
        promptFocus: "fantasy mount arrival with dreamy social video energy",
      },
      {
        id: "social-private-jet-wave",
        title: "Private Jet Wave",
        subtitle: "Luxury arrival flex",
        description: "Turn a portrait into a glossy jet-set arrival with confident body language and premium travel energy.",
        category: "Viral",
        promptFocus: "private jet arrival with confident wave, luxury travel energy, glossy sunset motion",
      },
      {
        id: "social-luxury-phone-flip",
        title: "Luxury Phone Flip",
        subtitle: "Flashy social reveal",
        description: "Create a slick social-clout moment with a stylish pose, flashy attitude, and premium night-out energy.",
        category: "Viral",
        promptFocus: "luxury phone flip reveal with sharp outfit styling and social clout camera energy",
      },
      {
        id: "social-suit-swagger",
        title: "Suit Swagger",
        subtitle: "Sharp outfit confidence",
        description: "Animate a confident suited look with smooth swagger.",
        category: "Viral",
        promptFocus: "sharp suit swagger with confident camera movement",
      },
      {
        id: "social-emoji-check",
        title: "Emoji Check",
        subtitle: "Bright reaction moment",
        description: "Add a playful reaction edit with colorful floating icons.",
        category: "Viral",
        promptFocus: "bright emoji reaction check with playful movement",
      },
      {
        id: "social-old-photo-revival",
        title: "Old Photo Revival",
        subtitle: "Photo comes alive",
        description: "Bring a still portrait into a gentle nostalgic motion clip.",
        category: "Viral",
        promptFocus: "old photo revival with subtle nostalgic movement",
      },
    ],
  },
  {
    id: "film-tv-inspo",
    title: "Film & TV Inspo",
    seeAllSlug: "film-tv-inspo",
    items: [
      {
        id: "film-villain-close-up",
        title: "Villain Close-Up",
        subtitle: "Dramatic character framing",
        description: "Create a theatrical close-up with intense lighting and cinematic pacing.",
        category: "Film",
        promptFocus: "dramatic villain close up with cinematic lighting",
      },
      {
        id: "film-velvet-throne",
        title: "Velvet Throne",
        subtitle: "Dark royal stare",
        description: "Place the subject inside a moody throne-room portrait with velvet shadows, regal tension, and slow cinematic drift.",
        category: "Film",
        promptFocus: "dark velvet throne portrait with commanding gaze, slow cinematic push, regal tension",
      },
      {
        id: "film-mafia-table-call",
        title: "Mafia Table Call",
        subtitle: "Moody table scene",
        description: "Place the subject in a stylish old-cinema table moment.",
        category: "Film",
        promptFocus: "moody old cinema table call with stylish shadows",
      },
      {
        id: "film-magical-letter",
        title: "Magical Letter",
        subtitle: "Letter reveal fantasy",
        description: "Animate a floating letter moment with warm cinematic light.",
        category: "Film",
        promptFocus: "magical letter reveal with warm fantasy light",
      },
      {
        id: "film-prophecy-card",
        title: "Prophecy Card",
        subtitle: "Mystic omen reveal",
        description: "Create an arcane cinematic beat with glowing symbols, candlelit suspense, and a supernatural card reading vibe.",
        category: "Film",
        promptFocus: "mystic prophecy card reveal with glowing symbols and candlelit cinematic motion",
      },
      {
        id: "film-viking-nightmare",
        title: "Viking Nightmare",
        subtitle: "Nordic dream sequence",
        description: "Build a moody Nordic character moment with slow camera drift.",
        category: "Film",
        promptFocus: "Nordic dream sequence with moody cinematic motion",
      },
    ],
  },
  {
    id: "winter-vibe",
    title: "Winter Vibe",
    seeAllSlug: "winter-vibe",
    items: [
      {
        id: "winter-santa-glow",
        title: "Santa Glow",
        subtitle: "Holiday portrait motion",
        description: "Create a festive winter character moment with soft snowlight.",
        category: "Winter",
        promptFocus: "festive Santa inspired glow with soft winter light",
      },
      {
        id: "winter-mrs-claus-portrait",
        title: "Mrs Claus Portrait",
        subtitle: "Elegant holiday makeover",
        description: "Add a refined holiday portrait style with gentle motion.",
        category: "Winter",
        promptFocus: "elegant Mrs Claus inspired portrait with gentle motion",
      },
      {
        id: "winter-snowglobe-walk",
        title: "Snowglobe Walk",
        subtitle: "Tiny winter scene",
        description: "Surround the subject with a cinematic snowglobe atmosphere.",
        category: "Winter",
        promptFocus: "snowglobe winter walk with delicate falling snow",
      },
      {
        id: "winter-reindeer-parade",
        title: "Reindeer Parade",
        subtitle: "Cute holiday crowd",
        description: "Create a cheerful holiday parade with animated companions.",
        category: "Winter",
        promptFocus: "cheerful reindeer parade with festive motion",
      },
    ],
  },
  {
    id: "pet-showtime",
    title: "Pet Showtime",
    seeAllSlug: "pet-showtime",
    items: [
      {
        id: "pet-honey-bee-pet",
        title: "Honey Bee Pet",
        subtitle: "Cute costume clip",
        description: "Turn a pet portrait into a cute costume moment.",
        category: "Pet",
        promptFocus: "honey bee pet costume with cute gentle movement",
      },
      {
        id: "pet-paw-princess",
        title: "Paw Princess",
        subtitle: "Royal pet portrait",
        description: "Create a charming royal-pet video with soft posing.",
        category: "Pet",
        promptFocus: "royal pet princess pose with soft motion",
      },
      {
        id: "pet-welcome-meow",
        title: "Welcome Meow",
        subtitle: "Friendly greeting",
        description: "Animate a warm pet greeting with a tiny head turn.",
        category: "Pet",
        promptFocus: "friendly pet greeting with warm home atmosphere",
      },
      {
        id: "pet-tiny-royal-pup",
        title: "Tiny Royal Pup",
        subtitle: "Mini royal makeover",
        description: "Add a playful royal styling moment to a pet portrait.",
        category: "Pet",
        promptFocus: "tiny royal pup makeover with playful charm",
      },
      {
        id: "pet-royal-puppy-coronation",
        title: "Royal Puppy Coronation",
        subtitle: "Tiny throne ceremony",
        description: "Turn a puppy portrait into a regal coronation clip with soft camera motion.",
        category: "Pet",
        promptFocus: "royal puppy coronation on a velvet throne with gentle camera motion",
      },
      {
        id: "pet-cat-doorstep-wave",
        title: "Doorstep Cat Wave",
        subtitle: "Cute hello gesture",
        description: "Animate a cat with a friendly paw wave in a warm home entrance.",
        category: "Pet",
        promptFocus: "cat waving hello at a cozy doorstep with warm home light",
      },
      {
        id: "pet-pink-princess-pup",
        title: "Pink Princess Pup",
        subtitle: "Soft glam pet look",
        description: "Create a sweet pink-princess pet makeover with polished posing.",
        category: "Pet",
        promptFocus: "pink princess puppy makeover with soft glam movement",
      },
      {
        id: "pet-bumblebee-boop",
        title: "Bumblebee Boop",
        subtitle: "Playful costume bounce",
        description: "Add a cheerful bee costume moment with a tiny head tilt and bounce.",
        category: "Pet",
        promptFocus: "bumblebee pet costume with playful head tilt and cheerful bounce",
      },
    ],
  },
  {
    id: "ads-magic",
    title: "Ads Magic",
    seeAllSlug: "ads-magic",
    items: [
      {
        id: "ads-city-truck-spot",
        title: "City Truck Spot",
        subtitle: "Urban product reveal",
        description: "Create a clean city-ad style motion with a polished reveal.",
        category: "Ads",
        promptFocus: "city truck advertising spot with polished reveal",
      },
      {
        id: "ads-poster-product-reveal",
        title: "Poster Product Reveal",
        subtitle: "Bold poster animation",
        description: "Turn a still image into a premium poster-style product reveal.",
        category: "Ads",
        promptFocus: "poster product reveal with bold commercial motion",
      },
      {
        id: "ads-milk-splash-ad",
        title: "Milk Splash Ad",
        subtitle: "Fresh splash motion",
        description: "Add bright product-ad energy with a crisp splash transition.",
        category: "Ads",
        promptFocus: "fresh milk splash commercial with crisp motion",
      },
      {
        id: "ads-sunglasses-close-up",
        title: "Sunglasses Close-Up",
        subtitle: "Luxury accessory shot",
        description: "Create a premium close-up with reflective sunglasses and camera push.",
        category: "Ads",
        promptFocus: "luxury sunglasses close up with reflective camera push",
      },
    ],
  },
  {
    id: "animal-stars",
    title: "Animal Stars",
    seeAllSlug: "animal-stars",
    items: [
      {
        id: "animal-corgi-castle-run",
        title: "Corgi Castle Run",
        subtitle: "Royal hallway zoom",
        description: "Animate a cheerful corgi dashing through a tiny palace scene.",
        category: "Animal",
        promptFocus: "corgi running through a royal castle hallway with playful motion",
      },
      {
        id: "animal-kitten-magic-book",
        title: "Kitten Magic Book",
        subtitle: "Cozy spell reveal",
        description: "Create a warm fantasy moment with a kitten and glowing storybook.",
        category: "Animal",
        promptFocus: "kitten beside a glowing magic book with cozy fantasy motion",
      },
      {
        id: "animal-poodle-fashion-walk",
        title: "Poodle Fashion Walk",
        subtitle: "Mini runway strut",
        description: "Turn a pet portrait into a polished runway walk with cute attitude.",
        category: "Animal",
        promptFocus: "poodle fashion runway walk with polished cute attitude",
      },
      {
        id: "animal-bunny-flower-hop",
        title: "Bunny Flower Hop",
        subtitle: "Garden bounce",
        description: "Animate a bunny hopping through flowers with soft spring light.",
        category: "Animal",
        promptFocus: "bunny hopping through flowers with soft spring sunlight",
      },
      {
        id: "animal-parrot-neon-dance",
        title: "Parrot Neon Dance",
        subtitle: "Colorful beat clip",
        description: "Add a bright rhythmic parrot dance with neon party lighting.",
        category: "Animal",
        promptFocus: "parrot dancing to a beat with colorful neon party lights",
      },
      {
        id: "animal-hamster-dj-booth",
        title: "Hamster DJ Booth",
        subtitle: "Tiny party set",
        description: "Make a hamster look like a tiny DJ with playful head bobs.",
        category: "Animal",
        promptFocus: "hamster at a tiny DJ booth with playful head bob motion",
      },
      {
        id: "animal-fox-forest-glow",
        title: "Fox Forest Glow",
        subtitle: "Mystic woodland look",
        description: "Create a cinematic fox scene with glowing forest particles.",
        category: "Animal",
        promptFocus: "fox in a glowing forest with mystical cinematic movement",
      },
      {
        id: "animal-horse-golden-trot",
        title: "Horse Golden Trot",
        subtitle: "Sunlit stable motion",
        description: "Animate an elegant horse trotting in warm golden light.",
        category: "Animal",
        promptFocus: "horse trotting gracefully in warm golden stable light",
      },
      {
        id: "animal-panda-bamboo-wave",
        title: "Panda Bamboo Wave",
        subtitle: "Sweet hello moment",
        description: "Add a friendly panda wave in a soft bamboo garden.",
        category: "Animal",
        promptFocus: "panda waving hello in a soft bamboo garden",
      },
      {
        id: "animal-penguin-snow-slide",
        title: "Penguin Snow Slide",
        subtitle: "Cute winter glide",
        description: "Turn a penguin into a playful snow-slide video moment.",
        category: "Animal",
        promptFocus: "penguin sliding across snow with cute winter motion",
      },
      {
        id: "animal-owl-moon-blink",
        title: "Owl Moon Blink",
        subtitle: "Night portrait move",
        description: "Create a calm owl portrait with moonlight and subtle blinking.",
        category: "Animal",
        promptFocus: "owl under moonlight with subtle blinking and atmospheric motion",
      },
      {
        id: "animal-turtle-island-stroll",
        title: "Turtle Island Stroll",
        subtitle: "Slow tropical walk",
        description: "Animate a turtle crossing a tiny island with gentle camera drift.",
        category: "Animal",
        promptFocus: "turtle strolling on a tiny tropical island with gentle camera drift",
      },
      {
        id: "animal-rabbit-teacup-spin",
        title: "Rabbit Teacup Spin",
        subtitle: "Tiny tea-party scene",
        description: "Place a rabbit in a whimsical tea-party spin with cute motion.",
        category: "Animal",
        promptFocus: "rabbit in a whimsical tea party with tiny teacup spin motion",
      },
      {
        id: "animal-cat-space-captain",
        title: "Cat Space Captain",
        subtitle: "Tiny sci-fi hero",
        description: "Transform a cat into a small space captain with cinematic lights.",
        category: "Animal",
        promptFocus: "cat as a tiny space captain with cinematic sci fi lighting",
      },
      {
        id: "animal-puppy-superhero-landing",
        title: "Puppy Superhero Landing",
        subtitle: "Hero pose reveal",
        description: "Animate a puppy in a heroic landing pose with cape movement.",
        category: "Animal",
        promptFocus: "puppy superhero landing pose with cape movement and heroic light",
      },
      {
        id: "animal-kitten-ballet-twirl",
        title: "Kitten Ballet Twirl",
        subtitle: "Soft stage spin",
        description: "Create a cute kitten ballet twirl with gentle stage lighting.",
        category: "Animal",
        promptFocus: "kitten ballet twirl with soft stage lighting and graceful motion",
      },
      {
        id: "animal-dog-surf-splash",
        title: "Dog Surf Splash",
        subtitle: "Beach action clip",
        description: "Turn a dog portrait into a sunny surf splash with energetic motion.",
        category: "Animal",
        promptFocus: "dog surfing through a sunny splash with energetic beach motion",
      },
      {
        id: "animal-guinea-pig-chef",
        title: "Guinea Pig Chef",
        subtitle: "Tiny kitchen charm",
        description: "Animate a guinea pig chef in a cute miniature kitchen scene.",
        category: "Animal",
        promptFocus: "guinea pig chef in a tiny kitchen with charming playful motion",
      },
      {
        id: "animal-ferret-treasure-hunt",
        title: "Ferret Treasure Hunt",
        subtitle: "Adventure reveal",
        description: "Create a playful ferret adventure with treasure sparkle movement.",
        category: "Animal",
        promptFocus: "ferret treasure hunt adventure with sparkling reveal motion",
      },
      {
        id: "animal-little-dragon-pet",
        title: "Little Dragon Pet",
        subtitle: "Fantasy companion",
        description: "Turn a pet-style portrait into a tiny friendly dragon moment.",
        category: "Animal",
        promptFocus: "tiny friendly dragon pet with warm fantasy glow and gentle motion",
      },
    ],
  },
  {
    id: "mythic-energy",
    title: "Mythic Energy",
    seeAllSlug: "mythic-energy",
    items: [
      {
        id: "mythic-first-new-year-fire",
        title: "First New Year Fire",
        subtitle: "Ancient celebration",
        description: "Build a cinematic ritual celebration with warm torchlight.",
        category: "Mythic",
        promptFocus: "ancient New Year fire celebration with warm torchlight",
      },
      {
        id: "mythic-moon-queen-rise",
        title: "Moon Queen Rise",
        subtitle: "Celestial ascension",
        description: "Lift the subject into a regal moonlit fantasy with cloud-swept height, luminous styling, and elegant mythic motion.",
        category: "Mythic",
        promptFocus: "moon queen rising above clouds with luminous gown, celestial drift, fantasy grandeur",
      },
      {
        id: "mythic-last-night-of-the-old",
        title: "Last Night Of The Old",
        subtitle: "Epic winter farewell",
        description: "Animate a grand winter farewell scene with slow drifting camera.",
        category: "Mythic",
        promptFocus: "epic winter farewell with slow drifting camera",
      },
      {
        id: "mythic-turning-tide",
        title: "Turning Tide",
        subtitle: "Stormy harbor fantasy",
        description: "Create a moody harbor scene with atmospheric movement.",
        category: "Mythic",
        promptFocus: "stormy harbor fantasy with atmospheric tide movement",
      },
      {
        id: "mythic-lucky-dragon",
        title: "Lucky Dragon",
        subtitle: "Festive fantasy charm",
        description: "Add a bright lucky-dragon theme with elegant camera motion.",
        category: "Mythic",
        promptFocus: "lucky dragon fantasy charm with festive motion",
      },
      {
        id: "mythic-phoenix-ember",
        title: "Phoenix Ember",
        subtitle: "Fire rebirth motion",
        description: "Transform the scene into a blazing rebirth tableau with glowing sparks, mythic firelight, and dramatic rising energy.",
        category: "Mythic",
        promptFocus: "phoenix ember rebirth with glowing sparks, mythic firelight, dramatic rising motion",
      },
    ],
  },
  {
    id: "photo-dance",
    title: "Photo Dance",
    seeAllSlug: "photo-dance",
    items: [
      {
        id: "photo-dance-oriental-phonk",
        title: "Oriental Phonk",
        subtitle: "Rhythmic stylized pose",
        description: "Animate a stylized dance pose with rhythmic camera energy.",
        category: "Dance",
        promptFocus: "oriental phonk dance pose with rhythmic camera energy",
      },
      {
        id: "photo-dance-skeleton-dance",
        title: "Skeleton Dance",
        subtitle: "Sharp dance motion",
        description: "Create a bold dance clip with snappy pose changes.",
        category: "Dance",
        promptFocus: "skeleton dance inspired movement with snappy poses",
      },
      {
        id: "photo-dance-hand-heart-beat",
        title: "Hand Heart Beat",
        subtitle: "Cute hand gesture",
        description: "Add a sweet hand-heart movement with a soft beat.",
        category: "Dance",
        promptFocus: "hand heart gesture with soft beat motion",
      },
      {
        id: "photo-dance-runway-turn",
        title: "Runway Turn",
        subtitle: "Confident fashion turn",
        description: "Generate a compact runway clip with premium pacing and fashion posture.",
        category: "Dance",
        promptFocus: "luxury runway turn with confident fashion movement",
      },
    ],
  },
  {
    id: "subtle-horror",
    title: "Subtle Horror",
    seeAllSlug: "subtle-horror",
    items: [
      {
        id: "subtle-shark-shadows",
        title: "Shark Shadows",
        subtitle: "Surreal shadow reveal",
        description: "Create a surreal sea-shadow moment with restrained cinematic tension.",
        category: "Horror",
        promptFocus: "surreal shark shadow reveal with restrained tension",
      },
      {
        id: "subtle-haunting-doll",
        title: "Haunted Doll",
        subtitle: "Uncanny doll-like pose",
        description: "Animate a subtle eerie doll look with slow camera movement.",
        category: "Horror",
        promptFocus: "uncanny haunted doll pose with subtle eerie motion",
      },
      {
        id: "subtle-vampire-velvet",
        title: "Vampire Velvet",
        subtitle: "Elegant gothic mood",
        description: "Add a refined gothic look with velvet shadows and pale light.",
        category: "Horror",
        promptFocus: "elegant vampire velvet styling with gothic shadows",
      },
      {
        id: "subtle-forest-changeling",
        title: "Forest Changeling",
        subtitle: "Mystic woodland shift",
        description: "Create a mysterious forest transformation with gentle motion.",
        category: "Horror",
        promptFocus: "mystic forest changeling transformation with gentle motion",
      },
    ],
  },
  {
    id: "camera-transitions",
    title: "Camera Transitions",
    seeAllSlug: "camera-transitions",
    items: [
      {
        id: "camera-360-orbit",
        title: "360 Orbit",
        subtitle: "Smooth orbit transition",
        description: "Move the camera around the subject in a clean orbit shot.",
        category: "Camera",
        promptFocus: "smooth 360 orbit camera transition around the subject",
      },
      {
        id: "camera-lego-blast",
        title: "Lego Blast",
        subtitle: "Blocky burst transition",
        description: "Create a playful block-burst camera transition.",
        category: "Camera",
        promptFocus: "blocky lego blast transition with playful camera motion",
      },
      {
        id: "camera-dollhouse-zoom",
        title: "Dollhouse Zoom",
        subtitle: "Miniature room pull-in",
        description: "Zoom through a miniature set into the subject with a smooth reveal.",
        category: "Camera",
        promptFocus: "dollhouse zoom transition with miniature reveal",
      },
      {
        id: "camera-beam-me-up",
        title: "Beam Me Up",
        subtitle: "Light beam transition",
        description: "Add a glowing beam transition with cinematic lift.",
        category: "Camera",
        promptFocus: "glowing beam me up transition with cinematic lift",
      },
    ],
  },
];

function buildVideoTemplate(
  item: VideoPresetDraft,
  itemIndex: number,
  coverIndex: number
): Template {
  const coverUrl =
    localVideoPreviewAssets[item.id] ??
    gallery.videoCovers[coverIndex % gallery.videoCovers.length];
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    category: item.category,
    coverUrl,
    examples: [coverUrl],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    referenceMode: getVideoReferenceMode(item.id),
    isPro: false,
    defaultPrompt: `${item.promptFocus}, short social video, smooth camera movement, preserve subject identity, cinematic lighting.`,
    generationCost: 25,
    inputRequirements: videoInputRequirements,
    motionPreset: item.id,
  };
}

function buildExpandedVideoTemplates() {
  let coverIndex = 0;
  return videoLibrarySections.flatMap((section) =>
    section.items.map((item, itemIndex) =>
      buildVideoTemplate(item, itemIndex, coverIndex++)
    )
  );
}

const expandedVideoTemplates = buildExpandedVideoTemplates();

type ImagePresetDraft = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  promptFocus: string;
  stylePrompt?: string;
  compositionPrompt?: string;
  styleReferenceUrl?: string;
  compositionReferenceUrl?: string;
};

type ImagePresetSectionDraft = {
  id: string;
  title: string;
  seeAllSlug: string;
  items: ImagePresetDraft[];
};

const imagePresetSections: ImagePresetSectionDraft[] = [
  {
    id: "beauty-singles",
    title: "Beauty Singles",
    seeAllSlug: "beauty-singles",
    items: [
      {
        id: "single-soft-glam-closeup",
        title: "Soft Glam Close-Up",
        subtitle: "Glossy beauty portrait",
        description:
          "A polished close-up with soft skin glow, clean makeup, and premium beauty lighting.",
        category: "Beauty",
        promptFocus:
          "soft glam beauty close-up portrait, glossy skin glow, clean makeup, premium studio lighting",
      },
      {
        id: "single-latte-makeup",
        title: "Latte Makeup",
        subtitle: "Warm natural tones",
        description:
          "A warm-toned beauty portrait with soft brown styling and natural editorial polish.",
        category: "Beauty",
        promptFocus:
          "latte makeup beauty portrait, warm brown tones, natural editorial styling, soft light",
      },
      {
        id: "single-clean-girl-glow",
        title: "Clean Girl Glow",
        subtitle: "Fresh minimal beauty",
        description:
          "A fresh minimal portrait with dewy light, tidy hair, and a calm modern finish.",
        category: "Beauty",
        promptFocus:
          "clean girl fresh portrait, dewy skin, tidy hair, minimal modern beauty lighting",
      },
    ],
  },
  {
    id: "fashion-singles",
    title: "Fashion Singles",
    seeAllSlug: "fashion-singles",
    items: [
      {
        id: "single-pink-street-style",
        title: "Pink Street Style",
        subtitle: "Bright outfit moment",
        description:
          "A single social-ready fashion portrait with pink styling and confident street energy.",
        category: "Fashion",
        promptFocus:
          "pink street style fashion portrait, confident pose, bright city light, social-ready editorial",
      },
      {
        id: "single-leather-editorial",
        title: "Leather Editorial",
        subtitle: "Sharp magazine look",
        description:
          "A bold fashion portrait with structured leather styling and dramatic editorial shadows.",
        category: "Fashion",
        promptFocus:
          "structured leather fashion editorial portrait, dramatic shadows, magazine cover styling",
      },
      {
        id: "single-golden-hour-dress",
        title: "Golden Hour Dress",
        subtitle: "Soft sunset fashion",
        description:
          "An elegant single shot with warm sunset light, flowing wardrobe, and premium framing.",
        category: "Fashion",
        promptFocus:
          "golden hour dress fashion portrait, warm sunset light, elegant pose, premium framing",
      },
    ],
  },
  {
    id: "profile-upgrades",
    title: "Profile Upgrades",
    seeAllSlug: "profile-upgrades",
    items: [
      {
        id: "single-ceo-glow",
        title: "CEO Glow",
        subtitle: "Premium profile photo",
        description:
          "A polished profile portrait with confident expression, modern lighting, and executive feel.",
        category: "Profile",
        promptFocus:
          "premium executive profile portrait, confident expression, modern clean lighting, polished headshot",
      },
      {
        id: "single-dating-app-hero",
        title: "Dating App Hero",
        subtitle: "Friendly lifestyle shot",
        description:
          "A warm approachable portrait with natural smile, lifestyle framing, and flattering light.",
        category: "Profile",
        promptFocus:
          "friendly dating profile lifestyle portrait, natural smile, flattering light, approachable mood",
      },
      {
        id: "single-founder-headshot",
        title: "Founder Headshot",
        subtitle: "Startup-ready portrait",
        description:
          "A clean founder portrait with smart-casual styling and trustworthy studio polish.",
        category: "Profile",
        promptFocus:
          "startup founder headshot, smart casual styling, trustworthy expression, clean studio polish",
      },
    ],
  },
  {
    id: "fantasy-singles",
    title: "Fantasy Singles",
    seeAllSlug: "fantasy-singles",
    items: [
      {
        id: "single-ice-queen",
        title: "Ice Queen",
        subtitle: "Cold crystal portrait",
        description:
          "A fantasy portrait with icy highlights, crystal accents, and elegant winter styling.",
        category: "Fantasy",
        promptFocus:
          "ice queen fantasy portrait, crystal accents, elegant winter styling, cold cinematic light",
      },
      {
        id: "single-cyber-muse",
        title: "Cyber Muse",
        subtitle: "Neon future beauty",
        description:
          "A futuristic portrait with clean neon accents, sleek styling, and glossy reflections.",
        category: "Fantasy",
        promptFocus:
          "cyber muse futuristic portrait, neon accents, sleek styling, glossy reflections",
      },
      {
        id: "single-angel-glow",
        title: "Angel Glow",
        subtitle: "Soft ethereal light",
        description:
          "A bright ethereal portrait with soft glow, delicate wardrobe, and dreamy atmosphere.",
        category: "Fantasy",
        promptFocus:
          "angel glow ethereal portrait, soft bright light, delicate wardrobe, dreamy atmosphere",
      },
    ],
  },
  {
    id: "lifestyle-singles",
    title: "Lifestyle Singles",
    seeAllSlug: "lifestyle-singles",
    items: [
      {
        id: "single-cafe-portrait",
        title: "Cafe Portrait",
        subtitle: "Warm candid frame",
        description:
          "A cozy cafe lifestyle portrait with warm light, natural pose, and polished color.",
        category: "Lifestyle",
        promptFocus:
          "cozy cafe lifestyle portrait, warm light, natural pose, polished color grading",
      },
      {
        id: "single-rooftop-smile",
        title: "Rooftop Smile",
        subtitle: "City light portrait",
        description:
          "A bright rooftop portrait with city depth, casual confidence, and clean social framing.",
        category: "Lifestyle",
        promptFocus:
          "rooftop lifestyle portrait, city skyline depth, casual confident smile, clean social framing",
      },
      {
        id: "single-beach-day",
        title: "Beach Day",
        subtitle: "Sunny vacation look",
        description:
          "A relaxed vacation portrait with beach light, airy styling, and natural summer mood.",
        category: "Lifestyle",
        promptFocus:
          "sunny beach lifestyle portrait, airy vacation styling, natural summer mood, soft light",
      },
    ],
  },
  {
    id: "travel-singles",
    title: "Travel Singles",
    seeAllSlug: "travel-singles",
    items: [
      {
        id: "single-paris-morning",
        title: "Paris Morning",
        subtitle: "Soft city postcard",
        description:
          "A romantic city portrait with Parisian morning light, soft styling, and street-cafe charm.",
        category: "Travel",
        promptFocus:
          "Paris morning travel portrait, soft city light, street cafe charm, romantic editorial styling",
      },
      {
        id: "single-tokyo-night",
        title: "Tokyo Night",
        subtitle: "Neon travel frame",
        description:
          "A glossy night portrait with neon reflections, city depth, and modern travel energy.",
        category: "Travel",
        promptFocus:
          "Tokyo night travel portrait, neon reflections, glossy city depth, modern street style",
      },
      {
        id: "single-dubai-luxury",
        title: "Dubai Luxury",
        subtitle: "Desert skyline glow",
        description:
          "A premium travel portrait with golden skyline tones, clean luxury styling, and warm air.",
        category: "Travel",
        promptFocus:
          "Dubai luxury travel portrait, golden skyline tones, warm desert light, premium styling",
      },
    ],
  },
  {
    id: "ad-singles",
    title: "Ad Singles",
    seeAllSlug: "ad-singles",
    items: [
      {
        id: "single-perfume-ad",
        title: "Perfume Ad",
        subtitle: "Luxury product mood",
        description:
          "A polished beauty-ad portrait with reflective glass, soft highlights, and premium campaign energy.",
        category: "Ad",
        promptFocus:
          "luxury perfume advertising portrait, reflective glass highlights, premium campaign lighting",
      },
      {
        id: "single-soda-splash",
        title: "Soda Splash",
        subtitle: "Fresh commercial pop",
        description:
          "A bright product-style portrait with crisp splash energy, bold color, and clean studio polish.",
        category: "Ad",
        promptFocus:
          "fresh soda splash advertising portrait, bold color, crisp studio polish, commercial energy",
      },
      {
        id: "single-sneaker-campaign",
        title: "Sneaker Campaign",
        subtitle: "Streetwear product shot",
        description:
          "A sporty fashion ad with streetwear styling, dynamic angle, and sharp product-campaign feel.",
        category: "Ad",
        promptFocus:
          "sneaker streetwear campaign portrait, dynamic angle, sporty styling, sharp commercial lighting",
      },
    ],
  },
  {
    id: "cinematic-singles",
    title: "Cinematic Singles",
    seeAllSlug: "cinematic-singles",
    items: [
      {
        id: "single-noir-detective",
        title: "Noir Detective",
        subtitle: "Moody film still",
        description:
          "A dramatic black-and-white film portrait with rain reflections, shadows, and classic mystery mood.",
        category: "Cinema",
        promptFocus:
          "noir detective film still portrait, black and white, rain reflections, classic mystery shadows",
      },
      {
        id: "single-sci-fi-pilot",
        title: "Sci-Fi Pilot",
        subtitle: "Space cockpit portrait",
        description:
          "A cinematic sci-fi character portrait with cockpit light, sleek wardrobe, and heroic framing.",
        category: "Cinema",
        promptFocus:
          "sci-fi pilot cinematic portrait, cockpit light, sleek futuristic wardrobe, heroic framing",
      },
      {
        id: "single-romcom-main-character",
        title: "Romcom Main Character",
        subtitle: "Warm movie moment",
        description:
          "A charming film-like portrait with warm city light, soft expression, and main-character framing.",
        category: "Cinema",
        promptFocus:
          "romcom main character cinematic portrait, warm city light, soft expression, charming framing",
      },
    ],
  },
  {
    id: "retro-singles",
    title: "Retro Singles",
    seeAllSlug: "retro-singles",
    items: [
      {
        id: "single-y2k-flash",
        title: "Y2K Flash",
        subtitle: "Glossy 2000s energy",
        description:
          "A playful Y2K portrait with direct flash, glossy styling, and nostalgic social energy.",
        category: "Retro",
        promptFocus:
          "Y2K flash portrait, glossy 2000s styling, direct flash, nostalgic social energy",
      },
      {
        id: "single-70s-film-star",
        title: "70s Film Star",
        subtitle: "Warm grain portrait",
        description:
          "A vintage film-star portrait with warm grain, soft curls, and retro editorial color.",
        category: "Retro",
        promptFocus:
          "1970s film star portrait, warm film grain, retro editorial color, soft vintage styling",
      },
      {
        id: "single-90s-supermodel",
        title: "90s Supermodel",
        subtitle: "Archive fashion look",
        description:
          "A classic 90s fashion portrait with clean studio light, confident pose, and archive styling.",
        category: "Retro",
        promptFocus:
          "1990s supermodel fashion portrait, clean studio light, confident pose, archive editorial styling",
      },
    ],
  },
  {
    id: "holiday-singles",
    title: "Holiday Singles",
    seeAllSlug: "holiday-singles",
    items: [
      {
        id: "single-new-year-glitter",
        title: "New Year Glitter",
        subtitle: "Sparkling party frame",
        description:
          "A festive portrait with glittering lights, champagne tones, and elegant party styling.",
        category: "Holiday",
        promptFocus:
          "New Year glitter party portrait, sparkling lights, champagne tones, elegant festive styling",
      },
      {
        id: "single-valentine-rose",
        title: "Valentine Rose",
        subtitle: "Romantic pink light",
        description:
          "A soft romantic portrait with rose accents, pink light, and polished beauty styling.",
        category: "Holiday",
        promptFocus:
          "Valentine rose romantic portrait, pink light, rose accents, polished beauty styling",
      },
      {
        id: "single-cozy-christmas",
        title: "Cozy Christmas",
        subtitle: "Warm festive portrait",
        description:
          "A cozy holiday portrait with warm lights, soft knit styling, and gentle winter mood.",
        category: "Holiday",
        promptFocus:
          "cozy Christmas portrait, warm festive lights, soft knit styling, gentle winter mood",
      },
    ],
  },
  {
    id: "avatar-singles",
    title: "Avatar Singles",
    seeAllSlug: "avatar-singles",
    items: [
      {
        id: "single-3d-avatar",
        title: "3D Avatar",
        subtitle: "Polished character look",
        description:
          "A clean 3D character portrait with soft materials, expressive face, and premium render lighting.",
        category: "Avatar",
        promptFocus:
          "polished 3D avatar portrait, soft materials, expressive face, premium render lighting",
      },
      {
        id: "single-anime-idol",
        title: "Anime Idol",
        subtitle: "Bright stylized portrait",
        description:
          "A vibrant anime-inspired portrait with idol styling, crisp detail, and glowing stage light.",
        category: "Avatar",
        promptFocus:
          "anime idol inspired portrait, vibrant styling, crisp detail, glowing stage light",
      },
      {
        id: "single-game-hero",
        title: "Game Hero",
        subtitle: "Fantasy RPG portrait",
        description:
          "A heroic game-character portrait with fantasy wardrobe, dramatic lighting, and strong pose.",
        category: "Avatar",
        promptFocus:
          "fantasy RPG game hero portrait, dramatic lighting, heroic pose, detailed character wardrobe",
      },
    ],
  },
];

function getSingleImageStyleReferenceUrl(item: ImagePresetDraft) {
  switch (item.id) {
    case "single-soft-glam-closeup":
      return referenceGallery.softGlamStyle;
    case "single-latte-makeup":
      return referenceGallery.latteStyle;
    case "single-clean-girl-glow":
      return referenceGallery.cleanGirlStyle;
    case "single-pink-street-style":
      return referenceGallery.pinkStreetStyle;
    case "single-leather-editorial":
      return referenceGallery.leatherStyle;
    case "single-golden-hour-dress":
      return referenceGallery.goldenHourStyle;
    case "single-ceo-glow":
      return referenceGallery.ceoStyle;
    case "single-dating-app-hero":
      return referenceGallery.datingStyle;
    case "single-founder-headshot":
      return referenceGallery.founderStyle;
    case "single-ice-queen":
      return referenceGallery.iceQueenStyle;
    case "single-cyber-muse":
      return referenceGallery.cyberMuseStyle;
    case "single-angel-glow":
      return referenceGallery.angelGlowStyle;
    case "single-cafe-portrait":
      return referenceGallery.cafeStyle;
    case "single-rooftop-smile":
      return referenceGallery.rooftopStyle;
    case "single-beach-day":
      return referenceGallery.beachStyle;
    case "single-paris-morning":
      return referenceGallery.parisStyle;
    case "single-tokyo-night":
      return referenceGallery.tokyoStyle;
    case "single-dubai-luxury":
      return referenceGallery.dubaiStyle;
    case "single-perfume-ad":
      return referenceGallery.perfumeStyle;
    case "single-soda-splash":
      return referenceGallery.sodaStyle;
    case "single-sneaker-campaign":
      return referenceGallery.sneakerStyle;
    case "single-noir-detective":
      return referenceGallery.noirStyle;
    case "single-sci-fi-pilot":
      return referenceGallery.scifiStyle;
    case "single-romcom-main-character":
      return referenceGallery.romcomStyle;
    case "single-y2k-flash":
      return referenceGallery.y2kStyle;
    case "single-70s-film-star":
      return referenceGallery.seventiesStyle;
    case "single-90s-supermodel":
      return referenceGallery.supermodelStyle;
    case "single-new-year-glitter":
      return referenceGallery.newYearStyle;
    case "single-valentine-rose":
      return referenceGallery.valentineStyle;
    case "single-cozy-christmas":
      return referenceGallery.christmasStyle;
    case "single-3d-avatar":
      return referenceGallery.avatar3dStyle;
    case "single-anime-idol":
      return referenceGallery.animeStyle;
    case "single-game-hero":
      return referenceGallery.gameHeroStyle;
    default:
      return referenceGallery.contentLabStyle;
  }
}

function getSingleImageCompositionReferenceUrl(item: ImagePresetDraft) {
  switch (item.category) {
    case "Beauty":
      return referenceGallery.closeBeautyComp;
    case "Fashion":
      return referenceGallery.fashionStreetComp;
    case "Profile":
      return referenceGallery.professionalComp;
    case "Fantasy":
      return referenceGallery.fantasyComp;
    case "Lifestyle":
      return referenceGallery.lifestyleComp;
    case "Travel":
      return referenceGallery.travelComp;
    case "Ad":
      return referenceGallery.adComp;
    case "Cinema":
      return referenceGallery.cinemaComp;
    case "Retro":
      return referenceGallery.retroComp;
    case "Holiday":
      return referenceGallery.holidayComp;
    case "Avatar":
      return referenceGallery.avatarComp;
    default:
      return referenceGallery.contentLabComp;
  }
}

const singleImageStylePromptById: Record<string, string> = {
  "single-soft-glam-closeup":
    "Glossy close beauty portrait with luminous skin, soft studio bloom, neutral-luxe makeup, polished editorial retouching, and premium commercial beauty energy.",
  "single-latte-makeup":
    "Warm brown beauty portrait with latte-toned makeup, creamy highlights, soft editorial skin finish, understated luxury styling, and cozy premium beauty mood.",
  "single-clean-girl-glow":
    "Minimal fresh beauty portrait with dewy skin, brushed natural brows, tidy hair, clean daylight polish, restrained styling, and calm modern luxury realism.",
  "single-pink-street-style":
    "Pink-led street fashion portrait with playful confidence, glossy city light, trend-forward wardrobe styling, social-ready energy, and bright editorial color contrast.",
  "single-leather-editorial":
    "Sharp leather fashion editorial with structured wardrobe, dramatic contrast, cool magazine polish, assertive styling, and bold luxury campaign attitude.",
  "single-golden-hour-dress":
    "Golden hour fashion portrait with flowing dress movement, honey sunset light, elegant romance, premium outdoor polish, and soft cinematic warmth.",
  "single-ceo-glow":
    "Executive portrait with premium realism, smart tailoring, clean modern light, elevated trustworthiness, and founder-level visual authority.",
  "single-dating-app-hero":
    "Approachable lifestyle portrait with flattering natural light, easy charm, social warmth, polished candid realism, and attractive but believable styling.",
  "single-founder-headshot":
    "Startup founder portrait with smart-casual polish, credible confidence, clean studio realism, subtle luxury finish, and professional brand-friendly styling.",
  "single-ice-queen":
    "Fantasy portrait with crystalline accents, icy glow, regal winter styling, cool luminous highlights, couture elegance, and cinematic frozen atmosphere.",
  "single-cyber-muse":
    "Futuristic fashion portrait with sleek neon accents, reflective materials, glossy skin finish, high-tech styling, and premium cyber editorial mood.",
  "single-angel-glow":
    "Ethereal portrait with bright heavenly light, soft whites, delicate wardrobe, dreamy haze, graceful beauty polish, and serene celestial atmosphere.",
  "single-cafe-portrait":
    "Warm cafe lifestyle portrait with cozy indoor light, candid elegance, effortless wardrobe styling, rich natural color, and polished social realism.",
  "single-rooftop-smile":
    "Clean rooftop lifestyle portrait with city depth, light breeze energy, easy confidence, modern social polish, and bright premium urban mood.",
  "single-beach-day":
    "Sunny beach portrait with airy summer styling, soft skin glow, relaxed vacation energy, natural editorial warmth, and clean coastal color.",
  "single-paris-morning":
    "Romantic Paris portrait with soft morning light, chic café-side styling, refined travel elegance, muted luxury palette, and postcard editorial charm.",
  "single-tokyo-night":
    "Glossy Tokyo night portrait with neon reflections, sleek street styling, saturated modern color, cinematic nightlife polish, and stylish travel energy.",
  "single-dubai-luxury":
    "Luxury travel portrait with warm skyline glow, desert-gold palette, polished upscale styling, premium aspirational mood, and clean high-end finish.",
  "single-perfume-ad":
    "Luxury beauty-ad portrait with reflective highlights, premium campaign polish, expensive product-world styling, elegant skin finish, and high-end commercial mood.",
  "single-soda-splash":
    "Fresh commercial portrait with bold pop color, crisp splash energy, glossy studio polish, youthful ad brightness, and sharp campaign clarity.",
  "single-sneaker-campaign":
    "Streetwear campaign portrait with sporty attitude, dynamic styling, crisp product-focus energy, branded commercial polish, and modern urban fashion feel.",
  "single-noir-detective":
    "Noir film-still portrait with monochrome contrast, rainy reflections, mystery shadows, classic cinematic tension, and moody character-driven atmosphere.",
  "single-sci-fi-pilot":
    "Heroic sci-fi portrait with cockpit glow, futuristic wardrobe, metallic light accents, premium blockbuster polish, and confident spacefaring energy.",
  "single-romcom-main-character":
    "Warm romcom portrait with soft city bokeh, charming expression, polished natural beauty, main-character intimacy, and feel-good cinematic glow.",
  "single-y2k-flash":
    "Playful Y2K portrait with direct flash, glossy nostalgic styling, high-shine surfaces, cheeky social energy, and 2000s fashion attitude.",
  "single-70s-film-star":
    "Vintage star portrait with warm film grain, retro glamour styling, soft analog texture, honeyed color, and elegant 70s editorial romance.",
  "single-90s-supermodel":
    "Archive supermodel portrait with clean studio light, powerful pose, minimal luxury styling, premium fashion realism, and iconic 90s editorial cool.",
  "single-new-year-glitter":
    "Festive portrait with sparkling highlights, champagne glow, elegant party styling, premium holiday polish, and celebratory luxe atmosphere.",
  "single-valentine-rose":
    "Romantic beauty portrait with pink light, rose-toned styling, soft feminine glow, polished skin finish, and intimate luxury mood.",
  "single-cozy-christmas":
    "Warm holiday portrait with amber lights, knit texture, soft winter coziness, polished festive realism, and gentle nostalgic comfort.",
  "single-3d-avatar":
    "Polished 3D character portrait with smooth premium materials, expressive facial readability, soft render lighting, and high-end stylized realism.",
  "single-anime-idol":
    "Bright anime-inspired idol portrait with vivid stage light, crisp stylization, glamorous character design, and premium polished illustration finish.",
  "single-game-hero":
    "Fantasy game-hero portrait with dramatic armor-and-fabric styling, epic light shaping, high-detail character polish, and premium RPG key-art energy.",
};

const singleImageCompositionPromptById: Record<string, string> = {
  "single-soft-glam-closeup":
    "Use a tight beauty close-up with the face dominating the frame, refined eye-line control, minimal background distraction, and crisp makeup readability.",
  "single-latte-makeup":
    "Frame as a close beauty portrait with soft head angle, chest-up crop, elegant face priority, and clean separation that keeps the warm makeup clearly readable.",
  "single-clean-girl-glow":
    "Use a clean chest-up portrait crop with relaxed posture, balanced symmetry, natural eye contact, and enough negative space for a minimal editorial feel.",
  "single-pink-street-style":
    "Frame as a fashion-forward mid portrait with strong pose geometry, readable outfit styling, urban depth behind the subject, and social-cover confidence.",
  "single-leather-editorial":
    "Use a mid-to-upper-body editorial crop with assertive stance, directional shoulders, dramatic side light, and strong wardrobe silhouette readability.",
  "single-golden-hour-dress":
    "Frame the subject in a graceful upper-body or three-quarter crop with flowing fabric movement, soft body angle, and sunset depth around the silhouette.",
  "single-ceo-glow":
    "Use a polished headshot crop with shoulders visible, confident posture, direct or near-direct eye line, and uncluttered professional spatial hierarchy.",
  "single-dating-app-hero":
    "Frame as a flattering lifestyle portrait with relaxed body language, natural smile readability, soft chest-up crop, and inviting environmental depth.",
  "single-founder-headshot":
    "Use a clean founder-style headshot or upper-body crop with calm posture, balanced shoulders, crisp face detail, and a professional uncluttered background.",
  "single-ice-queen":
    "Frame as a regal hero portrait with centered face dominance, elegant posture, crystalline environment cues, and strong silhouette separation from the background.",
  "single-cyber-muse":
    "Use a close-to-mid futuristic portrait crop with sleek angles, strong facial readability, reflective background accents, and dominant subject separation.",
  "single-angel-glow":
    "Frame as a luminous upper-body portrait with soft frontal presence, airy negative space, delicate posture, and a clean halo-like subject separation.",
  "single-cafe-portrait":
    "Use a natural cafe portrait crop with seated or relaxed posture, environmental storytelling in the background, and intimate chest-up framing.",
  "single-rooftop-smile":
    "Frame as a bright rooftop lifestyle portrait with skyline depth, casual body angle, upper-body crop, and easy social-photo readability.",
  "single-beach-day":
    "Use a relaxed vacation portrait crop with natural body angle, soft environment depth, readable beach context, and editorial summer balance.",
  "single-paris-morning":
    "Frame as a refined travel portrait with café or street context, elegant chest-up crop, gentle body turn, and romantic city depth.",
  "single-tokyo-night":
    "Use a night-city portrait crop with strong facial priority, layered neon depth, glossy reflections behind the subject, and modern street-photo framing.",
  "single-dubai-luxury":
    "Frame as an upscale travel portrait with poised body language, skyline or architecture depth, premium upper-body composition, and aspirational separation.",
  "single-perfume-ad":
    "Use a beauty-campaign composition with product-world elegance, crisp face focus, controlled hand or shoulder posing, and premium commercial balance.",
  "single-soda-splash":
    "Frame as a high-impact ad portrait with direct face readability, energetic pose, crisp studio separation, and room for bold commercial accents.",
  "single-sneaker-campaign":
    "Use a sporty editorial crop with dynamic angle, readable streetwear styling, strong body line, and campaign-level subject-background separation.",
  "single-noir-detective":
    "Frame as a moody film-still portrait with strong chiaroscuro, face-emphasis, rain-lit background cues, and classic cinematic tension in the crop.",
  "single-sci-fi-pilot":
    "Use a heroic mid portrait with cockpit framing cues, decisive posture, strong face readability, and premium environment storytelling around the subject.",
  "single-romcom-main-character":
    "Frame as an intimate cinematic portrait with warm bokeh depth, expressive face priority, soft body angle, and emotionally inviting composition.",
  "single-y2k-flash":
    "Use a direct-flash social portrait crop with close facial presence, playful posture, glossy styling visibility, and unapologetically frontal framing.",
  "single-70s-film-star":
    "Frame as a vintage glamour portrait with elegant head angle, soft shoulder line, warm depth, and classic editorial face priority.",
  "single-90s-supermodel":
    "Use a clean upper-body fashion crop with iconic pose confidence, strong jaw-and-shoulder line, studio readability, and archive-magazine balance.",
  "single-new-year-glitter":
    "Frame as a festive evening portrait with elegant upper-body crop, sparkling depth cues, celebratory posture, and premium party-photo readability.",
  "single-valentine-rose":
    "Use a soft romantic beauty crop with gentle head tilt, face-first composition, flattering close framing, and dreamy depth around rose accents.",
  "single-cozy-christmas":
    "Frame as a warm lifestyle portrait with intimate chest-up crop, cozy environment depth, soft posture, and readable winter styling textures.",
  "single-3d-avatar":
    "Use a hero character portrait crop with strong facial readability, clear silhouette, clean background separation, and premium key-art balance.",
  "single-anime-idol":
    "Frame as a polished anime idol portrait with dominant face readability, stage-light depth, elegant character silhouette, and close-to-mid crop.",
  "single-game-hero":
    "Use a cinematic hero composition with strong silhouette, detailed costume readability, commanding posture, and layered fantasy world depth.",
};

function buildSingleImageTemplate(
  item: ImagePresetDraft,
  itemIndex: number,
  coverIndex: number
): Template {
  const coverUrl = gallery.photoPackCovers[coverIndex % gallery.photoPackCovers.length];

  return {
    id: item.id,
    kind: "single",
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    category: item.category,
    stylePrompt:
      item.stylePrompt ?? singleImageStylePromptById[item.id] ?? buildSingleImageStylePrompt(item),
    compositionPrompt:
      item.compositionPrompt ??
      singleImageCompositionPromptById[item.id] ??
      buildSingleImageCompositionPrompt(item),
    styleReferenceUrl:
      item.styleReferenceUrl ?? getSingleImageStyleReferenceUrl(item),
    compositionReferenceUrl:
      item.compositionReferenceUrl ?? getSingleImageCompositionReferenceUrl(item),
    coverUrl,
    examples: [
      coverUrl,
      gallery.photoPackCovers[(coverIndex + 1) % gallery.photoPackCovers.length],
      gallery.photoPackCovers[(coverIndex + 2) % gallery.photoPackCovers.length],
    ],
    modeType: "image",
    referenceMode: getImageReferenceMode(item.id),
    isPro: false,
    defaultPrompt: `${item.promptFocus}, preserve subject identity, single high-quality AI photo, premium editorial lighting.`,
    generationCost: 4,
    inputRequirements: ["1 portrait photo", "Visible face", "Good lighting"],
  };
}

function buildSingleImageStylePrompt(item: ImagePresetDraft) {
  const categoryDirection =
    item.category === "Beauty" || item.category === "Glamour"
      ? "Keep the image premium, glossy, skin-true, makeup-aware, and beauty-campaign polished."
      : item.category === "Fashion"
      ? "Keep the image editorial, wardrobe-led, fashion-forward, and magazine-ready with deliberate pose direction."
      : item.category === "Profile"
      ? "Keep the image trustworthy, polished, flattering, realistic, and professionally lit."
      : item.category === "Fantasy"
      ? "Keep the image cinematic, stylized, immersive, and premium while preserving realistic facial readability."
      : item.category === "Lifestyle"
      ? "Keep the image natural, social-ready, softly polished, and believable rather than overly staged."
      : item.category === "Travel"
      ? "Keep the image location-rich, atmospheric, elegant, and aspirational with a clear sense of place."
      : item.category === "Ad"
      ? "Keep the image commercial, high-impact, brand-clean, and sharply art-directed like a campaign visual."
      : item.category === "Cinema"
      ? "Keep the image cinematic, character-driven, moody, and frame-worthy like a polished film still."
      : item.category === "Retro"
      ? "Keep the image nostalgic, texture-aware, flash-friendly, and era-specific without turning it into parody."
      : "Keep the image premium, polished, visually cohesive, and strongly art-directed.";

  return `${item.promptFocus}. ${categoryDirection}`;
}

function buildSingleImageCompositionPrompt(item: ImagePresetDraft) {
  const closeupDirection = getImageReferenceMode(item.id) === "human-closeup";

  if (item.category === "Beauty" || item.category === "Glamour") {
    return closeupDirection
      ? "Use a tight beauty close-up with the face dominating the frame, clean background separation, refined eye-line control, and makeup detail that reads clearly."
      : "Use a chest-up beauty portrait with elegant pose direction, strong face readability, soft body angle, and premium studio separation.";
  }

  if (item.category === "Profile") {
    return "Frame the subject as a polished headshot or upper-body portrait with confident posture, clean shoulders, balanced eye contact, and uncluttered background hierarchy.";
  }

  if (item.category === "Fashion" || item.category === "Ad") {
    return "Frame the subject like an editorial campaign shot with readable wardrobe styling, deliberate pose geometry, strong body line, and crisp subject-background separation.";
  }

  if (item.category === "Fantasy" || item.category === "Cinema" || item.category === "Avatar") {
    return "Frame the subject as a cinematic character portrait with dominant hero presence, controlled environment storytelling, strong silhouette readability, and premium focal separation.";
  }

  if (item.category === "Lifestyle" || item.category === "Travel" || item.category === "Retro") {
    return "Frame the subject in a natural editorial portrait with clear environment context, relaxed body language, social-friendly crop, and believable depth.";
  }

  return closeupDirection
    ? "Use a premium close-up portrait crop with clean face framing, clear skin texture, and strong background separation."
    : "Use a single-subject editorial portrait with readable pose, balanced crop, and polished environment depth.";
}

function buildSingleImageTemplates() {
  let coverIndex = 0;
  return imagePresetSections.flatMap((section) =>
    section.items.map((item, itemIndex) =>
      buildSingleImageTemplate(item, itemIndex, coverIndex++)
    )
  );
}

const expandedSingleImageTemplates = buildSingleImageTemplates();

type PhotoPackDraft = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  promptFocus: string;
  stylePrompt?: string;
  compositionPrompt?: string;
  styleReferenceUrl?: string;
  compositionReferenceUrl?: string;
};

type PhotoPackSectionDraft = {
  id: string;
  title: string;
  seeAllSlug: string;
  items: PhotoPackDraft[];
};

const photoPackSections: PhotoPackSectionDraft[] = [
  {
    id: "luxury-shoots",
    title: "Luxury Shoots",
    seeAllSlug: "luxury-shoots",
    items: [
      {
        id: "pack-pink-porsche-effect",
        title: "Pink Porsche Effect",
        subtitle: "Dreamy luxury car editorial",
        description:
          "A soft pink luxury lifestyle shoot with confident poses, glossy sunlight, and an expensive summer mood.",
        category: "Luxury",
        promptFocus:
          "pink luxury sports car editorial photoshoot, glossy summer sunlight, coordinated outfits, confident lifestyle poses",
      },
      {
        id: "pack-private-villa-day",
        title: "Private Villa Day",
        subtitle: "Poolside resort campaign",
        description:
          "A polished villa lifestyle session with relaxed resort styling and warm architectural light.",
        category: "Luxury",
        promptFocus:
          "private villa resort photoshoot, poolside luxury styling, warm architectural light, elegant relaxed poses",
      },
      {
        id: "pack-champagne-balcony",
        title: "Champagne Balcony",
        subtitle: "Golden-hour terrace set",
        description:
          "An elevated terrace shoot with champagne tones, city light, and polished evening styling.",
        category: "Luxury",
        promptFocus:
          "champagne balcony editorial photoshoot, golden hour city terrace, polished evening styling, elegant poses",
      },
    ],
  },
  {
    id: "car-girl-packs",
    title: "Car Girl Packs",
    seeAllSlug: "car-girl-packs",
    items: [
      {
        id: "pack-convertible-summer",
        title: "Convertible Summer",
        subtitle: "Open-top sunny shoot",
        description:
          "A bright convertible lifestyle set with sunglasses, wind movement, and social-ready framing.",
        category: "Cars",
        promptFocus:
          "convertible car summer photoshoot, sunglasses, soft wind, bright street light, stylish social media poses",
      },
      {
        id: "pack-night-drive-flash",
        title: "Night Drive Flash",
        subtitle: "Flash-lit street energy",
        description:
          "A nocturnal car shoot with direct flash, glossy reflections, and cinematic city energy.",
        category: "Cars",
        promptFocus:
          "night drive car editorial photoshoot, direct flash, glossy reflections, cinematic city street energy",
      },
      {
        id: "pack-gas-station-glam",
        title: "Gas Station Glam",
        subtitle: "Retro roadside styling",
        description:
          "A retro roadside campaign with neon accents, confident poses, and clean fashion styling.",
        category: "Cars",
        promptFocus:
          "retro gas station fashion photoshoot, neon accents, confident poses, clean editorial styling",
      },
    ],
  },
  {
    id: "summer-editorial",
    title: "Summer Editorial",
    seeAllSlug: "summer-editorial",
    items: [
      {
        id: "pack-beach-cover-girl",
        title: "Beach Cover Girl",
        subtitle: "Magazine-style shore shoot",
        description:
          "A sunlit beach cover story with airy wardrobe, soft waves, and natural editorial poses.",
        category: "Summer",
        promptFocus:
          "beach magazine cover photoshoot, airy summer wardrobe, soft waves, natural editorial poses",
      },
      {
        id: "pack-cafe-date-shoot",
        title: "Cafe Date Shoot",
        subtitle: "Warm street cafe set",
        description:
          "A charming cafe photo story with warm light, candid table moments, and city style.",
        category: "Summer",
        promptFocus:
          "warm street cafe photoshoot, candid table moments, summer city styling, natural lifestyle poses",
      },
      {
        id: "pack-golden-picnic",
        title: "Golden Picnic",
        subtitle: "Soft field lifestyle",
        description:
          "A golden field lifestyle set with relaxed movement, picnic details, and soft color grading.",
        category: "Summer",
        promptFocus:
          "golden field picnic photoshoot, relaxed lifestyle movement, soft color grading, sunny natural poses",
      },
    ],
  },
  {
    id: "city-lifestyle",
    title: "City Lifestyle",
    seeAllSlug: "city-lifestyle",
    items: [
      {
        id: "pack-rooftop-editorial",
        title: "Rooftop Editorial",
        subtitle: "Skyline fashion story",
        description:
          "A city rooftop shoot with skyline depth, clean fashion poses, and premium evening light.",
        category: "City",
        promptFocus:
          "city rooftop fashion editorial, skyline background, premium evening light, clean confident poses",
      },
      {
        id: "pack-old-money-streets",
        title: "Old Money Streets",
        subtitle: "Quiet luxury city walk",
        description:
          "A refined street-style set with classic wardrobe, calm confidence, and editorial framing.",
        category: "City",
        promptFocus:
          "old money street style photoshoot, classic wardrobe, quiet luxury mood, calm confident poses",
      },
      {
        id: "pack-subway-star",
        title: "Subway Star",
        subtitle: "Urban campaign frames",
        description:
          "A cinematic urban transit shoot with motion blur, layered city light, and sharp styling.",
        category: "City",
        promptFocus:
          "urban subway fashion photoshoot, cinematic transit light, subtle motion blur, sharp styling",
      },
    ],
  },
  {
    id: "studio-portraits",
    title: "Studio Portraits",
    seeAllSlug: "studio-portraits",
    items: [
      {
        id: "pack-glossy-studio-set",
        title: "Glossy Studio Set",
        subtitle: "Beauty campaign portraits",
        description:
          "A premium studio portrait pack with glossy beauty lighting, clean backgrounds, and strong framing.",
        category: "Studio",
        promptFocus:
          "glossy beauty studio photoshoot, clean background, premium softbox lighting, strong portrait framing",
      },
      {
        id: "pack-monochrome-icons",
        title: "Monochrome Icons",
        subtitle: "Black-and-white portrait set",
        description:
          "A timeless monochrome portrait session with sculpted light and elegant expressions.",
        category: "Studio",
        promptFocus:
          "black and white studio portrait photoshoot, sculpted light, elegant expressions, timeless fashion framing",
      },
      {
        id: "pack-color-gel-beauty",
        title: "Color Gel Beauty",
        subtitle: "Bold lighting series",
        description:
          "A modern beauty campaign with colorful gel lighting, polished skin, and crisp close-ups.",
        category: "Studio",
        promptFocus:
          "color gel beauty photoshoot, polished skin, crisp close ups, modern campaign lighting",
      },
    ],
  },
  {
    id: "fantasy-fashion",
    title: "Fantasy Fashion",
    seeAllSlug: "fantasy-fashion",
    items: [
      {
        id: "pack-crystal-garden",
        title: "Crystal Garden",
        subtitle: "Iridescent couture fantasy",
        description:
          "An iridescent crystal-garden editorial with glass blossoms, lavender couture, and luminous dreamlight across poised fashion portraits.",
        category: "Fantasy",
        promptFocus:
          "crystal garden couture photoshoot, iridescent glass flowers, lavender fantasy gown, luminous dreamy light, elegant editorial poses",
      },
      {
        id: "pack-celestial-muse",
        title: "Celestial Muse",
        subtitle: "Moonlit observatory editorial",
        description:
          "A moonlit celestial fashion set inside a grand observatory with star-embroidered couture, silver instruments, and regal midnight portraits.",
        category: "Fantasy",
        promptFocus:
          "celestial muse moonlit observatory photoshoot, star embroidered couture gown, midnight blue palette, regal fantasy fashion portraits",
      },
      {
        id: "pack-rose-palace",
        title: "Rose Palace",
        subtitle: "Blush palace romance",
        description:
          "A blush-pink royal editorial in a rose-filled palace with floral couture, gilded interiors, and soft romantic portrait staging.",
        category: "Fantasy",
        promptFocus:
          "rose palace blush royal photoshoot, rose filled palace, pink floral ballgown, romantic editorial light, elegant princess poses",
      },
    ],
  },
];

const photoPackStylePromptById: Record<string, string> = {
  "pack-pink-porsche-effect":
    "Luxury car-girl editorial series with pink-toned gloss, confident styling, expensive summer light, polished body glow, and aspirational campaign energy.",
  "pack-private-villa-day":
    "Resort-luxury editorial series with villa architecture, poolside polish, warm leisure styling, high-end vacation realism, and elegant summer calm.",
  "pack-champagne-balcony":
    "Golden-hour terrace editorial series with champagne tones, refined evening wardrobe, city-luxury mood, glossy warm highlights, and elevated social glamour.",
  "pack-convertible-summer":
    "Open-top summer car series with bright sunlight, playful cool-girl styling, glossy road-trip energy, sunglasses attitude, and premium lifestyle polish.",
  "pack-night-drive-flash":
    "Nocturnal car editorial series with direct flash, glossy reflections, wet-city energy, cinematic nightlife contrast, and sharp after-dark fashion mood.",
  "pack-gas-station-glam":
    "Retro roadside fashion series with neon accents, bold styling, glossy Americana attitude, editorial confidence, and stylized late-night nostalgia.",
  "pack-beach-cover-girl":
    "Sunlit beach editorial series with airy wardrobe, glossy skin warmth, soft coastal palette, vacation-luxury polish, and magazine-cover summer energy.",
  "pack-cafe-date-shoot":
    "Warm cafe editorial series with candid romance, city-girl styling, golden natural light, polished lifestyle realism, and intimate premium charm.",
  "pack-golden-picnic":
    "Golden field lifestyle series with soft sunlight, relaxed movement, picnic elegance, honey-toned grading, and dreamy outdoor editorial warmth.",
  "pack-rooftop-editorial":
    "Skyline fashion series with premium evening light, clean styling, chic urban polish, elevated campaign mood, and modern city editorial confidence.",
  "pack-old-money-streets":
    "Quiet-luxury street series with classic wardrobe, subdued expensive palette, polished realism, calm confidence, and old-money editorial restraint.",
  "pack-subway-star":
    "Urban transit fashion series with cinematic station light, sharp wardrobe, metropolitan cool, subtle motion energy, and campaign-grade edge.",
  "pack-glossy-studio-set":
    "Beauty-campaign studio series with glossy skin, softbox precision, expensive clean backgrounds, polished retouching, and high-end commercial shine.",
  "pack-monochrome-icons":
    "Monochrome portrait series with sculpted light, timeless elegance, rich black-and-white contrast, fashion restraint, and classic studio sophistication.",
  "pack-color-gel-beauty":
    "Modern beauty series with bold gel lighting, saturated accent color, polished skin finish, futuristic campaign energy, and crisp commercial glamour.",
  "pack-crystal-garden":
    "Iridescent fantasy couture series with crystalline blossoms, prismatic reflections, lavender-blue gown work, luminous mist, and polished magical realism.",
  "pack-celestial-muse":
    "Moonlit observatory fashion series with midnight-blue grandeur, star-embroidered couture, silver astrolabes, cool lunar glow, and regal cosmic elegance.",
  "pack-rose-palace":
    "Blush palace editorial series with rose-swept marble halls, pink floral couture, gilded romantic light, princess-scale volume, and refined fairytale luxury.",
};

const photoPackCompositionPromptById: Record<string, string> = {
  "pack-pink-porsche-effect":
    "Create an 8-image campaign series with the same luxury-car location logic, varied mid and full-body framing, confident pose changes, and strong vehicle integration in each image.",
  "pack-private-villa-day":
    "Create an 8-image resort series with consistent villa architecture, varied poolside and terrace framing, relaxed body language, and premium environmental readability throughout.",
  "pack-champagne-balcony":
    "Create an 8-image evening terrace series with balcony depth, elegant standing and seated pose variation, upper-body to full-body framing shifts, and strong skyline context.",
  "pack-convertible-summer":
    "Create an 8-image open-car series with consistent convertible context, playful pose changes, varied close, mid, and seated framing, and readable summer-roadtrip storytelling.",
  "pack-night-drive-flash":
    "Create an 8-image night-car series with direct-flash framing, reflective urban depth, strong face priority, and varied in-car and beside-car compositions.",
  "pack-gas-station-glam":
    "Create an 8-image roadside fashion series with gas-station context, varied full-body and mid-shot framing, confident poses, and clear neon environment storytelling.",
  "pack-beach-cover-girl":
    "Create an 8-image beach editorial series with shoreline depth, varied mid and full-body cover-shot framing, airy posing, and strong readable summer environment context.",
  "pack-cafe-date-shoot":
    "Create an 8-image cafe story with table-side candid compositions, close and mid portrait variation, natural seated posture, and clear warm city-cafe context in every frame.",
  "pack-golden-picnic":
    "Create an 8-image field lifestyle series with picnic details, relaxed movement, varied crop distance, and cohesive outdoor golden-hour storytelling across the set.",
  "pack-rooftop-editorial":
    "Create an 8-image rooftop fashion series with skyline depth, confident pose transitions, varied upper-body and full-body crops, and clean editorial geometry throughout.",
  "pack-old-money-streets":
    "Create an 8-image quiet-luxury street series with classic city-walk framing, poised body language, full-body and mid-shot variation, and strong wardrobe readability.",
  "pack-subway-star":
    "Create an 8-image subway fashion series with layered transit depth, controlled motion cues, varied portrait and full-body crops, and cinematic urban composition rhythm.",
  "pack-glossy-studio-set":
    "Create an 8-image studio beauty series with clean background continuity, close-up to upper-body crop variation, stable light direction, and crisp face readability throughout.",
  "pack-monochrome-icons":
    "Create an 8-image black-and-white studio series with sculpted facial light, elegant pose changes, crop variation from close portrait to upper body, and timeless composition discipline.",
  "pack-color-gel-beauty":
    "Create an 8-image beauty-lighting series with close and chest-up framing, stable facial readability, controlled gel-light placement, and strong commercial composition consistency.",
  "pack-crystal-garden":
    "Create an 8-image crystal-garden series with layered glass flora, alternating seated and standing poses, mid-to-full-body crops, and luminous foreground sparkle framing.",
  "pack-celestial-muse":
    "Create an 8-image moonlit observatory series with strong arch and moon placement, varied full-body and upper-body framing, regal pose transitions, and clear celestial set storytelling.",
  "pack-rose-palace":
    "Create an 8-image rose-palace series with corridor depth, floral framing, seated and standing royal poses, varied crop distance, and consistently soft romantic balance.",
};

function getPhotoPackStyleReferenceUrl(item: PhotoPackDraft) {
  switch (item.id) {
    case "pack-pink-porsche-effect":
      return referenceGallery.pinkPorscheStyle;
    case "pack-private-villa-day":
      return referenceGallery.villaStyle;
    case "pack-champagne-balcony":
      return referenceGallery.champagneStyle;
    case "pack-convertible-summer":
      return referenceGallery.convertibleStyle;
    case "pack-night-drive-flash":
      return referenceGallery.nightDriveStyle;
    case "pack-gas-station-glam":
      return referenceGallery.gasStationStyle;
    case "pack-beach-cover-girl":
      return referenceGallery.beachStyle;
    case "pack-cafe-date-shoot":
      return referenceGallery.cafeStyle;
    case "pack-golden-picnic":
      return referenceGallery.picnicStyle;
    case "pack-rooftop-editorial":
      return referenceGallery.rooftopStyle;
    case "pack-old-money-streets":
      return referenceGallery.oldMoneyStyle;
    case "pack-subway-star":
      return referenceGallery.subwayStyle;
    case "pack-glossy-studio-set":
      return referenceGallery.glossyStudioStyle;
    case "pack-monochrome-icons":
      return referenceGallery.monochromeStyle;
    case "pack-color-gel-beauty":
      return referenceGallery.colorGelStyle;
    case "pack-crystal-garden":
      return referenceGallery.crystalStyle;
    case "pack-celestial-muse":
      return referenceGallery.celestialStyle;
    case "pack-rose-palace":
      return referenceGallery.rosePalaceStyle;
    default:
      return referenceGallery.contentLabStyle;
  }
}

function getPhotoPackCompositionReferenceUrl(item: PhotoPackDraft) {
  switch (item.category) {
    case "Luxury":
      return referenceGallery.packLuxuryComp;
    case "Cars":
      return referenceGallery.packCarsComp;
    case "Summer":
      return referenceGallery.packSummerComp;
    case "City":
      return referenceGallery.packCityComp;
    case "Studio":
      return referenceGallery.packStudioComp;
    case "Fantasy":
      return referenceGallery.packFantasyComp;
    default:
      return referenceGallery.contentLabComp;
  }
}

function buildPhotoPackTemplate(
  item: PhotoPackDraft,
  itemIndex: number,
  coverIndex: number
): Template {
  const localAssets = localPhotoPackAssets[item.id];
  const remoteCoverUrl = gallery.photoPackCovers[coverIndex % gallery.photoPackCovers.length];
  const coverUrl = localAssets?.[0] ?? remoteCoverUrl;
  const examples =
    localAssets ??
    Array.from({ length: 8 }, (_, index) =>
      gallery.photoPackCovers[(coverIndex + index) % gallery.photoPackCovers.length]
    );

  return {
    id: item.id,
    kind: "photoPack",
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    category: item.category,
    stylePrompt:
      item.stylePrompt ?? photoPackStylePromptById[item.id] ?? buildPhotoPackStylePrompt(item),
    compositionPrompt:
      item.compositionPrompt ??
      photoPackCompositionPromptById[item.id] ??
      buildPhotoPackCompositionPrompt(item),
    styleReferenceUrl:
      item.styleReferenceUrl ?? getPhotoPackStyleReferenceUrl(item),
    compositionReferenceUrl:
      item.compositionReferenceUrl ?? getPhotoPackCompositionReferenceUrl(item),
    coverUrl,
    examples,
    modeType: "image",
    referenceMode: "human-portrait",
    isPro: false,
    defaultPrompt: `${item.promptFocus}, cohesive 8-photo fashion photoshoot series, same location, same wardrobe palette, same lighting setup, same camera style, consistent color grade, varied poses and framing, same subject identity, premium editorial lighting.`,
    generationCost: 32,
    inputRequirements: ["1 portrait photo", "Visible face", "Good lighting"],
    previewCount: 8,
    photoPackSize: 8,
  };
}

function buildPhotoPackStylePrompt(item: PhotoPackDraft) {
  const categoryDirection =
    item.category === "Luxury"
      ? "Keep the full series expensive, glossy, aspirational, and luxury-editorial with premium sunlight or evening glow."
      : item.category === "Cars"
      ? "Keep the full series fashion-editorial, car-integrated, glossy, and attitude-led with strong reflections and street polish."
      : item.category === "Summer"
      ? "Keep the full series airy, warm, sunlit, soft, and naturally editorial with vacation energy."
      : item.category === "City"
      ? "Keep the full series sharp, urban, premium, clean, and fashion-forward with editorial city depth."
      : item.category === "Studio"
      ? "Keep the full series controlled, premium, clean, camera-ready, and campaign polished with deliberate light shaping."
      : "Keep the full series dreamy, elevated, couture-leaning, and visually immersive with strong fantasy styling.";

  return `${item.promptFocus}. ${categoryDirection}`;
}

function buildPhotoPackCompositionPrompt(item: PhotoPackDraft) {
  if (item.category === "Studio") {
    return "Create an 8-image portrait series with consistent studio setup, varied crop distance from close-up to upper-body, stable light direction, clean backgrounds, and strong facial readability in every frame.";
  }

  if (item.category === "Cars" || item.category === "Luxury" || item.category === "City") {
    return "Create an 8-image editorial series with the same location logic, varied full-body and mid-shot framing, confident pose changes, consistent wardrobe palette, and premium campaign composition across every image.";
  }

  if (item.category === "Summer") {
    return "Create an 8-image lifestyle series with consistent summer location cues, soft environmental depth, natural pose variety, and a balanced mix of wide, medium, and close portrait crops.";
  }

  return "Create an 8-image couture portrait series with consistent worldbuilding, stable lighting logic, elegant pose variety, and a mix of close, medium, and wide editorial compositions that still feel like one coherent set.";
}

function buildPhotoPackTemplates() {
  let coverIndex = 0;
  return photoPackSections.flatMap((section) =>
    section.items.map((item, itemIndex) =>
      buildPhotoPackTemplate(item, itemIndex, coverIndex++)
    )
  );
}

const expandedPhotoPackTemplates = buildPhotoPackTemplates();

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "styles",
    title: "Try yourself in different looks and styles",
    heroAsset: gallery.onboardingHeroStyles,
    insetAsset: gallery.onboardingInsetA,
    theme: "portrait",
    animationType: "float",
    ctaLabel: "Continue",
  },
  {
    id: "outfit",
    title: "Change location, outfit and look in one tap",
    heroAsset: gallery.onboardingHeroOutfit,
    insetAsset: gallery.onboardingInsetB,
    theme: "fashion",
    animationType: "parallax",
    ctaLabel: "Continue",
  },
  {
    id: "prompt",
    title: "Write your ideas and enjoy the result",
    subtitle: "Portrait in cinematic lavender lighting with editorial styling.",
    heroAsset: gallery.onboardingHeroPrompt,
    theme: "editorial",
    animationType: "breathing",
    ctaLabel: "Continue",
  },
  {
    id: "video",
    title: "Turn your photos into realistic videos",
    heroAsset: gallery.onboardingHeroVideo,
    insetAsset: gallery.onboardingInsetC,
    theme: "motion",
    animationType: "motion-hint",
    ctaLabel: "Start creating",
  },
];

export const templates: Template[] = [
  {
    id: "content-lab",
    title: "Content Lab",
    subtitle: "Create unique content",
    description: "Create unique content from a prompt or a reference photo.",
    category: "Portrait",
    stylePrompt:
      "High-fashion portrait art direction with soft pink-violet lighting, polished skin texture, premium editorial color grading, and modern luxury beauty styling.",
    compositionPrompt:
      "Frame the subject as a premium editorial portrait with clean face readability, strong foreground-background separation, and a balanced crop that can shift between close beauty framing and upper-body portrait styling.",
    styleReferenceUrl: referenceGallery.contentLabStyle,
    compositionReferenceUrl: referenceGallery.contentLabComp,
    coverUrl: gallery.contentLabA,
    examples: [gallery.contentLabA, gallery.contentLabB, gallery.contentLabC],
    modeType: "image",
    referenceMode: "none",
    isPro: false,
    defaultPrompt: "High-fashion portrait with soft pink-violet lighting.",
    generationCost: 4,
    inputRequirements: ["Prompt", "Optional reference photo", "Good lighting"],
    previewCount: 12,
  },
  {
    id: "content-lab-video",
    title: "Content Lab",
    subtitle: "Create unique content",
    description: "Create a short cinematic video from a prompt with an optional reference photo.",
    category: "Video",
    stylePrompt:
      "Cinematic social video direction with premium color grading, controlled camera movement, and polished editorial mood.",
    compositionPrompt:
      "Keep subject readability strong with stable framing, smooth movement, and premium short-form pacing suitable for vertical social platforms.",
    styleReferenceUrl: referenceGallery.contentLabStyle,
    compositionReferenceUrl: referenceGallery.contentLabComp,
    coverUrl: gallery.videoPoster,
    examples: [gallery.videoPoster, gallery.videoPosterB, gallery.videoPosterC],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    referenceMode: "human-portrait",
    isPro: false,
    defaultPrompt:
      "High-fashion cinematic portrait video with soft pink-violet lighting and smooth camera motion.",
    generationCost: 25,
    inputRequirements: ["Prompt", "Optional reference photo", "Good lighting"],
    motionPreset: "content-lab-video",
  },
  {
    id: "glamour-speed",
    title: "Glamour at Speed",
    subtitle: "Glossy beauty portraits with strong makeup direction",
    description:
      "Create a beauty-campaign look with glossy skin, soft glow, and premium styling.",
    category: "Glamour",
    stylePrompt:
      "Luxury beauty campaign art direction with glossy skin, soft luminous highlights, premium makeup styling, high-end commercial polish, and refined magazine color.",
    compositionPrompt:
      "Use a tight close-up or beauty portrait crop with the face as the focal point, sculpted cheekbone light, elegant head angle, and clear makeup detail across the eyes, lips, and skin finish.",
    styleReferenceUrl: referenceGallery.softGlamStyle,
    compositionReferenceUrl: referenceGallery.closeBeautyComp,
    coverUrl: gallery.glamB,
    examples: [gallery.glamB, gallery.glamC, gallery.portraitA, gallery.fashionB],
    modeType: "image",
    referenceMode: "human-closeup",
    isPro: false,
    defaultPrompt: "Luxury beauty campaign portrait with glossy skin.",
    generationCost: 4,
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
    stylePrompt:
      "Founder-grade professional headshot styling with natural skin tones, polished studio light, subtle contrast, premium realism, and executive-level visual trust.",
    compositionPrompt:
      "Frame the subject as a clean professional headshot with shoulders visible, centered or slightly offset eye line, uncluttered background, crisp face detail, and flattering studio separation.",
    styleReferenceUrl: referenceGallery.headshotStyle,
    compositionReferenceUrl: referenceGallery.professionalComp,
    coverUrl: gallery.portraitD,
    examples: [gallery.portraitD, gallery.portraitF, gallery.portraitB, gallery.fashionC],
    modeType: "image",
    referenceMode: "human-closeup",
    isPro: false,
    defaultPrompt: "Professional headshot with modern studio lighting.",
    generationCost: 4,
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
    stylePrompt:
      "Vintage fashion editorial direction with cinematic grain, muted plum and archive tones, soft contrast, refined retro wardrobe mood, and authentic film-inspired texture.",
    compositionPrompt:
      "Frame the subject like a fashion archive portrait with elegant mid-shot or close portrait crops, poised body language, soft environment depth, and old-editorial composition rhythm.",
    styleReferenceUrl: referenceGallery.vintageStyle,
    compositionReferenceUrl: referenceGallery.fashionStreetComp,
    coverUrl: gallery.fashionB,
    examples: [gallery.fashionB, gallery.fashionD, gallery.portraitE, gallery.fashionA],
    modeType: "image",
    referenceMode: "human-portrait",
    isPro: false,
    defaultPrompt: "Vintage fashion editorial with soft grain and plum tones.",
    generationCost: 4,
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
    stylePrompt:
      "Anime-inspired portrait direction with vivid but elegant stylization, clean line logic, polished shading, luminous accent color, and premium character-design finish.",
    compositionPrompt:
      "Frame the subject as a hero anime portrait with dominant facial readability, clean silhouette, strong focal separation, and a polished close-to-mid portrait crop.",
    styleReferenceUrl: referenceGallery.animeStyle,
    compositionReferenceUrl: referenceGallery.avatarComp,
    coverUrl: gallery.portraitC,
    examples: [gallery.portraitC, gallery.portraitA, gallery.glamA, gallery.glamB],
    modeType: "image",
    referenceMode: "human-portrait",
    isPro: false,
    defaultPrompt: "Anime-inspired portrait with vivid but elegant styling.",
    generationCost: 4,
    inputRequirements: ["1 portrait photo", "Single person", "Well-lit face"],
    previewCount: 16,
  },
  ...expandedSingleImageTemplates,
  ...expandedPhotoPackTemplates,
  ...expandedVideoTemplates,
  {
    id: "dance-loop",
    title: "Dancing Glow",
    subtitle: "Animate a portrait into a subtle dance loop",
    description:
      "Create a short social-ready dance clip from one front-facing portrait.",
    category: "Dancing",
    coverUrl: localVideoPreviewAssets["dance-loop"] ?? gallery.videoPoster,
    examples: [localVideoPreviewAssets["dance-loop"] ?? gallery.videoPoster],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    referenceMode: "human-portrait",
    isPro: false,
    defaultPrompt: "Gentle body movement and confident dance energy.",
    generationCost: 25,
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
    coverUrl: localVideoPreviewAssets["celebrity-wave"] ?? gallery.videoPosterB,
    examples: [localVideoPreviewAssets["celebrity-wave"] ?? gallery.videoPosterB],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    referenceMode: "human-portrait",
    isPro: true,
    defaultPrompt: "Subtle smile, camera flash moments, celebrity energy.",
    generationCost: 25,
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
    coverUrl: localVideoPreviewAssets["fantasy-breeze"] ?? gallery.videoPosterC,
    examples: [localVideoPreviewAssets["fantasy-breeze"] ?? gallery.videoPosterC],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    referenceMode: "human-portrait",
    isPro: true,
    defaultPrompt: "Ethereal motion, soft light, cinematic fantasy mood.",
    generationCost: 25,
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
    coverUrl: localVideoPreviewAssets["runway-turn"] ?? gallery.fashionD,
    examples: [localVideoPreviewAssets["runway-turn"] ?? gallery.fashionD],
    previewVideoUrl: sampleVideo,
    modeType: "video",
    referenceMode: "human-portrait",
    isPro: false,
    defaultPrompt: "Luxury catwalk turn with confident movement.",
    generationCost: 25,
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
  subtitle: "Create unique content",
  imageUrl: gallery.contentLabB,
  ctaLabel: "Try",
  presetId: "content-lab",
  isPro: false,
};

export const imageSections: PresetSection[] = [
  ...imagePresetSections.map((section) => ({
    id: section.id,
    title: section.title,
    layoutType: "horizontal" as const,
    items: section.items.map((item) => template(item.id)),
    seeAllSlug: section.seeAllSlug,
  })),
  ...photoPackSections.map((section) => ({
    id: section.id,
    title: section.title,
    layoutType: "horizontal" as const,
    items: section.items.map((item) => template(item.id)),
    seeAllSlug: section.seeAllSlug,
  })),
];

export const videoSections: VideoSection[] = [
  ...videoLibrarySections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.items.map((item) => template(item.id)),
    seeAllSlug: section.seeAllSlug,
  })),
  {
    id: "classic-motion",
    title: "Classic Motion",
    items: [
      template("dance-loop"),
      template("runway-turn"),
      template("celebrity-wave"),
      template("fantasy-breeze"),
    ],
    seeAllSlug: "classic-motion",
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "monthly",
    title: "Monthly",
    subtitle: "Flexible access",
    allowance: "300 credits every month",
    priceText: "$14.99",
    period: "per month",
    isDefault: false,
    packageType: "MONTHLY",
  },
  {
    id: "yearly",
    title: "Yearly",
    subtitle: "Best for creators",
    allowance: "300 credits every month",
    priceText: "$79.99",
    period: "per year",
    badgeText: "Save 56%",
    isDefault: true,
    packageType: "ANNUAL",
  },
];

export const bootstrapPayload: BootstrapPayload = {
  brandName: "StudioBloom",
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
    title: "Limited-time monthly credits deal",
    subtitle: "300 credits every month",
    oldPrice: "$14.99",
    newPrice: "$8.99",
    durationMs: EXIT_OFFER_DURATION_MS,
    tokenGrant: 300,
    grantsPro: false,
    packageType: "MONTHLY",
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
