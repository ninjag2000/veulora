import test from "node:test";
import assert from "node:assert/strict";

import {
  ContentSafetyUnavailableError,
  createContentModerator,
} from "./content-moderation.js";

test("classifies image probability below the threshold as safe", async () => {
  const moderator = createContentModerator(async (modelId, input) => {
    assert.equal(modelId, "fal-ai/imageutils/nsfw");
    assert.deepEqual(input, { image_url: "https://example.com/image.jpg" });
    return { data: { nsfw_probability: 0.19 } };
  });

  assert.deepEqual(
    await moderator.moderateImageUrl("https://example.com/image.jpg"),
    { status: "safe", probability: 0.19 },
  );
});

test("classifies image probability at the threshold as unsafe", async () => {
  const moderator = createContentModerator(async () => ({
    nsfw_probability: 0.2,
  }));

  assert.deepEqual(
    await moderator.moderateImageUrl("https://example.com/image.jpg"),
    { status: "unsafe", probability: 0.2 },
  );
});

test("fails closed when classifier returns malformed output", async () => {
  const moderator = createContentModerator(async () => ({}));

  await assert.rejects(
    () => moderator.moderateImageUrl("https://example.com/image.jpg"),
    ContentSafetyUnavailableError,
  );
});

test("fails closed when a model call rejects", async () => {
  const moderator = createContentModerator(async () => {
    throw new Error("HTTP 503");
  });

  await assert.rejects(
    () => moderator.moderateImageUrl("https://example.com/image.jpg"),
    (error) =>
      error instanceof ContentSafetyUnavailableError &&
      error.code === "CONTENT_SAFETY_UNAVAILABLE",
  );
});

test("extracts and deduplicates first, middle, and last video frames", async () => {
  const requestedFrames = [];
  const moderator = createContentModerator(async (modelId, input) => {
    assert.equal(modelId, "fal-ai/ffmpeg-api/extract-frame");
    requestedFrames.push(input.frame_type);
    const url = input.frame_type === "last" ? "frame-middle.jpg" : `frame-${input.frame_type}.jpg`;
    return { images: [{ url }] };
  });

  assert.deepEqual(
    await moderator.extractVideoModerationFrames("https://example.com/video.mp4"),
    ["frame-first.jpg", "frame-middle.jpg"],
  );
  assert.deepEqual(requestedFrames.sort(), ["first", "last", "middle"]);
});

test("fails closed when video extraction returns no frames", async () => {
  const moderator = createContentModerator(async () => ({ images: [] }));

  await assert.rejects(
    () => moderator.extractVideoModerationFrames("https://example.com/video.mp4"),
    ContentSafetyUnavailableError,
  );
});

test("marks a video unsafe when any sampled frame is unsafe", async () => {
  const classifiedUrls = [];
  const moderator = createContentModerator(async (modelId, input) => {
    if (modelId === "fal-ai/ffmpeg-api/extract-frame") {
      return { images: [{ url: `https://example.com/${input.frame_type}.jpg` }] };
    }

    classifiedUrls.push(input.image_url);
    return {
      nsfw_probability: input.image_url.includes("middle") ? 0.74 : 0.04,
    };
  });

  assert.deepEqual(
    await moderator.moderateVideoUrl("https://example.com/video.mp4"),
    { status: "unsafe", probability: 0.74 },
  );
  assert.equal(classifiedUrls.length, 3);
});
