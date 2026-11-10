import { AsyncLocalStorage } from "async_hooks";
import { KrlLogger } from "krl-stdlib";
import type { EventPolicy, PicoFramework, QueryPolicy } from "pico-framework";

interface PolicyChannel {
  pico: { id: string };
  familyChannelPicoID?: string;
  eventPolicy: EventPolicy;
  queryPolicy: QueryPolicy;
}

/** True while a call is inside channel policy (`event`, `query`, and the wait variants). */
const policyCheck = new AsyncLocalStorage<true>();

export function policyCheckActive(): boolean {
  return policyCheck.getStore() === true;
}

export type PolicyRule =
  | { domain: string; name: string }
  | { rid: string; name: string }
  | "default"
  | "family"
  | "engine";

export interface PolicyMatch {
  allowed: boolean;
  rule: PolicyRule;
}

export function matchEventPolicy(
  policy: EventPolicy,
  event: { domain: string; name: string }
): PolicyMatch {
  for (const rule of policy.deny) {
    if (
      (rule.domain === "*" || rule.domain === event.domain) &&
      (rule.name === "*" || rule.name === event.name)
    ) {
      return { allowed: false, rule: { domain: rule.domain, name: rule.name } };
    }
  }
  for (const rule of policy.allow) {
    if (
      (rule.domain === "*" || rule.domain === event.domain) &&
      (rule.name === "*" || rule.name === event.name)
    ) {
      return { allowed: true, rule: { domain: rule.domain, name: rule.name } };
    }
  }
  return { allowed: false, rule: "default" };
}

export function matchQueryPolicy(
  policy: QueryPolicy,
  query: { rid: string; name: string }
): PolicyMatch {
  for (const rule of policy.deny) {
    if (
      (rule.rid === "*" || rule.rid === query.rid) &&
      (rule.name === "*" || rule.name === query.name)
    ) {
      return { allowed: false, rule: { rid: rule.rid, name: rule.name } };
    }
  }
  for (const rule of policy.allow) {
    if (
      (rule.rid === "*" || rule.rid === query.rid) &&
      (rule.name === "*" || rule.name === query.name)
    ) {
      return { allowed: true, rule: { rid: rule.rid, name: rule.name } };
    }
  }
  return { allowed: false, rule: "default" };
}

interface PolicyHost {
  log: KrlLogger;
  picoFramework: PicoFramework;
}

interface QueuedTxn {
  id: string;
  kind: string;
  event?: { eci: string; domain: string; name: string };
  query?: { eci: string; rid: string; name: string };
}

/** Record the rule that let this queued transaction through. Scheduled work is not a policy check. */
export function logQueuedPolicy(
  core: PolicyHost,
  picoId: string,
  txn: QueuedTxn
): void {
  if (!policyCheckActive()) return;
  const eci = txn.kind === "query" ? txn.query?.eci : txn.event?.eci;
  if (!eci) return;
  let channel: PolicyChannel;
  try {
    channel = core.picoFramework.lookupChannel(eci);
  } catch {
    return;
  }
  const decision = decisionForQueued(channel, txn);
  if (!decision) return;
  core.log.debug("policy decision", {
    picoId,
    txnId: txn.id,
    eci,
    allowed: decision.allowed,
    rule: decision.rule,
  });
}

function decisionForQueued(
  channel: PolicyChannel,
  txn: QueuedTxn
): PolicyMatch | null {
  if (channel.familyChannelPicoID) {
    return { allowed: true, rule: "family" };
  }
  if (txn.kind === "event" && txn.event) {
    return matchEventPolicy(channel.eventPolicy, txn.event);
  }
  if (txn.kind === "query" && txn.query) {
    return matchQueryPolicy(channel.queryPolicy, txn.query);
  }
  return null;
}

type PolicyFailure = "deny" | "default" | "family";

function policyFailure(err: unknown): PolicyFailure | null {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "This is a family channel and only the owner can use it.") {
    return "family";
  }
  if (message === "Denied by channel policy") return "deny";
  if (message === "Not allowed by channel policy") return "default";
  return null;
}

function writeDenial(
  core: PolicyHost,
  picoId: string,
  txn: { kind: "event" | "query"; event?: unknown; query?: unknown },
  eci: string,
  decision: PolicyMatch,
  err: unknown,
  summary: Record<string, unknown>
): void {
  const txnId = core.picoFramework.genID();
  core.log.debug("txnQueued", { picoId, txnId, txn });
  core.log.debug("policy decision", {
    picoId,
    txnId,
    eci,
    allowed: decision.allowed,
    rule: decision.rule,
  });
  core.log.debug("txnError", {
    picoId,
    txnId,
    txnKind: txn.kind,
    error: err instanceof Error ? err.message : String(err),
    ...summary,
  });
}

function eventDenial(
  core: PolicyHost,
  event: { eci: string; domain: string; name: string },
  err: unknown
): void {
  const failure = policyFailure(err);
  if (!failure) return;
  let channel: PolicyChannel;
  try {
    channel = core.picoFramework.lookupChannel(event.eci);
  } catch {
    return;
  }
  const match = matchEventPolicy(channel.eventPolicy, event);
  const decision: PolicyMatch =
    failure === "family"
      ? { allowed: false, rule: "family" }
      : match.allowed
        ? { allowed: false, rule: "engine" }
        : match;
  writeDenial(
    core,
    channel.pico.id,
    { kind: "event", event },
    event.eci,
    decision,
    err,
    { event: { domain: event.domain, name: event.name, eci: event.eci } }
  );
}

function queryDenial(
  core: PolicyHost,
  query: { eci: string; rid: string; name: string },
  err: unknown
): void {
  const failure = policyFailure(err);
  if (!failure) return;
  let channel: PolicyChannel;
  try {
    channel = core.picoFramework.lookupChannel(query.eci);
  } catch {
    return;
  }
  const match = matchQueryPolicy(channel.queryPolicy, query);
  const decision: PolicyMatch =
    failure === "family"
      ? { allowed: false, rule: "family" }
      : match.allowed
        ? { allowed: false, rule: "engine" }
        : match;
  writeDenial(
    core,
    channel.pico.id,
    { kind: "query", query },
    query.eci,
    decision,
    err,
    { query: { rid: query.rid, name: query.name, eci: query.eci } }
  );
}

/**
 * Log denials that never become a transaction, and mark the calls that do
 * so the queued transaction can record which rule allowed it.
 */
export function installPolicyLogging(core: PolicyHost): void {
  const pf = core.picoFramework;
  const event = pf.event.bind(pf);
  const eventWait = pf.eventWait.bind(pf);
  const eventQuery = pf.eventQuery.bind(pf);
  const query = pf.query.bind(pf);

  pf.event = (incoming, fromPicoId) =>
    policyCheck.run(true, () => event(incoming, fromPicoId)).catch((err) => {
      eventDenial(core, incoming, err);
      throw err;
    });

  pf.eventWait = (incoming, fromPicoId) =>
    policyCheck
      .run(true, () => eventWait(incoming, fromPicoId))
      .catch((err) => {
        eventDenial(core, incoming, err);
        throw err;
      });

  pf.eventQuery = (incoming, incomingQuery, fromPicoId) =>
    policyCheck
      .run(true, () => eventQuery(incoming, incomingQuery, fromPicoId))
      .catch((err) => {
        const eventFailed = policyFailure(err);
        if (eventFailed === "family") {
          eventDenial(core, incoming, err);
        } else {
          const channel = lookupQuiet(pf, incoming.eci);
          const eventMatch = channel
            ? matchEventPolicy(channel.eventPolicy, incoming)
            : null;
          if (eventMatch && !eventMatch.allowed) eventDenial(core, incoming, err);
          else queryDenial(core, incomingQuery, err);
        }
        throw err;
      });

  pf.query = (incoming, fromPicoId) =>
    policyCheck.run(true, () => query(incoming, fromPicoId)).catch((err) => {
      queryDenial(core, incoming, err);
      throw err;
    });
}

function lookupQuiet(pf: PicoFramework, eci: string): PolicyChannel | null {
  try {
    return pf.lookupChannel(eci);
  } catch {
    return null;
  }
}
