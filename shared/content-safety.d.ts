export type SafetyCategory =
  | "sexual_content"
  | "minors"
  | "graphic_violence"
  | "self_harm"
  | "hate_extremism"
  | "weapons_crime"
  | "drugs_tobacco"
  | "non_consensual"
  | "policy_evasion";

export type PromptSafetyResult =
  | { safe: true }
  | { safe: false; category: SafetyCategory };

export declare const NSFW_PROBABILITY_THRESHOLD: 0.2;
export declare const CONTENT_SAFETY_INSTRUCTION: string;

export declare class ContentSafetyError extends Error {
  readonly code: "CONTENT_SAFETY_BLOCKED";
  readonly category: SafetyCategory;
  constructor(category: SafetyCategory);
}

export declare function normalizeSafetyText(value: string): string;
export declare function evaluatePromptSafety(prompt: string): PromptSafetyResult;
export declare function assertSafePrompt(prompt: string): void;
export declare function parseNsfwProbability(payload: unknown): number | null;
export declare function isUnsafeNsfwProbability(
  value: number,
  threshold?: number,
): boolean;
