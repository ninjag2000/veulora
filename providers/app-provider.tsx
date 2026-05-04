import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  findPlanById,
  findTemplateByIdWithContentLabFallback,
} from "@/lib/catalog";
import { isLiveApiConfigured } from "@/lib/env";
import { createAccountId, generateId, STORAGE_KEY } from "@/lib/helpers";
import type {
  AppEntitlements,
  AppSettings,
  BootstrapPayload,
  CreateGenerationParams,
  CreateGenerationResult,
  GenerationJob,
  HistoryItem,
  PersistedStore,
  ToastMessage,
} from "@/lib/types";
import { track } from "@/services/analytics-service";
import {
  loadBootstrapCatalog,
  notifyRestorePurchases,
  refreshRemoteEntitlements,
} from "@/services/bootstrap-service";
import {
  buildImageGenerationPrompt,
  buildImageReferencePrompt,
  buildVideoReferencePrompt,
  buildCompletedHistoryItem,
  buildProcessingHistoryItem,
  createGenerationJob,
  deriveGenerationSnapshot,
  validatePromptSafety,
} from "@/services/generation-service";
import {
  createRemoteGenerationJob,
  pollRemoteGenerationJob,
} from "@/services/remote-generation-service";
import {
  purchaseExitOffer,
  purchaseSubscription,
  restoreSubscription,
  syncPurchasesEntitlements,
} from "@/services/purchases-service";
import { ApiError } from "@/services/api-client";

type BootstrapStatus = "loading" | "ready" | "error";

function isProviderValidationFailure(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  return (
    (error.status >= 400 && error.status < 500) ||
    /unprocessable entity/i.test(error.message)
  );
}

function isTemporaryBackendUnavailableError(error: ApiError) {
  return (
    error.code === "BACKEND_SCHEMA_OUTDATED" ||
    error.code === "JOB_STORE_FAILED" ||
    error.code === "JOB_LOOKUP_FAILED" ||
    error.code === "JOB_RETRY_UPDATE_FAILED" ||
    error.status >= 500
  );
}

function getRemoteGenerationErrorInfo(error: unknown) {
  if (!(error instanceof ApiError)) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Failed to start generation with the live backend.",
      temporaryBackendUnavailable: false,
    };
  }

  if (isTemporaryBackendUnavailableError(error)) {
    return {
      message: "Generation backend is updating. Try again in a minute.",
      temporaryBackendUnavailable: true,
    };
  }

  return {
    message: error.message || "Failed to start generation with the live backend.",
    temporaryBackendUnavailable: false,
  };
}

interface AppContextValue {
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;
  catalog: BootstrapPayload | null;
  accountId: string;
  onboardingCompleted: boolean;
  aiProcessingConsentAccepted: boolean;
  aiProcessingConsentVisible: boolean;
  entitlements: AppEntitlements;
  settings: AppSettings;
  history: HistoryItem[];
  historyFeed: HistoryItem[];
  jobs: GenerationJob[];
  toasts: ToastMessage[];
  retryBootstrap: () => void;
  completeOnboarding: () => void;
  acceptAiProcessingConsent: () => void;
  declineAiProcessingConsent: () => void;
  openAiProcessingConsentPrompt: () => void;
  createGeneration: (params: CreateGenerationParams) => Promise<CreateGenerationResult>;
  retryGeneration: (jobId: string) => Promise<CreateGenerationResult>;
  purchasePlan: (planId: string) => Promise<void>;
  purchaseExitOffer: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => void;
  markVideoGuidelinesSeen: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
  isJobReady: (jobId: string) => boolean;
}

type CatalogContextValue = Pick<
  AppContextValue,
  | "bootstrapStatus"
  | "bootstrapError"
  | "catalog"
  | "accountId"
  | "onboardingCompleted"
  | "aiProcessingConsentAccepted"
  | "aiProcessingConsentVisible"
  | "retryBootstrap"
  | "completeOnboarding"
  | "acceptAiProcessingConsent"
  | "declineAiProcessingConsent"
  | "openAiProcessingConsentPrompt"
>;

type EntitlementsContextValue = Pick<
  AppContextValue,
  | "entitlements"
  | "settings"
  | "purchasePlan"
  | "purchaseExitOffer"
  | "restorePurchases"
  | "setNotificationsEnabled"
  | "markVideoGuidelinesSeen"
>;

type GenerationContextValue = Pick<
  AppContextValue,
  | "history"
  | "historyFeed"
  | "jobs"
  | "createGeneration"
  | "retryGeneration"
  | "deleteHistoryItem"
  | "isJobReady"
>;

type ToastContextValue = Pick<
  AppContextValue,
  "toasts" | "pushToast" | "dismissToast"
>;

const CatalogContext = createContext<CatalogContextValue | null>(null);
const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);
const GenerationContext = createContext<GenerationContextValue | null>(null);
const ToastContext = createContext<ToastContextValue | null>(null);

const initialEntitlements: AppEntitlements = {
  isPro: false,
  currentCredits: 4,
  subscriptionPlan: null,
  dailyFreeRemaining: 3,
};

const initialSettings: AppSettings = {
  notificationsEnabled: true,
  videoGuidelinesSeen: false,
};

function compareHistoryByNewest(a: HistoryItem, b: HistoryItem) {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function compareHistoryFeed(a: HistoryItem, b: HistoryItem) {
  const aIsActive = a.status === "processing";
  const bIsActive = b.status === "processing";

  if (aIsActive !== bIsActive) {
    return aIsActive ? -1 : 1;
  }

  return compareHistoryByNewest(a, b);
}

function keepCompletedHistory(items: HistoryItem[]) {
  return items
    .filter((item) => item.status === "completed")
    .sort(compareHistoryByNewest);
}

function upsertCompletedHistoryItem(
  items: HistoryItem[],
  nextItem: HistoryItem
) {
  return [nextItem, ...items.filter((item) => item.jobId !== nextItem.jobId)].sort(
    compareHistoryByNewest
  );
}

async function loadPersistedStore() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as PersistedStore;

  return {
    ...parsed,
    history: keepCompletedHistory(parsed.history ?? []),
  } satisfies PersistedStore;
}

export function AppProvider({ children }: PropsWithChildren) {
  const remotePollingInFlightRef = useRef(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>("loading");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<BootstrapPayload | null>(null);
  const [accountId, setAccountId] = useState("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [aiProcessingConsentAccepted, setAiProcessingConsentAccepted] = useState(true);
  const [aiProcessingConsentVisible, setAiProcessingConsentVisible] = useState(false);
  const [entitlements, setEntitlements] = useState<AppEntitlements>(initialEntitlements);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [completedJobIds, setCompletedJobIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((message: string) => {
    const id = generateId("toast");
    setToasts((current) => [...current, { id, message }]);

    setTimeout(() => {
      dismissToast(id);
    }, 2800);
  }, [dismissToast]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootstrapStatus("loading");
      setBootstrapError(null);

      try {
        const persisted = await loadPersistedStore();
        const resolvedAccountId = persisted?.accountId ?? createAccountId();
        const payload = await loadBootstrapCatalog(
          resolvedAccountId,
          persisted,
          initialEntitlements
        );
        const syncedPurchases = await syncPurchasesEntitlements(
          resolvedAccountId,
          payload.entitlements
        ).catch(() => null);

        if (cancelled) {
          return;
        }

        setCatalog(payload.catalog);
        setAccountId(resolvedAccountId);
        setOnboardingCompleted(persisted?.onboardingCompleted ?? false);
        setAiProcessingConsentAccepted(true);
        setAiProcessingConsentVisible(false);
        setEntitlements(syncedPurchases ?? payload.entitlements);
        setSettings(persisted?.settings ?? initialSettings);
        setHistory(keepCompletedHistory(payload.history));
        setJobs(() => {
          const persistedJobs = persisted?.jobs ?? [];
          const recoveredRemoteJobs = payload.history
            .filter(
              (item) =>
                item.status === "processing" &&
                !persistedJobs.some((job) => job.id === item.jobId)
            )
            .map((item) => ({
              id: item.jobId,
              historyItemId: item.id,
              engine: "remote",
              mode: item.type,
              templateId: item.templateId ?? "",
              presetTitle: item.presetTitle,
              category: "",
              prompt: item.promptSnippet,
              previewAsset: item.previewUrl,
              createdAt: Date.parse(item.createdAt) || Date.now(),
              generationCost: 0,
              isPro: item.isProResult,
              outputs: item.outputUrls,
              status: "processing",
              progressPercent: 0,
              currentStage: "Preparing your request",
              helperText:
                item.type === "video"
                  ? "Video generation may take a little longer."
                  : "Your result will be saved to History automatically.",
            } satisfies GenerationJob));

          return [...persistedJobs, ...recoveredRemoteJobs];
        });
        setBootstrapStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setBootstrapStatus("error");
        setBootstrapError(
          error instanceof Error ? error.message : "Unable to initialize the app."
        );
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrapNonce]);

  const persistStore = useCallback(async (snapshot: PersistedStore) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, []);

  useEffect(() => {
    if (bootstrapStatus !== "ready") {
      return;
    }

    void persistStore({
      onboardingCompleted,
      aiProcessingConsentAccepted,
      accountId,
      entitlements,
      settings,
      history,
      jobs,
    });
  }, [
    accountId,
    aiProcessingConsentAccepted,
    bootstrapStatus,
    entitlements,
    history,
    jobs,
    onboardingCompleted,
    persistStore,
    settings,
  ]);

  const reconcileJobs = useCallback(() => {
    startTransition(() => {
      setHistory((currentHistory) => {
        let nextHistory = keepCompletedHistory(currentHistory);

        jobs.forEach((job) => {
          const snapshot = deriveGenerationSnapshot(job);

          if (snapshot.status === "completed") {
            nextHistory = upsertCompletedHistoryItem(
              nextHistory,
              buildCompletedHistoryItem(job)
            );
          }
        });

        return nextHistory;
      });
    });
  }, [jobs]);

  const pollRemoteJobs = useCallback(async () => {
    if (!accountId || remotePollingInFlightRef.current) {
      return;
    }

    const activeRemoteJobs = jobs.filter(
      (job) =>
        job.engine === "remote" &&
        job.status !== "completed" &&
        job.status !== "failed"
    );

    if (activeRemoteJobs.length === 0) {
      return;
    }

    remotePollingInFlightRef.current = true;

    try {
      const updates = await Promise.all(
        activeRemoteJobs.map(async (job) => {
          try {
            return await pollRemoteGenerationJob(accountId, job);
          } catch (error) {
            if (isProviderValidationFailure(error)) {
              return {
                ...job,
                status: "failed",
                progressPercent: 0,
                currentStage: "Generation failed",
                helperText: "The provider could not process this image.",
                errorMessage:
                  error instanceof Error
                    ? error.message
                    : "The provider could not process this image.",
                lastPolledAt: Date.now(),
              } satisfies GenerationJob;
            }

            return {
              ...job,
              helperText: `${getRemoteGenerationErrorInfo(error).message} Retrying...`,
              lastPolledAt: Date.now(),
            } satisfies GenerationJob;
          }
        })
      );

      startTransition(() => {
        setJobs((currentJobs) =>
          currentJobs.map(
            (job) => updates.find((candidate) => candidate.id === job.id) ?? job
          )
        );
        setHistory((currentHistory) => {
          let nextHistory = keepCompletedHistory(currentHistory);

          updates.forEach((updatedJob) => {
            if (updatedJob.status !== "completed") {
              return;
            }

            setCompletedJobIds((ids) =>
              ids.includes(updatedJob.id) ? ids : [...ids, updatedJob.id]
            );
            nextHistory = upsertCompletedHistoryItem(
              nextHistory,
              buildCompletedHistoryItem(updatedJob)
            );
          });

          return nextHistory;
        });
      });
    } finally {
      remotePollingInFlightRef.current = false;
    }
  }, [accountId, jobs]);

  useEffect(() => {
    if (bootstrapStatus !== "ready") {
      return;
    }

    const timer = setInterval(() => {
      reconcileJobs();
      void pollRemoteJobs();
    }, 1000);

    return () => clearInterval(timer);
  }, [bootstrapStatus, pollRemoteJobs, reconcileJobs]);

  const retryBootstrap = useCallback(() => {
    setBootstrapNonce((value) => value + 1);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    track("onboarding_complete");
  }, []);

  const acceptAiProcessingConsent = useCallback(() => {
    setAiProcessingConsentAccepted(true);
    setAiProcessingConsentVisible(false);
    track("ai_processing_consent_accept");
  }, []);

  const declineAiProcessingConsent = useCallback(() => {
    setAiProcessingConsentAccepted(false);
    setAiProcessingConsentVisible(true);
    track("ai_processing_consent_decline");
  }, []);

  const openAiProcessingConsentPrompt = useCallback(() => {
    setAiProcessingConsentVisible(true);
    track("ai_processing_consent_open");
  }, []);

  const createGeneration = useCallback(async (
    params: CreateGenerationParams
  ): Promise<CreateGenerationResult> => {
    if (!catalog) {
      return { kind: "error", message: "App catalog is not ready yet." };
    }

    const template = findTemplateByIdWithContentLabFallback(
      catalog,
      params.templateId
    );

    if (!template) {
      return { kind: "error", message: "Template not found." };
    }

    const resolvedParams = {
      ...params,
      prompt: (params.prompt || template.defaultPrompt).trim(),
    };
    const modelPrompt =
      template.modeType === "image" && resolvedParams.referenceImageUri
        ? buildImageReferencePrompt(resolvedParams.prompt, template)
        : template.modeType === "image"
        ? buildImageGenerationPrompt(resolvedParams.prompt, template)
        : resolvedParams.referenceImageUri && template.modeType === "video"
        ? buildVideoReferencePrompt(resolvedParams.prompt)
        : resolvedParams.prompt;

    const safetyError = validatePromptSafety(resolvedParams.prompt);

    if (safetyError) {
      track("generate_blocked_validation", { templateId: params.templateId });
      return { kind: "error", message: safetyError };
    }

    if (template.isPro && !entitlements.isPro) {
      track("paywall_source_open", {
        source_context: "premium_feature",
        selected_template: template.id,
      });
      return { kind: "paywall", source: "premium_feature" };
    }

    if (entitlements.currentCredits < template.generationCost) {
      track("paywall_source_open", {
        source_context: "credit_limit",
        selected_template: template.id,
      });
      return { kind: "paywall", source: "credit_limit" };
    }

    track("generation_started", {
      mode: template.modeType,
      preset_id: template.id,
      generation_cost: template.generationCost,
    });

    if (isLiveApiConfigured() && accountId) {
      try {
        const remoteCandidate = await createRemoteGenerationJob(
          {
            ...resolvedParams,
            modelPrompt,
          },
          template,
          accountId
        );

        setJobs((current) => [remoteCandidate.job, ...current]);

        const refreshedEntitlements =
          (await refreshRemoteEntitlements(accountId).catch(() => null)) ?? null;

        if (refreshedEntitlements) {
          setEntitlements((current) => ({
            ...current,
            ...refreshedEntitlements,
            isPro: current.isPro || refreshedEntitlements.isPro,
            subscriptionPlan:
              refreshedEntitlements.subscriptionPlan ?? current.subscriptionPlan,
          }));
        } else {
          setEntitlements((current) => ({
            ...current,
            currentCredits: current.currentCredits - template.generationCost,
          }));
        }

        return {
          kind: "success",
          jobId: remoteCandidate.job.id,
        };
      } catch (error) {
        if (error instanceof ApiError && error.code === "CREDIT_LIMIT_EXCEEDED") {
          track("paywall_source_open", {
            source_context: "credit_limit",
            selected_template: template.id,
          });
          return { kind: "paywall", source: "credit_limit" };
        }

        const errorInfo = getRemoteGenerationErrorInfo(error);

        return {
          kind: "error",
          message: errorInfo.message,
          temporaryBackendUnavailable: errorInfo.temporaryBackendUnavailable,
        };
      }
    }

    const job = createGenerationJob(
      {
        ...resolvedParams,
        modelPrompt,
      },
      template
    );

    setEntitlements((current) => ({
      ...current,
      currentCredits: current.currentCredits - template.generationCost,
    }));
    setJobs((current) => [job, ...current]);

    return {
      kind: "success",
      jobId: job.id,
    };
  }, [
    accountId,
    catalog,
    entitlements.currentCredits,
    entitlements.isPro,
  ]);

  const retryGeneration = useCallback(async (jobId: string) => {
    const originalJob = jobs.find((item) => item.id === jobId);

    if (!originalJob) {
      return { kind: "error", message: "Original generation not found." } satisfies CreateGenerationResult;
    }

    return createGeneration({
      templateId: originalJob.templateId,
      prompt: originalJob.prompt,
      referenceImageUri: originalJob.referenceImageUri,
      ratio: originalJob.ratio,
      resolution: originalJob.resolution,
      outputCount: originalJob.outputCount,
    });
  }, [createGeneration, jobs]);

  const purchasePlan = useCallback(async (planId: string) => {
    if (!catalog) {
      throw new Error("Catalog is not ready yet.");
    }

    const plan = findPlanById(catalog, planId);

    if (!plan) {
      throw new Error("Selected plan is missing from the paywall config.");
    }

    track("purchase_started", { selected_plan: planId });
    const purchasedEntitlements = await purchaseSubscription(
      plan,
      accountId,
      entitlements
    );
    const refreshedEntitlements =
      (await refreshRemoteEntitlements(accountId).catch(() => null)) ??
      purchasedEntitlements;
    const nextEntitlements = {
      ...purchasedEntitlements,
      ...refreshedEntitlements,
      isPro: purchasedEntitlements.isPro || refreshedEntitlements.isPro,
      subscriptionPlan:
        refreshedEntitlements.subscriptionPlan ??
        purchasedEntitlements.subscriptionPlan,
    } satisfies AppEntitlements;
    setEntitlements(nextEntitlements);
    pushToast("Subscription unlocked.");
    track("purchase_success", { selected_plan: planId });
  }, [accountId, catalog, entitlements, pushToast]);

  const purchaseExitOfferAction = useCallback(async () => {
    if (!catalog) {
      throw new Error("Catalog is not ready yet.");
    }

    const offer = catalog.exitOffer;

    track("purchase_started", {
      selected_plan: offer.id,
      purchase_kind: "exit_offer",
    });
    const purchasedEntitlements = await purchaseExitOffer(
      offer,
      accountId,
      entitlements
    );
    const refreshedEntitlements =
      (await refreshRemoteEntitlements(accountId).catch(() => null)) ?? null;
    const nextEntitlements = refreshedEntitlements
      ? ({
          ...purchasedEntitlements,
          ...refreshedEntitlements,
          currentCredits: Math.max(
            purchasedEntitlements.currentCredits,
            refreshedEntitlements.currentCredits
          ),
          isPro: purchasedEntitlements.isPro || refreshedEntitlements.isPro,
          subscriptionPlan:
            refreshedEntitlements.subscriptionPlan ??
            purchasedEntitlements.subscriptionPlan,
        } satisfies AppEntitlements)
      : purchasedEntitlements;
    setEntitlements(nextEntitlements);
    pushToast(`${offer.tokenGrant} credits added.`);
    track("purchase_success", {
      selected_plan: offer.id,
      purchase_kind: "exit_offer",
    });
  }, [accountId, catalog, entitlements, pushToast]);

  const restorePurchases = useCallback(async () => {
    track("restore_tap");
    const restoredEntitlements = await restoreSubscription(accountId, entitlements);
    await notifyRestorePurchases(accountId).catch(() => null);
    const refreshedEntitlements =
      (await refreshRemoteEntitlements(accountId).catch(() => null)) ??
      restoredEntitlements;
    const nextEntitlements = {
      ...restoredEntitlements,
      ...refreshedEntitlements,
      isPro: restoredEntitlements.isPro || refreshedEntitlements.isPro,
      subscriptionPlan:
        refreshedEntitlements.subscriptionPlan ??
        restoredEntitlements.subscriptionPlan,
    } satisfies AppEntitlements;
    setEntitlements(nextEntitlements);
    pushToast("Purchases restored.");
    track("restore_success");
  }, [accountId, entitlements, pushToast]);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      notificationsEnabled: enabled,
    }));
    track("settings_notifications_toggle", { enabled });
  }, []);

  const markVideoGuidelinesSeen = useCallback(() => {
    setSettings((current) => ({
      ...current,
      videoGuidelinesSeen: true,
    }));
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((current) => {
      const item = current.find((entry) => entry.id === id);

      if (item) {
        setCompletedJobIds((ids) =>
          ids.filter((jobId) => jobId !== item.jobId)
        );
      }

      return current.filter((entry) => entry.id !== id);
    });
    track("result_delete_tap", { history_id: id });
  }, []);

  const isJobReady = useCallback(
    (jobId: string) =>
      completedJobIds.includes(jobId) ||
      history.some(
        (item) => item.jobId === jobId && item.status === "completed"
      ),
    [completedJobIds, history]
  );

  const historyFeed = useMemo(() => {
    const activeItems = jobs
      .map((job) => ({
        job,
        snapshot: deriveGenerationSnapshot(job),
      }))
      .filter(({ job, snapshot }) => {
        if (job.status === "failed") {
          return false;
        }

        return snapshot.status !== "completed" && snapshot.status !== "failed";
      })
      .map(({ job }) => buildProcessingHistoryItem(job));

    const completedItems = history.filter(
      (item) => !activeItems.some((activeItem) => activeItem.jobId === item.jobId)
    );

    return [...activeItems, ...completedItems].sort(compareHistoryFeed);
  }, [history, jobs]);

  const catalogContextValue = useMemo(
    () => ({
      bootstrapStatus,
      bootstrapError,
      catalog,
      accountId,
      onboardingCompleted,
      aiProcessingConsentAccepted,
      aiProcessingConsentVisible,
      retryBootstrap,
      completeOnboarding,
      acceptAiProcessingConsent,
      declineAiProcessingConsent,
      openAiProcessingConsentPrompt,
    }),
    [
      accountId,
      acceptAiProcessingConsent,
      aiProcessingConsentAccepted,
      aiProcessingConsentVisible,
      bootstrapError,
      bootstrapStatus,
      catalog,
      completeOnboarding,
      declineAiProcessingConsent,
      openAiProcessingConsentPrompt,
      onboardingCompleted,
      retryBootstrap,
    ]
  );

  const entitlementsContextValue = useMemo(
    () => ({
      entitlements,
      settings,
      purchasePlan,
      purchaseExitOffer: purchaseExitOfferAction,
      restorePurchases,
      setNotificationsEnabled,
      markVideoGuidelinesSeen,
    }),
    [
      entitlements,
      markVideoGuidelinesSeen,
      purchaseExitOfferAction,
      purchasePlan,
      restorePurchases,
      setNotificationsEnabled,
      settings,
    ]
  );

  const generationContextValue = useMemo(
    () => ({
      history,
      historyFeed,
      jobs,
      createGeneration,
      retryGeneration,
      deleteHistoryItem,
      isJobReady,
    }),
    [
      createGeneration,
      deleteHistoryItem,
      history,
      historyFeed,
      isJobReady,
      jobs,
      retryGeneration,
    ]
  );

  const toastContextValue = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast, toasts]
  );

  return (
    <CatalogContext.Provider value={catalogContextValue}>
      <EntitlementsContext.Provider value={entitlementsContextValue}>
        <GenerationContext.Provider value={generationContextValue}>
          <ToastContext.Provider value={toastContextValue}>
            {children}
          </ToastContext.Provider>
        </GenerationContext.Provider>
      </EntitlementsContext.Provider>
    </CatalogContext.Provider>
  );
}

export function useAppState() {
  return {
    ...useCatalogState(),
    ...useEntitlementsState(),
    ...useGenerationState(),
    ...useToastState(),
  };
}

export function useCatalogState() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error("useCatalogState must be used inside AppProvider.");
  }

  return context;
}

export function useEntitlementsState() {
  const context = useContext(EntitlementsContext);

  if (!context) {
    throw new Error("useEntitlementsState must be used inside AppProvider.");
  }

  return context;
}

export function useGenerationState() {
  const context = useContext(GenerationContext);

  if (!context) {
    throw new Error("useGenerationState must be used inside AppProvider.");
  }

  return context;
}

export function useToastState() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToastState must be used inside AppProvider.");
  }

  return context;
}
