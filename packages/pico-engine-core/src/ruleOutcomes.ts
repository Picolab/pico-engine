import { RuleOutcome } from "krl-stdlib";
import { Pico } from "pico-framework";
import {
  rulesetSchemaForInstalled,
  RulesetSchema,
  RulesetSchemaOperation,
} from "./picoSchema";
import { RulesetRegistry } from "./RulesetRegistry";

function operationMatchesEvent(
  op: RulesetSchemaOperation,
  domain: string,
  name: string
): boolean {
  return (op.entry || []).some(
    (e) => e.domain === domain && e.name === name
  );
}

function isAnnotatedOperation(
  schema: RulesetSchema | null,
  rid: string,
  rule: string
): boolean {
  if (!schema) return false;
  return (schema.operations || []).some((op) => op.rule === rule);
}

/** Merge runtime selected/fired with not_selected for annotated rules on this event. */
export function annotatedRuleOutcomesForEvent(
  pico: Pico,
  rsRegistry: RulesetRegistry,
  domain: string,
  name: string,
  runtime: RuleOutcome[]
): RuleOutcome[] {
  const seen = new Set<string>();
  const out: RuleOutcome[] = [];

  for (const entry of runtime) {
    const schema = rulesetSchemaForInstalled(pico, entry.rid, rsRegistry);
    if (!isAnnotatedOperation(schema, entry.rid, entry.rule)) {
      continue;
    }
    const key = `${entry.rid}:${entry.rule}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }

  for (const rid of Object.keys(pico.rulesets)) {
    const schema = rulesetSchemaForInstalled(pico, rid, rsRegistry);
    if (!schema) continue;
    for (const op of schema.operations || []) {
      if (!operationMatchesEvent(op, domain, name)) continue;
      const key = `${rid}:${op.rule}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        rid,
        rule: op.rule,
        status: "not_selected",
        select: op.select,
      });
    }
  }

  out.sort((a, b) =>
    a.rid === b.rid
      ? a.rule.localeCompare(b.rule)
      : a.rid.localeCompare(b.rid)
  );
  return out;
}

export function collectRuntimeRuleOutcomes(responses: unknown[]): RuleOutcome[] {
  const runtime: RuleOutcome[] = [];
  for (const response of responses) {
    if (
      response &&
      typeof response === "object" &&
      Array.isArray((response as { ruleOutcomes?: unknown }).ruleOutcomes)
    ) {
      runtime.push(
        ...((response as { ruleOutcomes: RuleOutcome[] }).ruleOutcomes || [])
      );
    }
  }
  return runtime;
}
