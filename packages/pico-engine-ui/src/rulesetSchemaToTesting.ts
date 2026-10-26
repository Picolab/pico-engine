import { TestingSchema } from "./types/TestingSchema";

/** Map engine rulesetSchema JSON to the legacy Testing tab shape. */
export function rulesetSchemaToTesting(schema: {
  operations?: Array<{
    entry?: Array<{ domain?: string | null; name?: string | null }>;
    attrs?: Array<{ name: string }>;
    examples?: Array<{
      name: string;
      attrs: Record<string, unknown>;
    }>;
  }>;
  queries?: Array<{
    name: string;
    args?: Array<{ name: string }>;
    examples?: Array<{
      name: string;
      args: Record<string, unknown>;
    }>;
  }>;
} | null): TestingSchema | null {
  if (!schema) return null;

  const events: NonNullable<TestingSchema["events"]> = [];
  const seen = new Set<string>();

  for (const op of schema.operations || []) {
    const attrNames = (op.attrs || []).map((a) => a.name);
    const examples = op.examples || [];
    for (const ent of op.entry || []) {
      if (!ent.domain || !ent.name) continue;
      const baseKey = `${ent.domain}:${ent.name}`;
      if (examples.length === 0) {
        if (seen.has(baseKey)) continue;
        seen.add(baseKey);
        events.push({
          domain: ent.domain,
          name: ent.name,
          attrs: attrNames.length ? attrNames : undefined,
        });
        continue;
      }
      for (const ex of examples) {
        const key = `${baseKey}:${ex.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const defaults: Record<string, string | number | boolean> = {};
        for (const [k, v] of Object.entries(ex.attrs || {})) {
          if (
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean"
          ) {
            defaults[k] = v;
          } else if (v != null) {
            defaults[k] = JSON.stringify(v);
          }
        }
        const exAttrNames =
          Object.keys(defaults).length > 0
            ? Object.keys(defaults)
            : attrNames;
        events.push({
          domain: ent.domain,
          name: ent.name,
          attrs: exAttrNames.length ? exAttrNames : undefined,
          exampleName: ex.name,
          defaults: Object.keys(defaults).length ? defaults : undefined,
        });
      }
    }
  }

  const queries: NonNullable<TestingSchema["queries"]> = [];
  for (const q of schema.queries || []) {
    const argNames = (q.args || []).map((a) => a.name);
    const examples = q.examples || [];
    if (examples.length === 0) {
      queries.push({
        name: q.name,
        args: argNames.length ? argNames : undefined,
      });
      continue;
    }
    for (const ex of examples) {
      const defaults: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(ex.args || {})) {
        if (
          typeof v === "string" ||
          typeof v === "number" ||
          typeof v === "boolean"
        ) {
          defaults[k] = v;
        } else if (v != null) {
          defaults[k] = JSON.stringify(v);
        }
      }
      queries.push({
        name: q.name,
        args:
          Object.keys(defaults).length > 0
            ? Object.keys(defaults)
            : argNames.length
              ? argNames
              : undefined,
        exampleName: ex.name,
        defaults: Object.keys(defaults).length ? defaults : undefined,
      });
    }
  }

  if (events.length === 0 && queries.length === 0) {
    return null;
  }

  return { events, queries };
}
