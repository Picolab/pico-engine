import { apiPost } from "./api";
import { queryResponseError, TestingRunSpec } from "./testingHistory";

/** Fill domain/query from label for history recorded before re-run metadata existed. */
export function normalizeRunSpec(spec: TestingRunSpec): TestingRunSpec {
  if (spec.kind === "query" && !spec.queryName && spec.label) {
    const m = spec.label.match(/^([^ (]+)/);
    if (m) return { ...spec, queryName: m[1] };
  }
  if (
    spec.kind === "event" &&
    (!spec.domain || !spec.eventName) &&
    spec.label.includes(":")
  ) {
    const m = spec.label.match(/^([^:(]+):([^ (]+)/);
    if (m) return { ...spec, domain: m[1], eventName: m[2] };
  }
  return spec;
}

export function canRunSpec(spec: TestingRunSpec): boolean {
  const s = normalizeRunSpec(spec);
  if (s.kind === "console") return true;
  if (s.kind === "query") return Boolean(s.queryName);
  if (s.kind === "event") {
    return Boolean(s.domain && s.eventName);
  }
  return false;
}

export async function runTestingSpec(
  testingEci: string,
  spec: TestingRunSpec
): Promise<{ result: string | null; error: string | null }> {
  const s = normalizeRunSpec(spec);
  const body = s.payload || {};
  try {
    if (s.kind === "console") {
      const data = await apiPost(
        `/c/${testingEci}/query/${s.rid}/__consoleEval`,
        { expr: s.label },
        false
      );
      return {
        result: JSON.stringify(data, undefined, 2),
        error: queryResponseError(data),
      };
    }
    if (s.kind === "query" && s.queryName) {
      const data = await apiPost(
        `/c/${testingEci}/query/${s.rid}/${s.queryName}`,
        body,
        false
      );
      return {
        result: JSON.stringify(data, undefined, 2),
        error: queryResponseError(data),
      };
    }
    if (s.kind === "event" && s.domain && s.eventName) {
      const data = await apiPost(
        `/c/${testingEci}/event-wait/${s.domain}/${s.eventName}`,
        body,
        false
      );
      return {
        result: JSON.stringify(data, undefined, 2),
        error: null,
      };
    }
    return { result: null, error: "Cannot re-run: missing send details" };
  } catch (err) {
    return { result: null, error: String(err) };
  }
}
