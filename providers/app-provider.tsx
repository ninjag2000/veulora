import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { findPlanById, findTemplateById } from "@/lib/catalog";
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
  buildCompletedHistoryItem,
  buildFailedHistoryItem,
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
  purchaseSubscription,
  restoreSubscription,
  syncPurchasesEntitlements,
} from "@/services/purchases-service";

type BootstrapStatus = "loading" | "ready" | "error";

interface AppContextValue {
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;
  catalog: BootstrapPayload | null;
  accountId: string;
  onboardingCompleted: boolean;
  entitlements: AppEntitlements;
  settings: AppSettings;
  history: HistoryItem[];
  jobs: GenerationJob[];
  toasts: ToastMessage[];
  retryBootstrap: () => void;
  completeOnboarding: () => void;
  createGeneration: (params: CreateGenerationParams) => Promise<CreateGenerationResult>;
  retryGeneration: (jobId: string) => Promise<CreateGenerationResult>;
  purchasePlan: (planId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => void;
  markVideoGuidelinesSeen: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialEntitlements: AppEntitlements = {
  isPro: false,
  currentCredits: 12,
  subscriptionPlan: null,
  dailyFreeRemaining: 3,
};

const initialSettings: AppSettings = {
  notificationsEnabled: true,
  videoGuidelinesSeen: false,
};

async function loadPersistedStore() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as PersistedStore;
}

export function AppProvider({ children }: PropsWithChildren) {
  const remotePollingInFlightRef = useRef(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>("loading");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<BootstrapPayload | null>(null);
  const [accountId, setAccountId] = useState("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [entitlements, setEntitlements] = useState<AppEntitlements>(initialEntitlements);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);

  const dismissToast = (id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const pushToast = (message: string) => {
    const id = generateId("toast");
    setToasts((current) => [...current, { id, message }]);

    setTimeout(() => {
      dismissToast(id);
    }, 2800);
  };

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
        setEntitlements(syncedPurchases ?? payload.entitlements);
        setSettings(persisted?.settings ?? initialSettings);
        setHistory(payload.history);
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
      accountId,
      entitlements,
      settings,
      history,
      jobs,
    });
  }, [
    accountId,
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
      setHistory((currentHistory) =>
        currentHistory.map((item) => {
          if (item.status !== "processing") {
            return item;
          }

          const job = jobs.find((candidate) => candidate.id === item.jobId);

          if (!job) {
            return item;
          }

          const snapshot = deriveGenerationSnapshot(job);

          if (snapshot.status === "completed") {
            return buildCompletedHistoryItem(job);
          }

          if (snapshot.status === "failed") {
            return buildFailedHistoryItem(
              job,
              snapshot.errorMessage ?? "The generation failed."
            );
          }

          return item;
        })
      );
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
            return {
              ...job,
              helperText:
                error instanceof Error
                  ? `${error.message} Retrying...`
                  : "Reconnecting to the generation service...",
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
        setHistory((currentHistory) =>
          currentHistory.map((item) => {
            const updatedJob = updates.find((job) => job.id === item.jobId);

            if (!updatedJob) {
              return item;
            }

            if (updatedJob.status === "completed") {
              return buildCompletedHistoryItem(updatedJob);
            }

            if (updatedJob.status === "failed") {
              return buildFailedHistoryItem(
                updatedJob,
                updatedJob.errorMessage ?? "The generation failed."
              );
            }

            return {
              ...item,
              previewUrl: updatedJob.previewAsset,
              outputUrls: updatedJob.outputs,
            };
          })
        );
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

  const retryBootstrap = () => {
    setBootstrapNonce((value) => value + 1);
  };

  const completeOnboarding = () => {
    setOnboardingCompleted(true);
    track("onboarding_complete");
  };

  const createGeneration = async (
    params: CreateGenerationParams
  ): Promise<CreateGenerationResult> => {
    if (!catalog) {
      return { kind: "error", message: "App catalog is not ready yet." };
    }

    const template = findTemplateById(catalog, params.templateId);

    if (!template) {
      return { kind: "error", message: "Template not found." };
    }

    const safetyError = validatePromptSafety(params.prompt);

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
          params,
          template,
          accountId
        );

        setEntitlements((current) => ({
          ...current,
          currentCredits: current.currentCredits - template.generationCost,
        }));
        setJobs((current) => [remoteCandidate.job, ...current]);
        setHistory((current) => [remoteCandidate.historyItem, ...current]);

        return {
          kind: "success",
          jobId: remoteCandidate.job.id,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to start generation with the live backend.";

        return { kind: "error", message };
      }
    }

    const job = createGenerationJob(params, template);
    const pendingHistoryItem = buildProcessingHistoryItem(job);

    setEntitlements((current) => ({
      ...current,
      currentCredits: current.currentCredits - template.generationCost,
    }));
    setJobs((current) => [job, ...current]);
    setHistory((current) => [pendingHistoryItem, ...current]);

    return {
      kind: "success",
      jobId: job.id,
    };
  };

  const retryGeneration = async (jobId: string) => {
    const originalJob = jobs.find((item) => item.id === jobId);

    if (!originalJob) {
      return { kind: "error", message: "Original generation not found." } satisfies CreateGenerationResult;
    }

    return createGeneration({
      templateId: originalJob.templateId,
      prompt: originalJob.prompt,
      referenceImageUri: originalJob.referenceImageUri,
      ratio: originalJob.ratio,
    });
  };

  const purchasePlan = async (planId: string) => {
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
  };

  const restorePurchases = async () => {
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
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setSettings((current) => ({
      ...current,
      notificationsEnabled: enabled,
    }));
    track("settings_notifications_toggle", { enabled });
  };

  const markVideoGuidelinesSeen = () => {
    setSettings((current) => ({
      ...current,
      videoGuidelinesSeen: true,
    }));
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((current) => current.filter((item) => item.id !== id));
    track("result_delete_tap", { history_id: id });
  };

  return (
    <AppContext.Provider
      value={{
        bootstrapStatus,
        bootstrapError,
        catalog,
        accountId,
        onboardingCompleted,
        entitlements,
        settings,
        history,
        jobs,
        toasts,
        retryBootstrap,
        completeOnboarding,
        createGeneration,
        retryGeneration,
        purchasePlan,
        restorePurchases,
        setNotificationsEnabled,
        markVideoGuidelinesSeen,
        pushToast,
        dismissToast,
        deleteHistoryItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppProvider.");
  }

  return context;
}
