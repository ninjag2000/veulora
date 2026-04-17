import { fetch as expoFetch } from "expo/fetch";

import { appConfig, isLiveApiConfigured } from "@/lib/env";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 0, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  accountId: string;
  timeoutMs?: number;
}

function getUrl(path: string) {
  if (!isLiveApiConfigured()) {
    throw new ApiError(
      "Live API mode is enabled but EXPO_PUBLIC_API_BASE_URL is missing.",
      0,
      "LIVE_API_NOT_CONFIGURED"
    );
  }

  const base = appConfig.apiBaseUrl.endsWith("/")
    ? appConfig.apiBaseUrl.slice(0, -1)
    : appConfig.apiBaseUrl;
  const resource = path.startsWith("/") ? path : `/${path}`;

  return `${base}${resource}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  { accountId, timeoutMs, headers, body, ...rest }: RequestOptions
) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs ?? appConfig.apiTimeoutMs
  );

  try {
    const response = await expoFetch(getUrl(path), {
      ...rest,
      body,
      headers: {
        Accept: "application/json",
        "X-Account-Id": accountId,
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(headers ?? {}),
      },
      signal: controller.signal,
    });
    const payload = await parseResponse(response);

    if (!response.ok) {
      const message =
        typeof payload === "object" &&
        payload &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Request failed with status ${response.status}.`;

      const code =
        typeof payload === "object" &&
        payload &&
        "code" in payload &&
        typeof payload.code === "string"
          ? payload.code
          : undefined;

      throw new ApiError(message, response.status, code, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out.", 0, "REQUEST_TIMEOUT");
    }

    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed.",
      0,
      "NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timer);
  }
}

export function jsonBody(body: unknown) {
  return JSON.stringify(body);
}
