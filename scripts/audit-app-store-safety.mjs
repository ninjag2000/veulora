import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const metadataPath = path.join(root, "store-assets/app-store/aso-metadata.md");
const compositorPath = path.join(root, "scripts/draw_app_store_screenshots.py");
const outputDir = path.join(
  root,
  "store-assets/app-store/ios-6.7-iphone17-bg",
);

const metadata = await readFile(metadataPath, "utf8");
const compositor = await readFile(compositorPath, "utf8");
const compositorCopy = compositor.replace(
  /(["'])[^"'\n]*(?:\/|\.png|\.jpg)[^"'\n]*\1/g,
  "",
);
const reviewedText = `${metadata}\n${compositorCopy}`;
const riskyTerms = [
  "glamour",
  "dating",
  "kiss",
  "sexy",
  "unrestricted",
  "horror",
  "weapon",
  "cigarette",
  "mafia",
];

for (const term of riskyTerms) {
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${term}([^\\p{L}\\p{N}]|$)`, "iu");
  assert.doesNotMatch(reviewedText, pattern, `Storefront contains risky term: ${term}`);
}

const captions = [
  "AI PORTRAITS & VIDEOS",
  "PROFESSIONAL HEADSHOTS",
  "EDITORIAL PHOTO PACKS",
  "PET PORTRAITS",
  "PRODUCT VISUALS",
  "CINEMATIC MOTION",
  "CREATIVE CONTROLS",
];

for (const caption of captions) {
  assert.match(compositor, new RegExp(caption.replaceAll("&", "\\&")));
  assert.match(metadata, new RegExp(caption.replaceAll("&", "\\&")));
}

const screenshotFiles = [
  "01-start-screen.png",
  "02-glamour-style-with-ai.png",
  "03-trendy-effects.png",
  "04-cute-pet-photos.png",
  "05-viral-ai-dance-video.png",
  "06-place-logo-product.png",
  "07-realistic-photo-shoots.png",
];

for (const filename of screenshotFiles) {
  const png = await readFile(path.join(outputDir, filename));
  assert.equal(png.toString("ascii", 1, 4), "PNG", `${filename} is not PNG`);
  assert.equal(png.readUInt32BE(16), 1290, `${filename} width`);
  assert.equal(png.readUInt32BE(20), 2796, `${filename} height`);
}

console.log("App Store safety audit passed.");
