import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert@1";

import {
  ContentSafetyUnavailableError,
  createContentModerator,
  createFalRunModel,
} from "./content-moderation.ts";

Deno.test("classifies image probabilities around the safety threshold", async () => {
  const safe = createContentModerator(async () => ({ nsfw_probability: 0.19 }));
  const unsafe = createContentModerator(async () => ({ nsfw_probability: 0.2 }));

  assertEquals(await safe.moderateImageUrl("https://example.com/safe.jpg"), {
    status: "safe",
    probability: 0.19,
  });
  assertEquals(await unsafe.moderateImageUrl("https://example.com/unsafe.jpg"), {
    status: "unsafe",
    probability: 0.2,
  });
});

Deno.test("fails closed for malformed classifier output", async () => {
  const moderator = createContentModerator(async () => ({}));

  await assertRejects(
    () => moderator.moderateImageUrl("https://example.com/image.jpg"),
    ContentSafetyUnavailableError,
  );
});

Deno.test("fails closed when the model call rejects", async () => {
  const moderator = createContentModerator(async () => {
    throw new Error("network unavailable");
  });

  await assertRejects(
    () => moderator.moderateImageUrl("https://example.com/image.jpg"),
    ContentSafetyUnavailableError,
  );
});

Deno.test("extracts and classifies first, middle, and last video frames", async () => {
  const extracted: string[] = [];
  const classified: string[] = [];
  const moderator = createContentModerator(async (modelId, input) => {
    if (modelId === "fal-ai/ffmpeg-api/extract-frame") {
      const frameType = String(input.frame_type);
      extracted.push(frameType);
      return { images: [{ url: `https://example.com/${frameType}.jpg` }] };
    }

    const imageUrl = String(input.image_url);
    classified.push(imageUrl);
    return { nsfw_probability: imageUrl.includes("last") ? 0.8 : 0.03 };
  });

  assertEquals(
    await moderator.moderateVideoUrl("https://example.com/video.mp4"),
    { status: "unsafe", probability: 0.8 },
  );
  assertEquals(extracted.sort(), ["first", "last", "middle"]);
  assertEquals(classified.length, 3);
});

Deno.test("fails closed when frame extraction is empty", async () => {
  const moderator = createContentModerator(async () => ({ images: [] }));

  await assertRejects(
    () => moderator.extractVideoModerationFrames("https://example.com/video.mp4"),
    ContentSafetyUnavailableError,
  );
});

Deno.test("fal runner sends authenticated requests without exposing media in errors", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const runModel = createFalRunModel("secret-key", async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ nsfw_probability: 0.1 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  await runModel("fal-ai/imageutils/nsfw", {
    image_url: "https://private.example/image.jpg",
  });

  assertEquals(calls[0].url, "https://fal.run/fal-ai/imageutils/nsfw");
  assertEquals(new Headers(calls[0].init.headers).get("authorization"), "Key secret-key");
  assertEquals(new Headers(calls[0].init.headers).get("content-type"), "application/json");

  const rejectedRunner = createFalRunModel("secret-key", async () =>
    new Response("failure", { status: 503 })
  );
  const error = await assertRejects(
    () =>
      rejectedRunner("fal-ai/imageutils/nsfw", {
        image_url: "https://private.example/image.jpg",
      }),
    ContentSafetyUnavailableError,
  );
  assertEquals(error.message.includes("private.example"), false);
});
