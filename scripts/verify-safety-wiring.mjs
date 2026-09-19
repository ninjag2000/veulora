import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const edge = await readFile("supabase/functions/generation/index.ts", "utf8");
const express = await readFile("server/index.js", "utf8");

function sliceFunction(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Missing function marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing function end marker: ${endMarker}`);
  return source.slice(start, end);
}

assert.match(edge, /import\s+\{[^}]*assertSafePrompt[^}]*CONTENT_SAFETY_INSTRUCTION[^}]*\}/s);
assert.match(express, /import\s+\{[^}]*assertSafePrompt[^}]*CONTENT_SAFETY_INSTRUCTION[^}]*\}/s);

const edgeCreate = sliceFunction(
  edge,
  "async function createGeneration(req: Request, mode: Mode)",
  "async function prepareAccountEntitlementsForGeneration",
);
assert.match(edgeCreate, /assertGenerationPromptSafety\(body\.prompt\)/);
assert.ok(
  edgeCreate.indexOf("assertGenerationPromptSafety(body.prompt)") <
    edgeCreate.indexOf("consumeGenerationCredits("),
  "Edge must validate text before consuming credits",
);
assert.match(edgeCreate, /appendContentSafetyInstruction\(body\.prompt\)/);
assert.match(edgeCreate, /await moderateUploadedReferenceUrls\(/);
assert.ok(
  edgeCreate.indexOf("await moderateUploadedReferenceUrls(") <
    edgeCreate.indexOf("consumeGenerationCredits("),
  "Edge must moderate uploaded references before consuming credits",
);

const expressImage = sliceFunction(
  express,
  'app.post("/generation/image"',
  'app.post("/generation/video"',
);
assert.match(expressImage, /assertGenerationPromptSafety\(prompt\)/);
assert.ok(
  expressImage.indexOf("assertGenerationPromptSafety(prompt)") < expressImage.indexOf("consumeCredits("),
  "Express image route must validate text before consuming credits",
);
assert.match(expressImage, /appendContentSafetyInstruction\(prompt\)/);
assert.match(expressImage, /await moderateUploadedReferenceUrls\(/);
assert.ok(
  expressImage.indexOf("await moderateUploadedReferenceUrls(") <
    expressImage.indexOf("consumeCredits("),
  "Express image route must moderate references before consuming credits",
);

const expressVideo = sliceFunction(
  express,
  'app.post("/generation/video"',
  'app.get("/generation/:jobId"',
);
assert.match(expressVideo, /assertGenerationPromptSafety\(prompt\)/);
assert.ok(
  expressVideo.indexOf("assertGenerationPromptSafety(prompt)") < expressVideo.indexOf("consumeCredits("),
  "Express video route must validate text before consuming credits",
);
assert.match(expressVideo, /appendContentSafetyInstruction\(prompt\)/);
assert.match(expressVideo, /await moderateUploadedReferenceUrls\(/);
assert.ok(
  expressVideo.indexOf("await moderateUploadedReferenceUrls(") <
    expressVideo.indexOf("consumeCredits("),
  "Express video route must moderate references before consuming credits",
);

const edgeRetry = sliceFunction(
  edge,
  "async function retryGeneration(data: JobRecord, reason: string)",
  "async function readGenerationBody",
);
assert.match(edgeRetry, /assertGenerationPromptSafety\([\s\S]*requestPayload\.originalPrompt \?\? requestPayload\.prompt/);
assert.match(edgeRetry, /appendContentSafetyInstruction/);

const expressRetry = sliceFunction(
  express,
  "async function retryGenerationJob(rootJobId, record, reason)",
  "// ---- Minimal app endpoints",
);
assert.match(expressRetry, /assertGenerationPromptSafety\([\s\S]*originalPrompt \?\? record\.requestContext\.prompt/);
assert.match(expressRetry, /appendContentSafetyInstruction/);

for (const source of [edge, express]) {
  assert.match(
    source,
    /function appendContentSafetyInstruction\([^)]+\)[\s\S]*split\(CONTENT_SAFETY_INSTRUCTION\)/,
    "Safety instruction helper must avoid duplicate instructions on retries",
  );
  assert.match(source, /CONTENT_SAFETY_BLOCKED/);
  assert.match(
    source,
    /async function moderateUploadedReferenceUrls\([\s\S]*Promise\.all\([\s\S]*moderateImageUrl/,
    "Every uploaded reference must be moderated",
  );
  assert.match(source, /CONTENT_SAFETY_UNAVAILABLE/);
}

console.log("Safety wiring verified.");
