import { krlLogLevelCodeToHuman } from "krl-stdlib";

/**
 * Turn raw pico log lines for one pico into the structured transactions the
 * Logging tab reads. Uses only fields the engine already writes. `fired` /
 * `not fired` lines may omit `rule_name`; the preceding `rule selected` line
 * supplies it.
 */

export interface LogEventRef {
  eci?: string;
  domain: string;
  name: string;
  attrs: Record<string, unknown>;
}

export interface LogQueryRef {
  eci?: string;
  rid?: string;
  name?: string;
  args: Record<string, unknown>;
}

export interface LogInStep {
  t: string;
  type: "in";
  eci?: string;
  event?: LogEventRef;
  query?: LogQueryRef;
}

export interface LogRuleStep {
  t: string;
  type: "rule";
  rid?: string;
  rule?: string;
  result?: "fired" | "not_fired" | "not_selected";
  /** Select expression, when the rule was not selected. */
  select?: string;
  depth: number;
}

export interface LogRaiseStep {
  t: string;
  type: "raise";
  rid?: string;
  rule?: string;
  event: LogEventRef;
  depth: number;
}

export interface LogKlogStep {
  t: string;
  type: "klog";
  rid?: string;
  rule?: string;
  msg: string;
  val: unknown;
  depth: number;
}

export interface LogNoteStep {
  t: string;
  type: "log";
  level: string;
  rid?: string;
  rule?: string;
  msg: string;
  depth: number;
}

export interface LogErrorStep {
  t: string;
  type: "error";
  error: string;
  line?: number;
  column?: number;
  filename?: string;
}

export interface LogDoneStep {
  t: string;
  type: "done";
  outcome: "ok" | "error" | "open";
  fired: number;
  /** Directives the event returned. Absent when there were none. */
  directives?: unknown;
}

/** One `ent:` write or clear during the transaction. */
export interface LogEntStep {
  t: string;
  type: "ent";
  rid?: string;
  rule?: string;
  name: string;
  before: unknown;
  after: unknown;
  deleted?: boolean;
  depth: number;
}

export interface LogSendStep {
  t: string;
  type: "send";
  rid?: string;
  rule?: string;
  transport?: string;
  eci?: string;
  did?: string;
  host?: string;
  event: LogEventRef;
  childTxn?: string;
  depth: number;
}

/** A same-engine function call made while this transaction was running. */
export interface LogQueryOutStep {
  t: string;
  type: "query_out";
  eci?: string;
  rid?: string;
  name?: string;
  depth: number;
}

export type LogStep =
  | LogInStep
  | LogRuleStep
  | LogRaiseStep
  | LogKlogStep
  | LogNoteStep
  | LogErrorStep
  | LogDoneStep
  | LogQueryOutStep
  | LogEntStep
  | LogSendStep;

export interface LogTransaction {
  txnId: string;
  kind: "event" | "query" | "unknown";
  start: string;
  durationMs: number | null;
  outcome: "ok" | "error" | "open";
  /** Return value of a query, when `txnDone` recorded one. */
  result?: unknown;
  /** Shared by every same-engine call in one chain. Equals `txnId` when this transaction started the chain. */
  traceId?: string;
  /** Transaction that invoked this one, when it was a same-engine function call. */
  parentTxnId?: string;
  /** Channel policy rule that allowed or denied this transaction. */
  policy?: LogPolicyDecision;
  steps: LogStep[];
}

export interface LogPolicyDecision {
  eci?: string;
  allowed: boolean;
  rule:
    | { domain: string; name: string }
    | { rid: string; name: string }
    | "default"
    | "family"
    | "engine";
}

export interface RawLogEntry {
  level?: string | number;
  time?: string;
  txnId?: string;
  msg?: string;
  rid?: string;
  rule_name?: string;
  val?: unknown;
  error?: string;
  line?: number;
  column?: number;
  filename?: string;
  txn?: {
    kind?: string;
    event?: RawEvent;
    query?: RawQuery;
  };
  event?: RawEvent;
  query?: RawQuery;
  /** Query return value, logged on `txnDone`. */
  result?: unknown;
  /** Directives returned by an event, logged on `txnDone`. */
  directives?: unknown;
  /** Event rule outcomes, including `not_selected`, logged on `txnDone`. */
  ruleOutcomes?: Array<{
    rid?: string;
    rule?: string;
    status?: string;
    select?: string;
  }>;
  targetEci?: string;
  targetRid?: string;
  targetName?: string;
  eci?: string;
  allowed?: boolean;
  rule?: unknown;
  name?: string;
  before?: unknown;
  after?: unknown;
  deleted?: boolean;
  transport?: string;
  targetDid?: string;
  host?: string;
  childTxn?: string;
}

interface RawEvent {
  eci?: string;
  domain?: string;
  name?: string;
  data?: { attrs?: Record<string, unknown> };
}

interface RawQuery {
  eci?: string;
  rid?: string;
  name?: string;
  args?: Record<string, unknown>;
}

interface ScheduledWork {
  rid?: string;
  event: LogEventRef;
  eventKey: string;
  depth: number;
  isRaise: boolean;
  opensGroup: boolean;
  raiserRid?: string;
  raiserRule?: string;
  t: string;
}

const STRUCTURAL = new Set([
  "txnQueued",
  "txnStart",
  "txnDone",
  "txnError",
  "rule selected",
  "fired",
  "not fired",
  "event added to schedule",
  "schedule cleared",
  "query out",
  "policy decision",
  "ent write",
  "send",
]);

function levelName(level: string | number | undefined): string {
  if (level == null) return "";
  const code = String(level);
  return krlLogLevelCodeToHuman[code] || code;
}

function cleanMap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, unknown> = {
    ...(value as Record<string, unknown>),
  };
  delete out._headers;
  delete out.__eid;
  delete out.__parent_txn;
  return out;
}

function engineLink(map: Record<string, unknown> | undefined): {
  traceId?: string;
  parentTxnId?: string;
} {
  if (!map) return {};
  const traceId =
    typeof map.__eid === "string" && map.__eid ? map.__eid : undefined;
  const parentTxnId =
    typeof map.__parent_txn === "string" && map.__parent_txn
      ? map.__parent_txn
      : undefined;
  return { traceId, parentTxnId };
}

function readEvent(raw: RawEvent | undefined): LogEventRef | null {
  if (!raw || typeof raw.domain !== "string" || typeof raw.name !== "string") {
    return null;
  }
  return {
    eci: raw.eci,
    domain: raw.domain,
    name: raw.name,
    attrs: cleanMap(raw.data?.attrs),
  };
}

function eventKey(event: LogEventRef): string {
  return `${event.domain}\0${event.name}\0${stable(event.attrs)}`;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stable).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return `{${Object.keys(rec)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(rec[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function msBetween(start?: string, end?: string): number | null {
  if (!start || !end) return null;
  const delta = Date.parse(end) - Date.parse(start);
  return Number.isFinite(delta) ? delta : null;
}

function assembleOne(txnId: string, entries: RawLogEntry[]): LogTransaction {
  const steps: LogStep[] = [];
  const queue: ScheduledWork[] = [];
  let kind: LogTransaction["kind"] = "unknown";
  let start = entries[0]?.time || "";
  let startAt: string | undefined;
  let endAt: string | undefined;
  let outcome: LogTransaction["outcome"] = "open";
  let sawRule = false;
  let incomingKey = "";
  let waveKey: string | null = null;
  let openRule: LogRuleStep | null = null;
  let queryResult: unknown;
  let sawQueryResult = false;
  let traceId: string | undefined;
  let parentTxnId: string | undefined;
  let policy: LogPolicyDecision | undefined;
  let notSelected: Array<{ rid: string; rule: string; select?: string }> = [];
  let directives: unknown;

  function ruleDepth(): number {
    return openRule?.depth ?? 1;
  }

  function emitRaise(work: ScheduledWork) {
    const step: LogRaiseStep = {
      t: work.t,
      type: "raise",
      event: work.event,
      depth: work.depth,
    };
    if (work.raiserRid) step.rid = work.raiserRid;
    if (work.raiserRule) step.rule = work.raiserRule;
    steps.push(step);
  }

  function takeWork(rid: string | undefined): ScheduledWork | null {
    while (queue.length && queue[0].rid !== rid) queue.shift();
    if (!queue.length) return null;
    return queue.shift()!;
  }

  for (const entry of entries) {
    const msg = entry.msg || "";
    const t = entry.time || start;
    const level = levelName(entry.level);

    if (msg === "txnQueued") {
      start = t || start;
      const txn = entry.txn;
      if (txn?.kind === "query") {
        kind = "query";
        const link = engineLink(txn.query?.args);
        if (link.traceId) traceId = link.traceId;
        if (link.parentTxnId) parentTxnId = link.parentTxnId;
        const args = cleanMap(txn.query?.args);
        const query: LogQueryRef = {
          eci: txn.query?.eci,
          rid: txn.query?.rid,
          name: txn.query?.name,
          args,
        };
        steps.push({
          t,
          type: "in",
          eci: query.eci,
          query,
        });
      } else if (txn?.kind === "event" || txn?.event) {
        kind = "event";
        const link = engineLink(txn?.event?.data?.attrs);
        if (link.traceId) traceId = link.traceId;
        if (link.parentTxnId) parentTxnId = link.parentTxnId;
        const event = readEvent(txn?.event);
        if (event) incomingKey = eventKey(event);
        steps.push({
          t,
          type: "in",
          eci: event?.eci,
          event: event || undefined,
        });
      } else {
        steps.push({ t, type: "in" });
      }
      continue;
    }

    if (msg === "policy decision") {
      const rule = policyRule(entry.rule);
      if (rule) {
        policy = {
          allowed: entry.allowed === true,
          rule,
        };
        if (typeof entry.eci === "string") policy.eci = entry.eci;
      }
      continue;
    }

    if (msg === "txnStart") {
      startAt = t;
      if (!start) start = t;
      continue;
    }

    if (msg === "txnDone") {
      endAt = t;
      if (outcome !== "error") outcome = "ok";
      if (entry.result !== undefined) {
        queryResult = entry.result;
        sawQueryResult = true;
      }
      if (entry.directives !== undefined) directives = entry.directives;
      if (Array.isArray(entry.ruleOutcomes)) {
        notSelected = entry.ruleOutcomes.flatMap((outcome) => {
          if (
            outcome?.status !== "not_selected" ||
            typeof outcome.rid !== "string" ||
            typeof outcome.rule !== "string"
          ) {
            return [];
          }
          const row: { rid: string; rule: string; select?: string } = {
            rid: outcome.rid,
            rule: outcome.rule,
          };
          if (typeof outcome.select === "string" && outcome.select) {
            row.select = outcome.select;
          }
          return [row];
        });
      }
      continue;
    }

    if (msg === "txnError") {
      endAt = endAt || t;
      outcome = "error";
      const step: LogErrorStep = {
        t,
        type: "error",
        error: entry.error || "error",
      };
      if (typeof entry.line === "number") step.line = entry.line;
      if (typeof entry.column === "number") step.column = entry.column;
      if (entry.filename) step.filename = entry.filename;
      steps.push(step);
      continue;
    }

    if (msg === "event added to schedule") {
      const event = readEvent(entry.event);
      if (!event) continue;
      const key = eventKey(event);
      const isIncomingFanout =
        !sawRule && key === incomingKey && incomingKey !== "";
      const work: ScheduledWork = {
        rid: entry.rid,
        event,
        eventKey: key,
        depth: ruleDepth(),
        isRaise: !isIncomingFanout,
        opensGroup: false,
        raiserRid: openRule?.rid,
        raiserRule: openRule?.rule,
        t,
      };
      if (work.isRaise) {
        work.opensGroup = waveKey !== key;
        waveKey = key;
        if (work.opensGroup) emitRaise(work);
      } else {
        waveKey = null;
      }
      queue.push(work);
      continue;
    }

    waveKey = null;

    if (msg === "rule selected") {
      sawRule = true;
      const work = takeWork(entry.rid);
      const depth = work ? (work.isRaise ? work.depth + 1 : work.depth) : 1;
      const step: LogRuleStep = {
        t,
        type: "rule",
        rid: entry.rid,
        rule: entry.rule_name,
        depth,
      };
      steps.push(step);
      openRule = step;
      continue;
    }

    if (msg === "fired" || msg === "not fired") {
      const result = msg === "fired" ? "fired" : "not_fired";
      let matched: LogRuleStep | null = null;
      for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.type !== "rule" || step.result) continue;
        if (entry.rid && step.rid && entry.rid !== step.rid) continue;
        if (entry.rule_name && step.rule && entry.rule_name !== step.rule) {
          continue;
        }
        matched = step;
        break;
      }
      if (matched) {
        matched.result = result;
        if (!matched.rule && entry.rule_name) matched.rule = entry.rule_name;
      } else {
        steps.push({
          t,
          type: "rule",
          rid: entry.rid,
          rule: entry.rule_name,
          result,
          depth: ruleDepth(),
        });
      }
      continue;
    }

    if (msg === "ent write") {
      steps.push({
        t,
        type: "ent",
        rid: entry.rid || openRule?.rid,
        rule: entry.rule_name || openRule?.rule,
        name: typeof entry.name === "string" ? entry.name : "",
        before: entry.before,
        after: entry.after,
        deleted: entry.deleted === true ? true : undefined,
        depth: ruleDepth(),
      });
      continue;
    }

    if (msg === "send") {
      const event = readEvent(entry.event);
      if (event) {
        const step: LogSendStep = {
          t,
          type: "send",
          event,
          depth: ruleDepth(),
        };
        if (entry.rid || openRule?.rid) step.rid = entry.rid || openRule?.rid;
        if (entry.rule_name || openRule?.rule) {
          step.rule = entry.rule_name || openRule?.rule;
        }
        if (entry.transport) step.transport = entry.transport;
        if (entry.targetEci || event.eci) step.eci = entry.targetEci || event.eci;
        if (entry.targetDid) step.did = entry.targetDid;
        if (entry.host) step.host = entry.host;
        if (entry.childTxn) step.childTxn = entry.childTxn;
        steps.push(step);
      }
      continue;
    }

    if (msg === "query out") {
      steps.push({
        t,
        type: "query_out",
        eci: entry.targetEci,
        rid: entry.targetRid,
        name: entry.targetName,
        depth: ruleDepth(),
      });
      continue;
    }

    if (level === "klog") {
      steps.push({
        t,
        type: "klog",
        rid: entry.rid || openRule?.rid,
        rule: openRule?.rule,
        msg,
        val: entry.val,
        depth: ruleDepth(),
      });
      continue;
    }

    if (!STRUCTURAL.has(msg) && msg) {
      steps.push({
        t,
        type: "log",
        level: level || "debug",
        rid: entry.rid || openRule?.rid,
        rule: openRule?.rule,
        msg,
        depth: ruleDepth(),
      });
    }
  }

  if (notSelected.length) {
    const seen = new Set(
      steps
        .filter((step) => step.type === "rule")
        .map((step) => `${step.rid}\0${step.rule}`)
    );
    const extra: LogRuleStep[] = [];
    for (const outcome of notSelected) {
      const key = `${outcome.rid}\0${outcome.rule}`;
      if (seen.has(key)) continue;
      seen.add(key);
      extra.push({
        t: endAt || start,
        type: "rule",
        rid: outcome.rid,
        rule: outcome.rule,
        result: "not_selected",
        select: outcome.select,
        depth: 1,
      });
    }
    const raiseAt = steps.findIndex((step) => step.type === "raise");
    const at = raiseAt === -1 ? steps.length : raiseAt;
    steps.splice(at, 0, ...extra);
  }

  const fired = steps.filter(
    (step) => step.type === "rule" && step.result === "fired"
  ).length;
  const done: LogDoneStep = {
    t: endAt || start,
    type: "done",
    outcome,
    fired,
  };
  if (directives !== undefined) done.directives = directives;
  steps.push(done);

  const txn: LogTransaction = {
    txnId,
    kind,
    start,
    durationMs: msBetween(startAt || start, endAt),
    outcome,
    steps,
  };
  if (kind === "query" && sawQueryResult) txn.result = queryResult;
  txn.traceId = traceId || txnId;
  if (parentTxnId) txn.parentTxnId = parentTxnId;
  if (policy) txn.policy = policy;
  return txn;
}

function policyRule(rule: unknown): LogPolicyDecision["rule"] | null {
  if (rule === "default" || rule === "family" || rule === "engine") return rule;
  if (!rule || typeof rule !== "object") return null;
  const rec = rule as { domain?: unknown; name?: unknown; rid?: unknown };
  if (typeof rec.domain === "string" && typeof rec.name === "string") {
    return { domain: rec.domain, name: rec.name };
  }
  if (typeof rec.rid === "string" && typeof rec.name === "string") {
    return { rid: rec.rid, name: rec.name };
  }
  return null;
}

export function assembleLogTransactions(
  entries: readonly RawLogEntry[]
): LogTransaction[] {
  const groups = new Map<string, RawLogEntry[]>();
  for (const entry of entries) {
    if (!entry || typeof entry.txnId !== "string" || entry.txnId === "") {
      continue;
    }
    const list = groups.get(entry.txnId);
    if (list) list.push(entry);
    else groups.set(entry.txnId, [entry]);
  }
  const txns: LogTransaction[] = [];
  for (const [txnId, group] of groups) {
    txns.push(assembleOne(txnId, group));
  }
  txns.reverse();
  return txns;
}
