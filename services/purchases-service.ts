import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import { appConfig, isRevenueCatMode } from "@/lib/env";
import type { AppEntitlements, ExitOffer, SubscriptionPlan } from "@/lib/types";
import { delay } from "@/lib/helpers";

let configuredAccountId: string | null = null;

function getRevenueCatApiKey() {
  if (Platform.OS === "ios") {
    return appConfig.revenueCatAppleApiKey;
  }

  if (Platform.OS === "android") {
    return appConfig.revenueCatGoogleApiKey;
  }

  return "";
}

function hasRevenueCatConfig() {
  return getRevenueCatApiKey().length > 0;
}

function applyCustomerInfo(
  current: AppEntitlements,
  customerInfo: CustomerInfo,
  selectedPlanId?: string | null
) {
  const isPro =
    typeof customerInfo.entitlements.active[appConfig.revenueCatEntitlementId] !==
    "undefined";

  return {
    ...current,
    isPro,
    subscriptionPlan: isPro
      ? selectedPlanId ?? current.subscriptionPlan ?? "revenuecat"
      : null,
  } satisfies AppEntitlements;
}

export async function configurePurchases(accountId: string) {
  if (!isRevenueCatMode()) {
    return false;
  }

  if (!hasRevenueCatConfig()) {
    return false;
  }

  if (configuredAccountId === accountId) {
    return true;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);
  Purchases.configure({
    apiKey: getRevenueCatApiKey(),
    appUserID: accountId,
  });
  configuredAccountId = accountId;

  return true;
}

export async function syncPurchasesEntitlements(
  accountId: string,
  current: AppEntitlements
) {
  const configured = await configurePurchases(accountId);

  if (!configured) {
    return null;
  }

  const customerInfo = await Purchases.getCustomerInfo();
  return applyCustomerInfo(current, customerInfo);
}

function getPackageByType(offering: PurchasesOffering, packageType?: string) {
  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:
      return offering.annual;
    case PACKAGE_TYPE.MONTHLY:
      return offering.monthly;
    case PACKAGE_TYPE.WEEKLY:
      return offering.weekly;
    case PACKAGE_TYPE.LIFETIME:
      return offering.lifetime;
    case PACKAGE_TYPE.SIX_MONTH:
      return offering.sixMonth;
    case PACKAGE_TYPE.THREE_MONTH:
      return offering.threeMonth;
    case PACKAGE_TYPE.TWO_MONTH:
      return offering.twoMonth;
    default:
      return null;
  }
}

function selectPackage(
  offering: PurchasesOffering,
  plan: SubscriptionPlan
): PurchasesPackage | null {
  if (plan.productId) {
    const match = offering.availablePackages.find(
      (item) => item.product.identifier === plan.productId
    );
    if (match) {
      return match;
    }
  }

  if (plan.packageType) {
    const typedPackage = getPackageByType(offering, plan.packageType);
    if (typedPackage) {
      return typedPackage;
    }
  }

  if (plan.id === "yearly" && offering.annual) {
    return offering.annual;
  }

  if (plan.id === "monthly" && offering.monthly) {
    return offering.monthly;
  }

  return offering.availablePackages[0] ?? null;
}

const creditGrants: Record<string, number> = {
  monthly: 300,
  yearly: 300,
};

function getOffering(
  offerings: Awaited<ReturnType<typeof Purchases.getOfferings>>,
  offeringId?: string
) {
  return (
    (offeringId
      ? offerings.all[offeringId]
      : offerings.all[appConfig.revenueCatOfferingId]) ?? offerings.current
  );
}

function selectExitOfferPackage(
  offering: PurchasesOffering,
  offer: ExitOffer
): PurchasesPackage | null {
  if (offer.productId) {
    const match = offering.availablePackages.find(
      (item) => item.product.identifier === offer.productId
    );
    if (match) {
      return match;
    }
  }

  if (offer.packageType) {
    return getPackageByType(offering, offer.packageType) ?? null;
  }

  return null;
}

function getExitOfferSubscriptionPlanId(offer: ExitOffer) {
  const isRecurringOffer = offer.packageType === PACKAGE_TYPE.MONTHLY;

  if (!isRecurringOffer) {
    return null;
  }

  return offer.planId ?? offer.id;
}

export async function purchaseSubscription(
  plan: SubscriptionPlan,
  accountId: string,
  current: AppEntitlements
) {
  if (isRevenueCatMode() && !hasRevenueCatConfig()) {
    throw new Error(
      "RevenueCat purchase mode is enabled but the platform API key is missing."
    );
  }

  const configured = await configurePurchases(accountId);

  if (!configured) {
    await delay(1100);
    return {
      isPro: true,
      currentCredits: current.currentCredits + (creditGrants[plan.id] ?? 140),
      subscriptionPlan: plan.id,
      dailyFreeRemaining: 999,
    } satisfies AppEntitlements;
  }

  const offerings = await Purchases.getOfferings();
  const offering = getOffering(offerings, plan.offeringId);

  if (!offering) {
    throw new Error("No RevenueCat offering is available for this paywall.");
  }

  const selectedPackage = selectPackage(offering, plan);

  if (!selectedPackage) {
    throw new Error("No purchasable package matched the selected plan.");
  }

  const result = await Purchases.purchasePackage(selectedPackage);
  return applyCustomerInfo(current, result.customerInfo, plan.id);
}

export async function purchaseExitOffer(
  offer: ExitOffer,
  accountId: string,
  current: AppEntitlements
) {
  if (isRevenueCatMode() && !hasRevenueCatConfig()) {
    throw new Error(
      "RevenueCat purchase mode is enabled but the platform API key is missing."
    );
  }

  const configured = await configurePurchases(accountId);

  if (!configured) {
    await delay(1100);
    const exitOfferPlanId = getExitOfferSubscriptionPlanId(offer);
    return {
      ...current,
      currentCredits: current.currentCredits + offer.tokenGrant,
      isPro: offer.grantsPro ? true : current.isPro,
      subscriptionPlan:
        (offer.grantsPro && offer.planId) ||
        exitOfferPlanId ||
        current.subscriptionPlan,
    } satisfies AppEntitlements;
  }

  const offerings = await Purchases.getOfferings();
  const offering = getOffering(offerings, offer.offeringId);

  if (!offering) {
    throw new Error("No RevenueCat offering is available for this exit offer.");
  }

  const selectedPackage = selectExitOfferPackage(offering, offer);

  if (!selectedPackage) {
    throw new Error(
      "Exit offer token pack is not configured in RevenueCat yet."
    );
  }

  await Purchases.purchasePackage(selectedPackage);
  const exitOfferPlanId = getExitOfferSubscriptionPlanId(offer);

  return {
    ...current,
    currentCredits: current.currentCredits + offer.tokenGrant,
    isPro: offer.grantsPro ? true : current.isPro,
    subscriptionPlan:
      (offer.grantsPro && offer.planId) ||
      exitOfferPlanId ||
      current.subscriptionPlan,
  } satisfies AppEntitlements;
}

export async function restoreSubscription(
  accountId: string,
  current: AppEntitlements
) {
  if (isRevenueCatMode() && !hasRevenueCatConfig()) {
    throw new Error(
      "RevenueCat purchase mode is enabled but the platform API key is missing."
    );
  }

  const configured = await configurePurchases(accountId);

  if (!configured) {
    await delay(900);
    if (current.isPro) {
      return current;
    }
    return {
      isPro: true,
      currentCredits: current.currentCredits + 140,
      subscriptionPlan: "monthly",
      dailyFreeRemaining: 999,
    } satisfies AppEntitlements;
  }

  const customerInfo = await Purchases.restorePurchases();
  return applyCustomerInfo(current, customerInfo);
}
