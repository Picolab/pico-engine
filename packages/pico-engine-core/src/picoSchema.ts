import {
  allowsEventPolicy,
  allowsQueryPolicy,
  ChannelConfig,
  Pico,
} from "pico-framework";
import { CachedRuleset, RulesetRegistry } from "./RulesetRegistry";

export interface RulesetSchemaAttr {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  pattern?: string;
  fromSelect?: boolean;
}

export interface RulesetSchemaExample {
  name: string;
  attrs: Record<string, unknown>;
}

export interface RulesetSchemaQueryExample {
  name: string;
  args: Record<string, unknown>;
}

export interface RulesetSchemaOperation {
  rule: string;
  description?: string;
  select?: string;
  entry: Array<{
    domain: string | null;
    name: string | null;
    constraints?: unknown[];
    sequence?: unknown;
    selectWhere?: boolean;
  }>;
  attrs: RulesetSchemaAttr[];
  examples?: RulesetSchemaExample[];
}

export interface RulesetSchema {
  version: number;
  rid: string;
  rid_version?: string;
  description?: string;
  operations: RulesetSchemaOperation[];
  queries: Array<{
    name: string;
    description?: string;
    args?: unknown[];
    returns?: string;
    examples?: RulesetSchemaQueryExample[];
  }>;
}

export interface PicoSchemaEventSource {
  rid: string;
  rule: string;
}

export interface PicoSchemaEventExample {
  rid: string;
  rule: string;
  name: string;
  attrs: Record<string, unknown>;
}

export interface PicoSchemaEvent {
  domain: string;
  name: string;
  constraints: unknown[];
  attrs: RulesetSchemaAttr[];
  description?: string;
  sources: PicoSchemaEventSource[];
  examples?: PicoSchemaEventExample[];
}

export interface PicoSchemaConflict {
  domain: string;
  name: string;
  constraints: unknown[];
  attr: string;
  types: Array<{ type: string; rid: string; rule: string }>;
}

export interface PicoSchema {
  version: 1;
  rulesets: Array<{ rid: string; description?: string }>;
  events: PicoSchemaEvent[];
  queries: Array<{
    rid: string;
    name: string;
    description?: string;
    args?: unknown[];
    returns?: string;
    examples?: RulesetSchemaQueryExample[];
  }>;
  conflicts: PicoSchemaConflict[];
}

export interface DiscoveryBindings {
  version: 1;
  queries: Array<{
    name: string;
    description?: string;
    args?: unknown[];
  }>;
  events: Array<{
    domain: string;
    name: string;
    attrs: RulesetSchemaAttr[];
    description?: string;
  }>;
}

function entryKey(domain: string, name: string, constraints: unknown[]): string {
  return domain + ":" + name + ":" + JSON.stringify(constraints || []);
}

function examplesForOp(
  rid: string,
  op: RulesetSchemaOperation
): PicoSchemaEventExample[] | undefined {
  if (!op.examples || op.examples.length === 0) return undefined;
  return op.examples.map((ex) => ({
    rid,
    rule: op.rule,
    name: ex.name,
    attrs: ex.attrs,
  }));
}

function appendEventExamples(
  eventEntry: PicoSchemaEvent,
  rid: string,
  op: RulesetSchemaOperation
): void {
  const added = examplesForOp(rid, op);
  if (!added) return;
  if (!eventEntry.examples) eventEntry.examples = [];
  eventEntry.examples.push(...added);
}

export function rulesetSchemaFromRuleset(ruleset: {
  rulesetSchema?: RulesetSchema;
}): RulesetSchema | null {
  return ruleset.rulesetSchema ?? null;
}

export function rulesetSchemaForInstalled(
  pico: Pico,
  rid: string,
  rsRegistry: RulesetRegistry
): RulesetSchema | null {
  const installed = pico.rulesets[rid];
  if (!installed) return null;
  const url = installed.config?.["url"];
  if (typeof url !== "string") return null;
  const cached = rsRegistry.getCached(url);
  if (!cached) return null;
  return rulesetSchemaFromRuleset(cached.ruleset as { rulesetSchema?: RulesetSchema });
}

export function allRulesetSchemasForPico(
  pico: Pico,
  rsRegistry: RulesetRegistry
): { rid: string; schema: RulesetSchema }[] {
  const out: { rid: string; schema: RulesetSchema }[] = [];
  for (const rid of Object.keys(pico.rulesets)) {
    const schema = rulesetSchemaForInstalled(pico, rid, rsRegistry);
    if (schema) out.push({ rid, schema });
  }
  return out;
}

function mergeAttrEntry(
  existing: RulesetSchemaAttr,
  incoming: RulesetSchemaAttr,
  source: PicoSchemaEventSource
): RulesetSchemaAttr {
  const required = !!(existing.required && incoming.required);
  return {
    name: existing.name,
    type: existing.type || incoming.type || "Any",
    required,
    description: existing.description || incoming.description,
    pattern: existing.pattern || incoming.pattern,
  };
}

export function mergePicoSchema(
  schemas: { rid: string; schema: RulesetSchema }[]
): PicoSchema {
  const rulesets = schemas.map(({ rid, schema }) => ({
    rid,
    description: schema.description,
  }));

  const eventMap = new Map<string, PicoSchemaEvent>();
  const conflicts: PicoSchemaConflict[] = [];
  const queries: PicoSchema["queries"] = [];

  for (const { rid, schema } of schemas) {
    for (const q of schema.queries || []) {
      queries.push({
        rid,
        name: q.name,
        description: q.description,
        args: q.args,
        returns: q.returns,
        examples: q.examples,
      });
    }

    for (const op of schema.operations || []) {
      for (const ent of op.entry || []) {
        if (!ent.domain || !ent.name) continue;
        const constraints = ent.constraints || [];
        const key = entryKey(ent.domain, ent.name, constraints);
        const source: PicoSchemaEventSource = { rid, rule: op.rule };

        let eventEntry = eventMap.get(key);
        if (!eventEntry) {
          eventEntry = {
            domain: ent.domain,
            name: ent.name,
            constraints,
            attrs: (op.attrs || []).map((a) => ({ ...a })),
            description: op.description,
            sources: [source],
            examples: examplesForOp(rid, op),
          };
          eventMap.set(key, eventEntry);
          continue;
        }

        if (!eventEntry.description && op.description) {
          eventEntry.description = op.description;
        }
        eventEntry.sources.push(source);
        appendEventExamples(eventEntry, rid, op);

        const byName: { [name: string]: RulesetSchemaAttr } = {};
        for (const a of eventEntry.attrs) byName[a.name] = { ...a };
        for (const a of op.attrs || []) {
          const prev = byName[a.name];
          if (!prev) {
            byName[a.name] = { ...a };
            continue;
          }
          const prevType = prev.type || "Any";
          const nextType = a.type || "Any";
          if (prevType !== nextType) {
            conflicts.push({
              domain: ent.domain,
              name: ent.name,
              constraints,
              attr: a.name,
              types: [
                {
                  type: prevType,
                  rid: eventEntry.sources[0].rid,
                  rule: eventEntry.sources[0].rule,
                },
                { type: nextType, rid, rule: op.rule },
              ],
            });
          }
          byName[a.name] = mergeAttrEntry(prev, a, source);
        }
        eventEntry.attrs = Object.values(byName);
      }
    }
  }

  return {
    version: 1,
    rulesets,
    events: Array.from(eventMap.values()),
    queries,
    conflicts,
  };
}

export function buildPicoSchema(
  pico: Pico,
  rsRegistry: RulesetRegistry
): PicoSchema {
  return mergePicoSchema(allRulesetSchemasForPico(pico, rsRegistry));
}

export function schemaBindingsFromRuleset(
  schema: RulesetSchema
): DiscoveryBindings {
  const eventsMap = new Map<
    string,
    { domain: string; name: string; attrs: RulesetSchemaAttr[]; description?: string }
  >();

  for (const op of schema.operations || []) {
    for (const ent of op.entry || []) {
      if (!ent.domain || !ent.name) continue;
      const key = entryKey(ent.domain, ent.name, ent.constraints || []);
      if (!eventsMap.has(key)) {
        eventsMap.set(key, {
          domain: ent.domain,
          name: ent.name,
          attrs: (op.attrs || []).map((a) => ({ ...a })),
          description: op.description,
        });
      }
    }
  }

  return {
    version: 1,
    queries: (schema.queries || []).map((q) => ({
      name: q.name,
      description: q.description,
      args: q.args,
    })),
    events: Array.from(eventsMap.values()),
  };
}

export function filterPicoSchemaForChannel(
  schema: PicoSchema,
  channel: ChannelConfig,
  ridForQuery: (queryRid: string) => boolean = () => true
): PicoSchema {
  const eventPolicy = channel.eventPolicy || { allow: [], deny: [] };
  const queryPolicy = channel.queryPolicy || { allow: [], deny: [] };
  const events = schema.events.filter((ev) =>
    allowsEventPolicy(eventPolicy, { domain: ev.domain, name: ev.name })
  );
  const queries = schema.queries.filter(
    (q) =>
      ridForQuery(q.rid) &&
      allowsQueryPolicy(queryPolicy, { rid: q.rid, name: q.name })
  );
  return {
    ...schema,
    events,
    queries,
    conflicts: schema.conflicts,
    rulesets: schema.rulesets,
  };
}

export function channelSchemaForEci(
  pico: Pico,
  rsRegistry: RulesetRegistry,
  lookupChannel: (eci: string) => ChannelConfig,
  eci: string
): PicoSchema {
  const full = buildPicoSchema(pico, rsRegistry);
  const channel = lookupChannel(eci);
  return filterPicoSchemaForChannel(full, channel);
}
