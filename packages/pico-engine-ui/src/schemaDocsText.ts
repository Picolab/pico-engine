/** Wording aligned with tools/krl-schema/markdown.js (U6 Docs view). */

import { RulesetSchemaOperation } from "./types/RulesetSchema";

/** Paragraphs for doc descriptions: blank line splits; single newlines become spaces. */
export function descriptionParagraphs(description: string): string[] {
  return String(description)
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);
}

export function eventName(domain?: string | null, name?: string | null): string {
  return `${domain}:${name}`;
}

export function operationEntryLabel(op: RulesetSchemaOperation): string {
  const parts = (op.entry || [])
    .filter((e) => e.domain && e.name)
    .map((e) => `${e.domain}:${e.name}`);
  return parts.length ? parts.join(" · ") : op.rule;
}

export function operationTitleCounts(
  operations: RulesetSchemaOperation[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const op of operations) {
    const key = operationEntryLabel(op);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function isDuplicateOperationTitle(
  op: RulesetSchemaOperation,
  counts: Map<string, number>
): boolean {
  return (counts.get(operationEntryLabel(op)) || 0) > 1;
}

export function emitShownInDocs(e: Record<string, unknown>): boolean {
  if (e.via !== "action") return true;
  const n = String(e.name || e.source || "");
  return n.includes(":") && !/^ctx:/.test(n);
}

export function queryParamSig(
  args?: Array<{ name: string; required?: boolean }>
): string {
  return (args || [])
    .map((a) => (a.required !== false ? a.name : `${a.name}?`))
    .join(", ");
}

const BRANCH_TEXT: Record<string, string> = {
  fired: "when it acts",
  else: "when it doesn't act",
  notfired: "when it doesn't act",
  always: "always",
  finally: "always, afterwards",
  action: "when it acts",
};

function whenClauseText(
  when: Array<Record<string, unknown>> | undefined,
  opCondition?: string | null
): string {
  const parts: string[] = [];
  for (const w of when || []) {
    if (w.condition !== undefined) {
      if (w.condition !== opCondition) parts.push(`if ${String(w.condition)}`);
    } else if (w.branch !== undefined) {
      parts.push(BRANCH_TEXT[String(w.branch)] || String(w.branch));
    } else if (w.if !== undefined) {
      parts.push(`if ${String(w.if)}`);
    } else if (w.choose !== undefined) {
      parts.push(`when ${String(w.choose)} is ${String(w.key)}`);
    } else if (w.sample) {
      parts.push("one chosen at random");
    } else if (w.foreach !== undefined) {
      parts.push(`for each of ${String(w.foreach)}`);
    } else if (w.onFinal) {
      parts.push("after the last iteration");
    }
  }
  return parts.join(", ");
}

/** List item under "May emit (possible, not guaranteed)" — matches krl-schema markdown. */
export function emitDocsLine(
  e: Record<string, unknown>,
  opCondition?: string | null
): string {
  const ev =
    e.domain && e.type
      ? `${e.domain}:${e.type}`
      : String(e.source || e.name || "?");
  let verb: string;
  if (e.via === "send") {
    verb = `sends ${ev}`;
    if (e.replyTo) verb += ` to the ${String(e.replyTo)} you supplied`;
    else if (e.target) verb += ` to ${String(e.target)}`;
  } else if (e.via === "schedule") {
    verb = `schedules ${ev} on this pico`;
  } else if (e.via === "action") {
    verb = `calls module action ${ev}`;
  } else {
    verb = `raises ${ev} on this pico`;
  }
  const when = whenClauseText(
    e.when as Array<Record<string, unknown>> | undefined,
    opCondition
  );
  return verb + (when ? ` — ${when}` : "");
}
