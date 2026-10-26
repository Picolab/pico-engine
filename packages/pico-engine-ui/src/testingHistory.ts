import { apiPost } from "./api";

/** Fields needed to re-send from history or saved requests. */
export interface TestingRunSpec {
  kind: "event" | "query" | "console";
  rid: string;
  label: string;
  domain?: string;
  eventName?: string;
  queryName?: string;
  exampleName?: string;
  payload?: Record<string, unknown>;
}

export interface TestingHistoryEntry extends TestingRunSpec {
  id: string;
  time: string;
  eci?: string;
  /** Truncated query/console JSON (not stored for failed sends). */
  result?: string;
  ok: boolean;
  error?: string;
  eid?: string;
  ruleOutcomes?: Array<{
    rid: string;
    rule: string;
    status: string;
  }>;
}

const SECRET_KEY = /password|secret|token|apikey|api_key|credential/i;

const HISTORY_RESULT_MAX = 8000;

export function capHistoryResult(result: string | null): string | undefined {
  if (!result) return undefined;
  if (result.length <= HISTORY_RESULT_MAX) return result;
  return `${result.slice(0, HISTORY_RESULT_MAX)}\n…`;
}

export function maskSensitivePayload(
  payload: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!payload) return payload;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    out[k] = SECRET_KEY.test(k) ? "••••••" : v;
  }
  return out;
}

export function outcomeSummary(
  entry: Pick<TestingHistoryEntry, "ok" | "error" | "ruleOutcomes">
): string {
  if (!entry.ok) {
    return entry.error ? `error: ${entry.error}` : "error";
  }
  const outcomes = entry.ruleOutcomes || [];
  if (outcomes.length === 0) {
    return "ok";
  }
  const fired = outcomes.filter((o) => o.status === "fired");
  const notFired = outcomes.filter((o) => o.status === "not_fired");
  const parts: string[] = [];
  if (fired.length) {
    parts.push(
      `fired: ${fired.map((o) => `${o.rid}/${o.rule}`).join(", ")}`
    );
  }
  if (notFired.length) {
    parts.push(
      `not fired: ${notFired.map((o) => `${o.rid}/${o.rule}`).join(", ")}`
    );
  }
  const rest = outcomes.filter(
    (o) => o.status !== "fired" && o.status !== "not_fired"
  );
  if (rest.length) {
    parts.push(
      `other: ${rest.map((o) => `${o.rid}/${o.rule} (${o.status})`).join(", ")}`
    );
  }
  return parts.join("; ") || "ok";
}

export function newHistoryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadTestingHistory(
  picoUiEci: string,
  rid?: string
): Promise<TestingHistoryEntry[]> {
  const data = await apiPost(
    `/c/${picoUiEci}/query/io.picolabs.pico-engine-ui/testingHistory`,
    rid ? { rid } : {},
    false
  );
  if (Array.isArray(data)) {
    return data as TestingHistoryEntry[];
  }
  if (data && typeof data === "object") {
    const all: TestingHistoryEntry[] = [];
    for (const list of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(list)) {
        all.push(...(list as TestingHistoryEntry[]));
      }
    }
    all.sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0));
    return all;
  }
  return [];
}

export async function appendTestingHistory(
  picoUiEci: string,
  rid: string,
  entry: TestingHistoryEntry
): Promise<void> {
  await apiPost(
    `/c/${picoUiEci}/event/engine_ui/testing_history_record`,
    { rid, entry },
    false
  );
}

/** Clear history for one ruleset, or the entire map when rid is omitted. */
export async function clearTestingHistory(
  picoUiEci: string,
  rid?: string
): Promise<void> {
  await apiPost(
    `/c/${picoUiEci}/event/engine_ui/testing_history_clear`,
    rid ? { rid } : {},
    false
  );
}

/** Sky/query JSON body that carries failure without HTTP error (e.g. console compile). */
export function queryResponseError(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return null;
  }
  const err = (data as { error: unknown }).error;
  if (err == null || err === "") {
    return null;
  }
  return typeof err === "string" ? err : JSON.stringify(err);
}

export function errorFromResultJson(result: string | null): string | null {
  if (!result) return null;
  try {
    return queryResponseError(JSON.parse(result));
  } catch {
    return null;
  }
}

export function parseEventWaitResult(result: string | null): {
  eid?: string;
  ruleOutcomes?: TestingHistoryEntry["ruleOutcomes"];
} {
  if (!result) return {};
  try {
    const data = JSON.parse(result) as {
      eid?: string;
      ruleOutcomes?: TestingHistoryEntry["ruleOutcomes"];
    };
    return {
      eid: data.eid,
      ruleOutcomes: data.ruleOutcomes,
    };
  } catch {
    return {};
  }
}
