import { apiPost } from "./api";
import {
  newHistoryId,
  TestingHistoryEntry,
  TestingRunSpec,
} from "./testingHistory";

export interface TestingSavedRequest extends TestingRunSpec {
  id: string;
  name: string;
  savedAt: string;
}

const SECRET_KEY = /password|secret|token|apikey|api_key|credential/i;

/** Payload safe to persist in saved requests (secrets omitted). */
export function payloadForSavedRequest(
  payload: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (SECRET_KEY.test(k)) continue;
    if (v === "••••••") continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export function historyEntryToSaved(
  entry: TestingHistoryEntry,
  name: string
): TestingSavedRequest {
  return {
    id: newHistoryId(),
    name: name.trim(),
    savedAt: new Date().toISOString(),
    kind: entry.kind,
    rid: entry.rid,
    label: entry.label,
    domain: entry.domain,
    eventName: entry.eventName,
    queryName: entry.queryName,
    exampleName: entry.exampleName,
    payload: payloadForSavedRequest(entry.payload),
  };
}

export function savedToRunSpec(saved: TestingSavedRequest): TestingRunSpec {
  return {
    kind: saved.kind,
    rid: saved.rid,
    label: saved.label,
    domain: saved.domain,
    eventName: saved.eventName,
    queryName: saved.queryName,
    exampleName: saved.exampleName,
    payload: saved.payload,
  };
}

export function historyToRunSpec(entry: TestingHistoryEntry): TestingRunSpec {
  return {
    kind: entry.kind,
    rid: entry.rid,
    label: entry.label,
    domain: entry.domain,
    eventName: entry.eventName,
    queryName: entry.queryName,
    exampleName: entry.exampleName,
    payload: entry.payload,
  };
}

/** One annotation line for pasting into a KRL doc comment (events and queries). */
export function formatAtExampleAnnotation(
  spec: TestingRunSpec,
  exampleName: string
): string | null {
  if (spec.kind === "console") {
    return null;
  }
  const trimmed = exampleName.trim();
  if (!trimmed) return null;
  const safeName = trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const body = payloadForSavedRequest(spec.payload) || {};
  return ` * @example "${safeName}" ${JSON.stringify(body)}`;
}

export async function loadTestingSaved(
  picoUiEci: string,
  rid?: string
): Promise<TestingSavedRequest[]> {
  const data = await apiPost(
    `/c/${picoUiEci}/query/io.picolabs.pico-engine-ui/testingSaved`,
    rid ? { rid } : {},
    false
  );
  if (Array.isArray(data)) {
    return data as TestingSavedRequest[];
  }
  if (data && typeof data === "object") {
    const all: TestingSavedRequest[] = [];
    for (const list of Object.values(data as Record<string, unknown>)) {
      if (Array.isArray(list)) {
        all.push(...(list as TestingSavedRequest[]));
      }
    }
    all.sort((a, b) =>
      a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : 0
    );
    return all;
  }
  return [];
}

export async function upsertTestingSaved(
  picoUiEci: string,
  rid: string,
  entry: TestingSavedRequest
): Promise<void> {
  await apiPost(
    `/c/${picoUiEci}/event/engine_ui/testing_saved_upsert`,
    { rid, entry },
    false
  );
}

export async function deleteTestingSaved(
  picoUiEci: string,
  rid: string,
  id: string
): Promise<void> {
  await apiPost(
    `/c/${picoUiEci}/event/engine_ui/testing_saved_delete`,
    { rid, id },
    false
  );
}
