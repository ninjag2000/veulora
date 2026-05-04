import { Image } from "expo-image";

import { delay } from "@/lib/helpers";
import type { TemplateImageSource, TemplateMode } from "@/lib/types";

const PROBE_DELAY_MS = 900;
const PROBE_TIMEOUT_MS = 6500;

function isRemoteHttpSource(source: TemplateImageSource | null | undefined): source is string {
  return typeof source === "string" && /^https?:\/\//i.test(source);
}

export function isMediaSourceImmediatelyAvailable(
  source: TemplateImageSource | null | undefined
) {
  if (typeof source === "number") {
    return true;
  }

  if (typeof source !== "string") {
    return false;
  }

  return !/^https?:\/\//i.test(source);
}

function createAbortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          onTimeout?.();
          reject(new Error("Probe timed out."));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

async function waitForNextAttempt(signal: AbortSignal) {
  if (signal.aborted) {
    throw createAbortError();
  }

  await Promise.race([
    delay(PROBE_DELAY_MS),
    new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => reject(createAbortError()), {
        once: true,
      });
    }),
  ]);
}

async function probeImageSource(source: TemplateImageSource) {
  if (isMediaSourceImmediatelyAvailable(source)) {
    return true;
  }

  if (!isRemoteHttpSource(source)) {
    return false;
  }

  await withTimeout(Image.loadAsync(source), PROBE_TIMEOUT_MS);
  return true;
}

async function probeVideoSource(source: TemplateImageSource, signal: AbortSignal) {
  if (isMediaSourceImmediatelyAvailable(source)) {
    return true;
  }

  if (!isRemoteHttpSource(source)) {
    return false;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });

  try {
    const headResponse = await withTimeout(
      fetch(source, {
        method: "HEAD",
        signal: controller.signal,
      }),
      PROBE_TIMEOUT_MS,
      abort
    ).catch(() => null);

    if (
      headResponse &&
      (headResponse.ok || headResponse.status === 206 || headResponse.status === 405)
    ) {
      if (headResponse.status !== 405) {
        return true;
      }
    }

    const getResponse = await withTimeout(
      fetch(source, {
        method: "GET",
        headers: {
          Range: "bytes=0-1",
        },
        signal: controller.signal,
      }),
      PROBE_TIMEOUT_MS,
      abort
    );

    return getResponse.ok || getResponse.status === 206;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

export async function waitForMediaAssetReady(params: {
  mode: TemplateMode;
  source: TemplateImageSource;
  signal: AbortSignal;
}) {
  const { mode, source, signal } = params;

  while (!signal.aborted) {
    try {
      const ready =
        mode === "video"
          ? await probeVideoSource(source, signal)
          : await probeImageSource(source);

      if (ready && !signal.aborted) {
        return true;
      }
    } catch (error) {
      if (signal.aborted) {
        break;
      }

      if (error instanceof Error && error.name === "AbortError") {
        break;
      }
    }

    await waitForNextAttempt(signal);
  }

  return false;
}
