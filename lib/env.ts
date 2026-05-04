const apiModeValue = process.env.EXPO_PUBLIC_API_MODE;
const apiBaseUrlValue = process.env.EXPO_PUBLIC_API_BASE_URL;
const apiTimeoutValue = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
const appProxyTokenValue = process.env.EXPO_PUBLIC_APP_PROXY_TOKEN;
const purchaseModeValue = process.env.EXPO_PUBLIC_PURCHASE_MODE;
const revenueCatAppleApiKeyValue =
  process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;
const revenueCatGoogleApiKeyValue =
  process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
const revenueCatEntitlementIdValue =
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID;
const revenueCatOfferingIdValue =
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID;

export const appConfig = {
  apiMode: apiModeValue === "live" ? "live" : "mock",
  apiBaseUrl: apiBaseUrlValue?.trim() ?? "",
  apiTimeoutMs: Number(apiTimeoutValue ?? "15000") || 15000,
  appProxyToken: appProxyTokenValue?.trim() ?? "",
  purchaseMode: purchaseModeValue === "revenuecat" ? "revenuecat" : "mock",
  revenueCatAppleApiKey: revenueCatAppleApiKeyValue?.trim() ?? "",
  revenueCatGoogleApiKey: revenueCatGoogleApiKeyValue?.trim() ?? "",
  revenueCatEntitlementId: revenueCatEntitlementIdValue?.trim() || "pro",
  revenueCatOfferingId: revenueCatOfferingIdValue?.trim() || "default",
} as const;

export function isLiveApiConfigured() {
  return appConfig.apiMode === "live" && appConfig.apiBaseUrl.length > 0;
}

export function isRevenueCatMode() {
  return appConfig.purchaseMode === "revenuecat";
}
