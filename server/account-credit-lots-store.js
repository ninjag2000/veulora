import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH =
  process.env.CREDIT_LOTS_STORE_PATH?.trim() ||
  path.join(SERVER_DIR, "data", "account-credit-lots.json");

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function normalizeLot(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const id = typeof value.id === "string" && value.id.trim() ? value.id : null;
  const source =
    typeof value.source === "string" && value.source.trim()
      ? value.source
      : "unknown";
  const grantedCredits =
    typeof value.grantedCredits === "number" && Number.isFinite(value.grantedCredits)
      ? Math.max(0, Math.floor(value.grantedCredits))
      : 0;
  const remainingCredits =
    typeof value.remainingCredits === "number" && Number.isFinite(value.remainingCredits)
      ? Math.max(0, Math.floor(value.remainingCredits))
      : 0;
  const grantedAt =
    typeof value.grantedAt === "string" && value.grantedAt.trim()
      ? value.grantedAt
      : new Date().toISOString();
  const expiresAt =
    typeof value.expiresAt === "string" && value.expiresAt.trim()
      ? value.expiresAt
      : new Date().toISOString();
  const metadata =
    value.metadata && typeof value.metadata === "object" ? value.metadata : {};
  const createdAt =
    typeof value.createdAt === "string" && value.createdAt.trim()
      ? value.createdAt
      : grantedAt;

  if (!id || grantedCredits <= 0) {
    return null;
  }

  return {
    id,
    source,
    grantedCredits,
    remainingCredits: Math.min(remainingCredits, grantedCredits),
    grantedAt,
    expiresAt,
    metadata,
    createdAt,
  };
}

export function loadAccountCreditLots() {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return new Map();
    }

    const entries = Object.entries(parsed)
      .map(([accountId, lots]) => {
        if (!accountId || !Array.isArray(lots)) {
          return null;
        }
        const normalizedLots = lots
          .map(normalizeLot)
          .filter((lot) => lot !== null);
        return [accountId, normalizedLots];
      })
      .filter((entry) => entry !== null);

    return new Map(entries);
  } catch {
    return new Map();
  }
}

export function saveAccountCreditLots(map) {
  ensureStoreDir();

  const entries = [...map.entries()].map(([accountId, lots]) => [
    accountId,
    Array.isArray(lots)
      ? lots.map(normalizeLot).filter((lot) => lot !== null)
      : [],
  ]);

  fs.writeFileSync(STORE_PATH, JSON.stringify(Object.fromEntries(entries), null, 2), "utf8");
}
