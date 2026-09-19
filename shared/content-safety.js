export const NSFW_PROBABILITY_THRESHOLD = 0.2;

export const CONTENT_SAFETY_INSTRUCTION =
  "Safety requirements: Every depicted person must be an adult, fully clothed, non-sexualized, and unharmed. Do not depict any illegal, hateful, dangerous, or exploitative activity.";

const CYRILLIC_CONFUSABLES = Object.freeze({
  а: "a",
  в: "b",
  е: "e",
  к: "k",
  м: "m",
  н: "h",
  о: "o",
  р: "p",
  с: "c",
  т: "t",
  у: "y",
  х: "x",
});

const RAW_POLICIES = [
  {
    category: "minors",
    patterns: [
      /\b(?:sexuali[sz](?:e|ed)|nude|naked|explicit)\s+(?:child|kid|minor|schoolgirl|schoolboy|teen(?:ager)?)s?\b/u,
      /\b(?:child|kid|minor|schoolgirl|schoolboy|teen(?:ager)?)s?\s+(?:nude|naked|porn|sexual|explicit)\b/u,
      /\b(?:обнажен\w*|сексуал\w*|интимн\w*)\s+(?:несовершеннолетн\w*|ребен\w*|дет\w*)\b/u,
      /\b(?:несовершеннолетн\w*|ребен\w*|дет\w*)\s+(?:обнажен\w*|сексуал\w*|интимн\w*)\b/u,
    ],
  },
  {
    category: "non_consensual",
    patterns: [
      /\bnon\s+consensual\b/u,
      /\bwithout\s+(?:their|his|her)?\s*consent\b/u,
      /\bdeepfake\s+(?:porn|nude|sex)\b/u,
      /\b(?:без\s+согласия|несогласованн\w*|интимн\w*\s+дипфейк)\b/u,
    ],
  },
  {
    category: "sexual_content",
    patterns: [
      /\b(?:nude|nudity|naked|topless|porn|pornographic|explicit\s+sex|erotic|fetish)\b/u,
      /\b(?:remove|take\s+off)\s+(?:her\s+|his\s+|their\s+)?clothes\b/u,
      /\b(?:обнажен\w*|голая|голый|эротическ\w*|порнограф\w*|фетиш\w*)\b/u,
      /\b(?:снять|убрать)\s+одежд\w*\b/u,
      /\bбез\s+одежд\w*\b/u,
    ],
  },
  {
    category: "graphic_violence",
    patterns: [
      /\b(?:gore|gory|dismember(?:ed|ment)?|decapitat(?:e|ed|ion)|mutilat(?:e|ed|ion)|graphic\s+violence)\b/u,
      /\b(?:расчленен\w*|обезглавлен\w*|изувечен\w*|окровавленн\w*|графическ\w*\s+насили\w*)\b/u,
    ],
  },
  {
    category: "self_harm",
    patterns: [
      /\b(?:suicide|suicidal|self\s+harm|selfharm|cutting\s+(?:herself|himself|themselves))\b/u,
      /\b(?:суицид\w*|самоубийств\w*|самоповрежден\w*)\b/u,
    ],
  },
  {
    category: "hate_extremism",
    patterns: [
      /\b(?:nazi|neo\s+nazi|white\s+supremac\w*|kkk|terrorist)\s+(?:propaganda|praise|recruitment|manifesto)\b/u,
      /\b(?:praise|support|promote)\s+(?:hitler|nazis?|terroris\w*)\b/u,
      /\b(?:нацист\w*|террорист\w*|экстремист\w*)\s+(?:пропаганд\w*|propaganda|вербовк\w*|манифест\w*)\b/u,
      /\b(?:прослав\w*|поддерж\w*)\s+(?:гитлер\w*|нацист\w*|террорист\w*)\b/u,
    ],
  },
  {
    category: "weapons_crime",
    patterns: [
      /\b(?:build|make|assemble|hide|smuggle)\s+(?:a\s+|an\s+)?(?:bomb|explosive|weapon)\b/u,
      /\b(?:bomb|explosive|weapon)\s+(?:instructions?|tutorial|blueprint)\b/u,
      /\b(?:how\s+to|instructions?\s+(?:for|to))\s+(?:build|make|assemble)\s+(?:a\s+|an\s+)?(?:bomb|explosive|weapon)\b/u,
      /\b(?:как\s+(?:сделать|собрать)|инструкци\w*\s+как\s+сделать)\s+(?:бомб\w*|взрывчат\w*|оружи\w*)\b/u,
    ],
  },
  {
    category: "drugs_tobacco",
    patterns: [
      /\b(?:using|taking|snorting|injecting|smoking|selling|advertising|promoting)\s+(?:cocaine|heroin|meth|methamphetamine|fentanyl|tobacco|cigarettes?)\b/u,
      /\b(?:употреблен\w*|продаж\w*|реклам\w*|пропаганд\w*)\s+(?:кокаин\w*|героин\w*|метамфетамин\w*|фентанил\w*|табак\w*|сигарет\w*)\b/u,
    ],
  },
  {
    category: "policy_evasion",
    patterns: [
      /\b(?:bypass|disable|evade|ignore)\s+(?:the\s+)?(?:safety|moderation|content)?\s*(?:filter|policy|rules?|guardrails?)\b/u,
      /\b(?:jailbreak|uncensored\s+mode)\b/u,
      /\b(?:обойти|обойди|отключить|игнорировать)\s+(?:фильтр\w*|модераци\w*|политик\w*|правил\w*)(?:\s+безопасност\w*)?\b/u,
    ],
  },
];

function withUnicodeBoundaries(pattern) {
  const startBoundary = pattern.source.indexOf("\\b");
  const endBoundary = pattern.source.lastIndexOf("\\b");

  if (startBoundary < 0 || endBoundary === startBoundary) {
    return pattern;
  }

  const boundedSource =
    "(?:^|\\s)" +
    pattern.source.slice(startBoundary + 2, endBoundary) +
    "(?=$|\\s)";
  const source = boundedSource.replaceAll("\\w", "[\\p{L}\\p{N}_]");
  return new RegExp(source, pattern.flags);
}

const POLICIES = Object.freeze(
  RAW_POLICIES.map((policy) =>
    Object.freeze({
      ...policy,
      patterns: Object.freeze(policy.patterns.map(withUnicodeBoundaries)),
    }),
  ),
);

function normalizeMixedScriptToken(token) {
  if (!/[a-z]/u.test(token) || !/[\u0400-\u04ff]/u.test(token)) {
    return token;
  }

  return Array.from(token, (character) => CYRILLIC_CONFUSABLES[character] ?? character).join("");
}

function collapseSpacedLetters(tokens) {
  const collapsed = [];

  for (let index = 0; index < tokens.length; ) {
    let end = index;
    while (end < tokens.length && /^[a-z\u0400-\u04ff]$/u.test(tokens[end])) {
      end += 1;
    }

    if (end - index >= 3) {
      collapsed.push(tokens.slice(index, end).join(""));
      index = end;
      continue;
    }

    collapsed.push(tokens[index]);
    index += 1;
  }

  return collapsed;
}

export function normalizeSafetyText(value) {
  if (typeof value !== "string") {
    return "";
  }

  const tokens = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}_]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

  return collapseSpacedLetters(tokens).map(normalizeMixedScriptToken).join(" ");
}

export function evaluatePromptSafety(prompt) {
  const normalizedPrompt = normalizeSafetyText(prompt);

  for (const policy of POLICIES) {
    if (policy.patterns.some((pattern) => pattern.test(normalizedPrompt))) {
      return { safe: false, category: policy.category };
    }
  }

  return { safe: true };
}

export class ContentSafetyError extends Error {
  constructor(category) {
    super("This request cannot be generated under StudioBloom's safety policy.");
    this.name = "ContentSafetyError";
    this.code = "CONTENT_SAFETY_BLOCKED";
    this.category = category;
  }
}

export function assertSafePrompt(prompt) {
  const result = evaluatePromptSafety(prompt);
  if (!result.safe) {
    throw new ContentSafetyError(result.category);
  }
}

export function parseNsfwProbability(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload.nsfw_probability;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

export function isUnsafeNsfwProbability(value, threshold = NSFW_PROBABILITY_THRESHOLD) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    typeof threshold === "number" &&
    Number.isFinite(threshold) &&
    threshold >= 0 &&
    threshold <= 1 &&
    value >= threshold
  );
}
