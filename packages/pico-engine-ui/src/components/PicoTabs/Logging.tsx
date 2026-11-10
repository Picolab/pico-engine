import * as React from "react";
import { Link } from "react-router-dom";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails } from "../../types/PicoDetails";
import { apiGet } from "../../api";
import useAsyncLoader from "../../useAsyncLoader";
import ErrorStatus from "../widgets/ErrorStatus";
import TabPageHeader from "../widgets/TabPageHeader";
import SplitPane from "../widgets/SplitPane";

interface LogEventRef {
  eci?: string;
  domain: string;
  name: string;
  attrs?: Record<string, unknown>;
}

interface LogQueryRef {
  eci?: string;
  rid?: string;
  name?: string;
  args?: Record<string, unknown>;
}

interface LogStep {
  t?: string;
  type: string;
  eci?: string;
  event?: LogEventRef;
  query?: LogQueryRef;
  rid?: string;
  rule?: string;
  result?: string;
  select?: string;
  msg?: string;
  val?: unknown;
  level?: string;
  error?: string;
  line?: number;
  column?: number;
  filename?: string;
  depth?: number;
  outcome?: string;
  fired?: number;
  directives?: unknown;
  name?: string;
  before?: unknown;
  after?: unknown;
  deleted?: boolean;
  transport?: string;
  did?: string;
  host?: string;
  childTxn?: string;
}

interface LogTransaction {
  txnId: string;
  kind?: string;
  start?: string;
  time?: string;
  durationMs?: number | null;
  outcome?: string;
  result?: unknown;
  traceId?: string;
  parentTxnId?: string;
  policy?: {
    eci?: string;
    allowed?: boolean;
    rule?: { domain?: string; name?: string; rid?: string } | string;
  };
  header?: string;
  entries?: string[];
  steps?: LogStep[];
}

interface Filters {
  text: string;
  errors: boolean;
  klog: boolean;
  live: boolean;
  ruleset: string;
  event: string;
  /** Testing-tab bookkeeping (`engine_ui` history events and `__testing`). */
  showTesting: boolean;
  /** Engine rulesets hidden unless the box is checked. */
  showRulesets: Record<string, boolean>;
}

const ENGINE_RULESETS: { rid: string; label: string }[] = [
  { rid: "io.picolabs.wrangler", label: "Wrangler" },
  { rid: "io.picolabs.pds", label: "PDS" },
  { rid: "io.picolabs.subscription", label: "Subscription" },
  { rid: "io.picolabs.pico-engine-ui", label: "Developer UI" },
];

const emptyFilters: Filters = {
  text: "",
  errors: false,
  klog: false,
  live: true,
  ruleset: "",
  event: "",
  showTesting: false,
  showRulesets: {},
};

/** Events the Testing tab writes for its own bookkeeping. */
const TESTING_EVENTS = [
  "testing_history_record",
  "testing_history_clear",
  "testing_saved_upsert",
  "testing_saved_delete",
  "testing_eci",
];

async function getLogs(eci: string): Promise<LogTransaction[]> {
  return apiGet(`/c/${eci}/query/io.picolabs.pico-engine-ui/logs`);
}

function rulesetShown(filters: Filters, rid?: string): boolean {
  if (!rid) return true;
  if (!ENGINE_RULESETS.some((item) => item.rid === rid)) return true;
  return !!filters.showRulesets[rid];
}

function stepShown(step: LogStep, filters: Filters): boolean {
  if (step.type === "in" || step.type === "done" || step.type === "error") {
    return true;
  }
  return rulesetShown(filters, step.rid || step.query?.rid);
}

/** The Logging tab's own fetch. Showing it lists the log inside the log. */
function isLogsQuery(txn: LogTransaction): boolean {
  const query = incomingOf(txn)?.query;
  return (
    txn.kind === "query" &&
    query?.rid === "io.picolabs.pico-engine-ui" &&
    query.name === "logs"
  );
}

function clock(t?: string): string {
  if (!t) return "";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function incomingOf(txn: LogTransaction): LogStep | undefined {
  return (txn.steps || []).find((step) => step.type === "in");
}

function eventKey(event?: LogEventRef): string {
  return event ? `${event.domain}:${event.name}` : "";
}

function queryKey(query?: LogQueryRef): string {
  return query ? `${query.rid || ""}/${query.name || ""}` : "";
}

function policyLabel(rule: LogTransaction["policy"]): string {
  if (!rule) return "";
  const which = rule.rule;
  const text =
    which === "default"
      ? "default"
      : which === "family"
        ? "family channel"
        : which === "engine"
          ? "engine policy"
          : which && typeof which === "object"
            ? which.domain
              ? `${which.domain}:${which.name}`
              : `${which.rid}/${which.name}`
            : "";
  if (!text) return "";
  return rule.allowed ? `Allowed by ${text}` : `Denied by ${text}`;
}

function ruleResultLabel(result?: string): string {
  if (result === "not_fired") return "not fired";
  if (result === "not_selected") return "not selected";
  return result || "";
}

function stepTitle(step: LogStep): string {
  switch (step.type) {
    case "in":
      if (step.event) return `EVENT ${eventKey(step.event)}`;
      if (step.query) return `QUERY ${queryKey(step.query)}`;
      return "in";
    case "rule":
      return step.rule || step.rid || "rule";
    case "raise":
      return `raise ${eventKey(step.event)}`;
    case "query_out":
      return `query ${step.rid || ""}/${step.name || ""}`;
    case "klog":
      return step.msg || "klog";
    case "ent":
      return `ent:${step.name || ""}`;
    case "send":
      return `send ${eventKey(step.event)}`;
    case "log":
      return `${(step.level || "log").toUpperCase()} ${step.msg || ""}`.trim();
    case "error":
      return step.error || "error";
    case "done":
      return `done ${step.outcome || ""}`.trim();
    default:
      return step.type;
  }
}

function stepHaystack(step: LogStep): string {
  const bits = [
    step.type,
    step.rid,
    step.name,
    step.rule,
    step.result,
    step.msg,
    step.error,
    step.level,
    eventKey(step.event),
    queryKey(step.query),
    step.eci,
    step.did,
    step.host,
    step.transport,
    step.childTxn,
  ];
  if (step.event?.attrs) bits.push(JSON.stringify(step.event.attrs));
  if (step.query?.args) bits.push(JSON.stringify(step.query.args));
  if (step.val !== undefined) bits.push(JSON.stringify(step.val));
  if (step.before !== undefined) bits.push(JSON.stringify(step.before));
  if (step.after !== undefined) bits.push(JSON.stringify(step.after));
  if (step.directives !== undefined) bits.push(JSON.stringify(step.directives));
  return bits.filter(Boolean).join(" ").toLowerCase();
}

function isTestingBookkeeping(txn: LogTransaction): boolean {
  const incoming = incomingOf(txn);
  const event = incoming?.event;
  if (event?.domain === "engine_ui" && TESTING_EVENTS.includes(event.name)) {
    return true;
  }
  return incoming?.query?.name === "__testing";
}

function txnMatches(txn: LogTransaction, filters: Filters): boolean {
  const steps = (txn.steps || []).filter((step) => stepShown(step, filters));
  if (isLogsQuery(txn)) return false;
  if (!filters.showTesting && isTestingBookkeeping(txn)) return false;
  const queryRid = incomingOf(txn)?.query?.rid;
  if (queryRid && !rulesetShown(filters, queryRid)) return false;
  if (
    filters.errors &&
    txn.outcome !== "error" &&
    !steps.some((step) => step.type === "error")
  ) {
    return false;
  }
  if (filters.klog && !steps.some((step) => step.type === "klog")) {
    return false;
  }
  const ruleset = filters.ruleset.trim().toLowerCase();
  if (
    ruleset &&
    !steps.some((step) =>
      (step.rid || step.query?.rid || "").toLowerCase().includes(ruleset)
    )
  ) {
    return false;
  }
  const event = filters.event.trim().toLowerCase();
  if (event) {
    const incoming = incomingOf(txn);
    const keys = [
      eventKey(incoming?.event),
      queryKey(incoming?.query),
      ...steps.map((step) => eventKey(step.event)),
    ]
      .join(" ")
      .toLowerCase();
    if (!keys.includes(event)) return false;
  }
  const text = filters.text.trim().toLowerCase();
  if (text) {
    const blob = [
      ...steps.map(stepHaystack),
      txn.result !== undefined ? JSON.stringify(txn.result) : "",
      policyLabel(txn.policy),
    ]
      .join(" ")
      .toLowerCase();
    if (!blob.includes(text)) return false;
  }
  return true;
}

function doneDirectives(txn: LogTransaction): unknown {
  return (txn.steps || []).find((step) => step.type === "done")?.directives;
}

function DirectiveList({ value }: { value: unknown }) {
  if (!Array.isArray(value)) return <QueryResult value={value} />;
  return (
    <ul className="mb-0 pl-3">
      {value.map((item, index) => {
        const directive =
          item && typeof item === "object"
            ? (item as {
                name?: string;
                rid?: string;
                rule?: string;
                options?: unknown;
              })
            : {};
        return (
          <li key={index} className="mb-2">
            <div className="text-mono">{directive.name || "directive"}</div>
            {directive.rid ? (
              <div className="small text-muted">
                {directive.rid}
                {directive.rule ? ` · ${directive.rule}` : ""}
              </div>
            ) : null}
            <JsonTree value={directive.options ?? {}} />
          </li>
        );
      })}
    </ul>
  );
}

function QueryResult({ value }: { value: unknown }) {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as { _truncated?: boolean })._truncated === true
  ) {
    const rec = value as { bytes?: number; preview?: string };
    return (
      <div>
        <div className="text-muted small mb-1">
          Result truncated
          {typeof rec.bytes === "number" ? ` (${rec.bytes} bytes)` : ""}.
        </div>
        {rec.preview ? <pre className="small mb-0">{rec.preview}</pre> : null}
      </div>
    );
  }
  return <JsonTree value={value} />;
}

function JsonTree({ value }: { value: unknown }) {
  if (value == null || typeof value !== "object") {
    return <span className="text-mono">{JSON.stringify(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted">[]</span>;
    return (
      <ul className="log-json mb-0">
        {value.map((item, index) => (
          <li key={index}>
            <JsonTree value={item} />
          </li>
        ))}
      </ul>
    );
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-muted">{"{}"}</span>;
  return (
    <ul className="log-json mb-0">
      {entries.map(([key, item]) => (
        <li key={key}>
          <span className="text-mono">{key}</span>
          {item != null && typeof item === "object" ? (
            <JsonTree value={item} />
          ) : (
            <>
              {": "}
              <span className="text-mono">{JSON.stringify(item)}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3">
      <h4 className="h6 text-muted mb-1">{title}</h4>
      {children}
    </section>
  );
}

const LogRow: React.FC<{
  txn: LogTransaction;
  step: LogStep;
  nest?: number;
  selected: boolean;
  onSelect: () => void;
}> = ({ txn, step, nest = 0, selected, onSelect }) => {
  const depth = step.depth || 0;
  const error =
    step.type === "error" ||
    (step.type === "done" && (step.outcome === "error" || txn.outcome === "error"));
  const result = step.type === "rule" ? ruleResultLabel(step.result) : "";
  const names =
    step.type === "in" && step.event?.attrs
      ? Object.keys(step.event.attrs).slice(0, 4)
      : step.type === "raise" && step.event?.attrs
        ? Object.keys(step.event.attrs).slice(0, 4)
        : step.type === "send" && step.event?.attrs
          ? Object.keys(step.event.attrs).slice(0, 4)
          : [];
  return (
    <button
      type="button"
      className={
        "log-row" + (selected ? " log-row-selected" : "") + (error ? " log-row-error" : "")
      }
      style={{ paddingLeft: 8 + nest * 16 + Math.max(0, depth) * 14 }}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="log-row-time text-muted">{clock(step.t || txn.start)}</span>
      <span className="log-row-label text-mono">
        {stepTitle(step)}
        {step.type === "rule" && step.rid ? (
          <span className="log-chip">{step.rid}</span>
        ) : null}
        {step.type === "send" && step.transport ? (
          <span className="log-chip">{step.transport}</span>
        ) : null}
        {names.map((name) => (
          <span className="log-chip" key={name}>
            {name}
          </span>
        ))}
      </span>
      <span className="log-row-aside">
        {result ? (
          <span className={result === "fired" ? "text-success" : "text-muted"}>
            {result}
          </span>
        ) : null}
        {step.type === "ent" && step.deleted ? (
          <span className="text-muted">deleted</span>
        ) : null}
        {step.type === "done" ? (
          <span>
            {txn.kind === "query" ? "" : `${step.fired ?? 0} fired`}
            {txn.kind !== "query" &&
            Array.isArray(step.directives) &&
            step.directives.length
              ? ` ${step.directives.length} directives`
              : ""}
            {typeof txn.durationMs === "number"
              ? `${txn.kind === "query" ? "" : " "}${txn.durationMs}ms`
              : ""}
          </span>
        ) : null}
      </span>
    </button>
  );
};

function Inspector({
  pico,
  txn,
  step,
  channelTags,
  onSelectStep,
}: {
  pico: PicoBox;
  txn: LogTransaction;
  step: LogStep;
  channelTags: string[];
  onSelectStep: (index: number) => void;
}) {
  const incoming = incomingOf(txn);
  const steps = txn.steps || [];
  const sends =
    step.type === "rule"
      ? steps
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) =>
              item.type === "send" &&
              item.rid === step.rid &&
              item.rule === step.rule
          )
      : [];
  const raises =
    step.type === "rule"
      ? steps
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) =>
              item.type === "raise" &&
              item.rid === step.rid &&
              item.rule === step.rule
          )
      : [];
  const klogs =
    step.type === "rule"
      ? steps
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) =>
              item.type === "klog" &&
              item.rid === step.rid &&
              item.rule === step.rule
          )
      : [];
  const ents = steps
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (item.type !== "ent") return false;
      if (step.type === "rule") {
        return item.rid === step.rid && item.rule === step.rule;
      }
      return step.type === "in" || step.type === "done";
    });
  const rules = steps
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.type === "rule");
  const testing =
    step.rid && step.rule
      ? `/pico/${pico.eci}/testing?rid=${encodeURIComponent(step.rid)}&rule=${encodeURIComponent(step.rule)}`
      : step.query?.rid && step.query.name
        ? `/pico/${pico.eci}/testing?rid=${encodeURIComponent(step.query.rid)}&query=${encodeURIComponent(step.query.name)}`
        : incoming?.query?.rid && incoming.query.name
          ? `/pico/${pico.eci}/testing?rid=${encodeURIComponent(incoming.query.rid)}&query=${encodeURIComponent(incoming.query.name)}`
          : "";
  const rulesetRid = step.rid || incoming?.query?.rid || "";

  return (
    <div className="log-inspector">
      <h3 className="h5 mb-1">{stepTitle(step)}</h3>
      <p className="small text-muted mb-3">
        {txn.kind || "transaction"} {txn.txnId}
        {typeof txn.durationMs === "number" ? ` · ${txn.durationMs}ms` : ""}
        {txn.outcome ? ` · ${txn.outcome}` : ""}
        {txn.traceId &&
        (txn.parentTxnId ||
          (txn.steps || []).some((item) => item.type === "query_out"))
          ? ` · trace ${txn.traceId}`
          : ""}
      </p>

      {incoming?.eci || incoming?.event?.eci || incoming?.query?.eci || txn.policy ? (
        <Section title="Channel">
          <div className="text-mono small">
            {incoming?.eci || incoming?.event?.eci || incoming?.query?.eci || txn.policy?.eci}
          </div>
          {channelTags.length ? (
            <div className="mt-1">
              {channelTags.map((tag) => (
                <span className="log-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {txn.policy ? (
            <div className={txn.policy.allowed ? "mt-1" : "mt-1 text-danger"}>
              {policyLabel(txn.policy)}
            </div>
          ) : null}
        </Section>
      ) : null}

      {step.type === "rule" ? (
        <Section title="Rule">
          <div>
            {step.rid} · {step.rule} ·{" "}
            {ruleResultLabel(step.result) || "selected"}
          </div>
          {step.select ? (
            <pre className="mt-2 mb-0 small">{step.select}</pre>
          ) : null}
        </Section>
      ) : null}

      {(step.type === "in" || step.type === "done") && incoming?.query ? (
        <Section title="Query">
          <div className="text-mono mb-2">
            {incoming.query.rid}
            <span className="text-muted"> / </span>
            {incoming.query.name}
          </div>
          <div className="text-muted small mb-1">Arguments</div>
          {Object.keys(incoming.query.args || {}).length === 0 ? (
            <div className="text-muted mb-2">No arguments.</div>
          ) : (
            <div className="mb-2">
              <JsonTree value={incoming.query.args} />
            </div>
          )}
          {txn.result !== undefined ? (
            <>
              <div className="text-muted small mb-1">Result</div>
              <QueryResult value={txn.result} />
            </>
          ) : null}
        </Section>
      ) : null}

      {(step.type === "in" || step.type === "done") &&
      !incoming?.query &&
      doneDirectives(txn) !== undefined ? (
        <Section title="Output">
          <DirectiveList value={doneDirectives(txn)} />
        </Section>
      ) : null}

      {(step.type === "in" || step.type === "done") && !incoming?.query ? (
        <Section title="Rules">
          {rules.length === 0 ? (
            <div className="text-muted">No rules selected.</div>
          ) : (
            <ul className="mb-0 pl-3">
              {rules.map(({ item, index }) => (
                <li key={index}>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 align-baseline"
                    onClick={() => onSelectStep(index)}
                  >
                    {item.rule || item.rid}
                  </button>{" "}
                  <span className="text-muted">
                    {ruleResultLabel(item.result)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      {(step.type === "in" || step.type === "rule" || step.type === "done") &&
      incoming?.event ? (
        <Section title="Input">
          <JsonTree value={incoming.event.attrs || {}} />
        </Section>
      ) : null}

      {step.type === "query_out" ? (
        <Section title="Called">
          <div className="text-mono">
            {step.rid}/{step.name}
          </div>
          {step.eci ? <div className="small text-muted">{step.eci}</div> : null}
          {txn.traceId ? (
            <div className="small text-mono text-muted">trace {txn.traceId}</div>
          ) : null}
        </Section>
      ) : null}

      {step.type === "send" && step.event ? (
        <Section title="Sent">
          <div className="mb-1 text-mono">{eventKey(step.event)}</div>
          <div className="small text-muted mb-2">
            {step.transport || "send"}
            {step.eci ? ` · ${step.eci}` : ""}
            {step.did ? ` · ${step.did}` : ""}
            {step.host ? ` · ${step.host}` : ""}
          </div>
          {step.childTxn ? (
            <div className="small text-mono text-muted mb-2">
              txn {step.childTxn}
            </div>
          ) : null}
          <JsonTree value={step.event.attrs || {}} />
        </Section>
      ) : null}

      {step.type === "raise" && step.event ? (
        <Section title="Raised event">
          <div className="mb-1 text-mono">{eventKey(step.event)}</div>
          <JsonTree value={step.event.attrs || {}} />
        </Section>
      ) : null}

      {step.type === "ent" ? (
        <Section title="State">
          <div className="text-mono mb-2">ent:{step.name}</div>
          <div className="text-muted small mb-1">Before</div>
          <JsonTree value={step.before} />
          <div className="text-muted small mt-2 mb-1">
            {step.deleted ? "Deleted" : "After"}
          </div>
          {step.deleted ? null : <JsonTree value={step.after} />}
        </Section>
      ) : null}

      {ents.length ? (
        <Section title="State">
          <ul className="mb-0 pl-3">
            {ents.map(({ item, index }) => (
              <li key={index}>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 align-baseline"
                  onClick={() => onSelectStep(index)}
                >
                  ent:{item.name}
                </button>
                {item.deleted ? (
                  <span className="text-muted"> deleted</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {step.type === "klog" ? (
        <Section title="klog">
          <div className="mb-1">{step.msg}</div>
          <JsonTree value={step.val} />
        </Section>
      ) : null}

      {klogs.length ? (
        <Section title="klog">
          {klogs.map(({ item, index }) => (
            <div key={index} className="mb-2">
              <button
                type="button"
                className="btn btn-link btn-sm p-0 align-baseline"
                onClick={() => onSelectStep(index)}
              >
                {item.msg || "klog"}
              </button>
              <JsonTree value={item.val} />
            </div>
          ))}
        </Section>
      ) : null}

      {step.type === "log" ? (
        <Section title="Log">
          <div>
            {(step.level || "log").toUpperCase()} {step.msg}
          </div>
        </Section>
      ) : null}

      {step.type === "error" ? (
        <Section title="Error">
          <div className="text-danger">{step.error}</div>
          {step.line != null ? (
            <div className="small text-muted">
              line {step.line}
              {step.column != null ? `:${step.column}` : ""}
              {step.filename ? ` ${step.filename}` : ""}
            </div>
          ) : null}
        </Section>
      ) : null}

      {sends.length ? (
        <Section title="Sent">
          <ul className="mb-0 pl-3">
            {sends.map(({ item, index }) => (
              <li key={index}>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 align-baseline"
                  onClick={() => onSelectStep(index)}
                >
                  {eventKey(item.event)}
                </button>
                {item.transport ? (
                  <span className="text-muted"> {item.transport}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {raises.length ? (
        <Section title="Raised">
          <ul className="mb-0 pl-3">
            {raises.map(({ item, index }) => (
              <li key={index}>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 align-baseline"
                  onClick={() => onSelectStep(index)}
                >
                  {eventKey(item.event)}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {testing || rulesetRid ? (
        <Section title="Actions">
          {testing ? (
            <Link className="btn btn-outline-primary btn-sm mr-2" to={testing}>
              Replay
            </Link>
          ) : null}
          {rulesetRid ? (
            <Link
              className="btn btn-outline-secondary btn-sm"
              to={`/pico/${pico.eci}/rulesets?rid=${encodeURIComponent(rulesetRid)}`}
            >
              Open ruleset
            </Link>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}

function parentInList(txn: LogTransaction, byId: Map<string, LogTransaction>): boolean {
  let id = txn.parentTxnId;
  const seen = new Set<string>();
  while (id && byId.has(id)) {
    if (id === txn.txnId || seen.has(id)) return false;
    seen.add(id);
    id = byId.get(id)?.parentTxnId;
  }
  return !!txn.parentTxnId && byId.has(txn.parentTxnId);
}

function traceChildren(txns: LogTransaction[]): Map<string, LogTransaction[]> {
  const byId = new Map(txns.map((txn) => [txn.txnId, txn]));
  const grouped = new Map<string, LogTransaction[]>();
  for (const txn of txns) {
    if (!parentInList(txn, byId) || !txn.parentTxnId) continue;
    const list = grouped.get(txn.parentTxnId) || [];
    list.push(txn);
    grouped.set(txn.parentTxnId, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  }
  return grouped;
}

function traceRoots(txns: LogTransaction[]): LogTransaction[] {
  const byId = new Map(txns.map((txn) => [txn.txnId, txn]));
  return txns.filter((txn) => !parentInList(txn, byId));
}

const TxnTree: React.FC<{
  txn: LogTransaction;
  grouped: Map<string, LogTransaction[]>;
  filters: Filters;
  nest?: number;
  selected: { txnId: string; index: number } | null;
  onSelect: (txnId: string, index: number) => void;
  seen?: Set<string>;
}> = ({ txn, grouped, filters, nest = 0, selected, onSelect, seen }) => {
  if (seen?.has(txn.txnId)) return null;
  const nextSeen = new Set(seen);
  nextSeen.add(txn.txnId);
  const pending = [...(grouped.get(txn.txnId) || [])];
  const rows: React.ReactNode[] = [];
    (txn.steps || []).forEach((step, index) => {
    if (!stepShown(step, filters)) return;
    if (step.type === "query_out") {
      const key = `${step.rid || ""}/${step.name || ""}`;
      const at = pending.findIndex((child) => {
        const query = incomingOf(child)?.query;
        return !!query && `${query.rid || ""}/${query.name || ""}` === key;
      });
      if (at >= 0) {
        const [child] = pending.splice(at, 1);
        rows.push(
          <TxnTree
            key={child.txnId}
            txn={child}
            grouped={grouped}
            filters={filters}
            nest={nest + 1}
            selected={selected}
            onSelect={onSelect}
            seen={nextSeen}
          />
        );
        return;
      }
    }
    rows.push(
      <LogRow
        key={`${txn.txnId}:${index}`}
        txn={txn}
        step={step}
        nest={nest}
        selected={selected?.txnId === txn.txnId && selected.index === index}
        onSelect={() => onSelect(txn.txnId, index)}
      />
    );
  });
  for (const child of pending) {
    rows.push(
      <TxnTree
        key={child.txnId}
        txn={child}
        grouped={grouped}
        filters={filters}
        nest={nest + 1}
        selected={selected}
        onSelect={onSelect}
        seen={nextSeen}
      />
    );
  }
  return (
    <div className={"log-txn" + (nest > 0 ? " log-txn-nested" : "")}>{rows}</div>
  );
};

interface Props {
  pico: PicoBox;
  isTabActive?: boolean;
}

export default function Logging({ pico, isTabActive = true }: Props) {
  const picoLogs = useAsyncLoader<LogTransaction[]>([], () => getLogs(pico.eci));
  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/pico`)
  );
  const [filters, setFilters] = React.useState<Filters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [live, setLive] = React.useState<LogTransaction[]>([]);
  const [selected, setSelected] = React.useState<{
    txnId: string;
    index: number;
  } | null>(null);

  React.useEffect(() => {
    setLive([]);
  }, [pico.eci]);

  React.useEffect(() => {
    if (isTabActive) {
      picoLogs.load();
      picoDetails.load();
    }
  }, [pico.eci, isTabActive]);

  React.useEffect(() => {
    if (!isTabActive || !filters.live) return;
    const source = new EventSource(
      `/api/picos/${encodeURIComponent(pico.eci)}/logs/live`
    );
    source.onmessage = (event) => {
      let txn: LogTransaction;
      try {
        txn = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!txn || typeof txn.txnId !== "string" || isLogsQuery(txn)) {
        return;
      }
      setLive((prev) => {
        const rest = prev.filter((item) => item.txnId !== txn.txnId);
        return [txn, ...rest].slice(0, 200);
      });
    };
    return () => source.close();
  }, [pico.eci, isTabActive, filters.live]);

  const merged: LogTransaction[] = [];
  const seen = new Set<string>();
  for (const txn of [...live, ...picoLogs.data]) {
    if (seen.has(txn.txnId)) continue;
    seen.add(txn.txnId);
    merged.push(txn);
  }
  const visible = merged.filter((txn) => txnMatches(txn, filters));
  const selectedTxn = selected
    ? merged.find((txn) => txn.txnId === selected.txnId)
    : undefined;
  const selectedRaw = selectedTxn?.steps?.[selected?.index ?? -1];
  const selectedStep =
    selectedRaw && stepShown(selectedRaw, filters) ? selectedRaw : undefined;
  const shownEngine = ENGINE_RULESETS.filter(
    (item) => filters.showRulesets[item.rid]
  );
  const channelId =
    incomingOf(selectedTxn || { txnId: "" })?.eci ||
    incomingOf(selectedTxn || { txnId: "" })?.event?.eci ||
    incomingOf(selectedTxn || { txnId: "" })?.query?.eci ||
    "";
  const channelTags =
    picoDetails.data?.channels.find((channel) => channel.id === channelId)
      ?.tags || [];

  return (
    <div className="pico-logging-tab">
      <TabPageHeader
        title="Logging"
        waiting={picoLogs.waiting}
        onRefresh={() => picoLogs.load()}
        hint="Select a step to inspect it. Filters chooses what is hidden. Refresh reloads the list."
      />
      <ErrorStatus error={picoLogs.error} />
      <div className="log-filters form-row align-items-center mb-2">
        <div className="col-md-6 mb-1">
          <input
            className="form-control form-control-sm"
            placeholder="Search"
            value={filters.text}
            onChange={(e) => setFilters({ ...filters, text: e.target.value })}
          />
        </div>
        <div className="col-auto mb-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>
        </div>
        <div className="col mb-1 small text-muted">
          {shownEngine.length
            ? `Showing ${shownEngine.map((item) => item.label).join(", ")}`
            : "Wrangler, PDS, subscription, and developer UI are hidden"}
          {filters.showTesting ? " · testing" : ""}
          {filters.errors ? " · errors" : ""}
          {filters.klog ? " · klog" : ""}
          {filters.live ? "" : " · live off"}
        </div>
      </div>
      {filtersOpen ? (
        <div
          className="settings-modal-backdrop"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="settings-modal card shadow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-filters-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header d-flex align-items-center justify-content-between">
              <h2 id="log-filters-title" className="h5 mb-0">
                Filters
              </h2>
              <button
                type="button"
                className="close"
                aria-label="Close"
                onClick={() => setFiltersOpen(false)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="card-body">
              <label className="d-block mb-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.live}
                  onChange={(e) =>
                    setFilters({ ...filters, live: e.target.checked })
                  }
                />
                Live
              </label>
              <label className="d-block mb-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.errors}
                  onChange={(e) =>
                    setFilters({ ...filters, errors: e.target.checked })
                  }
                />
                Errors only
              </label>
              <label className="d-block mb-3">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.klog}
                  onChange={(e) =>
                    setFilters({ ...filters, klog: e.target.checked })
                  }
                />
                klog only
              </label>
              <div className="form-group">
                <label className="small text-muted mb-1">Ruleset contains</label>
                <input
                  className="form-control form-control-sm"
                  value={filters.ruleset}
                  onChange={(e) =>
                    setFilters({ ...filters, ruleset: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="small text-muted mb-1">domain:type</label>
                <input
                  className="form-control form-control-sm"
                  value={filters.event}
                  onChange={(e) =>
                    setFilters({ ...filters, event: e.target.value })
                  }
                />
              </div>
              <h3 className="h6 mt-3">Show engine rulesets</h3>
              <p className="small text-muted">
                Hidden rulesets stay out of the log until you check them.
                Their rules inside an event are hidden too.
              </p>
              {ENGINE_RULESETS.map((item) => (
                <label className="d-block mb-2" key={item.rid}>
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={!!filters.showRulesets[item.rid]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        showRulesets: {
                          ...filters.showRulesets,
                          [item.rid]: e.target.checked,
                        },
                      })
                    }
                  />
                  {item.label}
                  <span className="text-muted small"> {item.rid}</span>
                </label>
              ))}
              <label className="d-block mb-0 mt-2">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={filters.showTesting}
                  onChange={(e) =>
                    setFilters({ ...filters, showTesting: e.target.checked })
                  }
                />
                Testing bookkeeping
              </label>
            </div>
          </div>
        </div>
      ) : null}

      <SplitPane
        storageKey="pico-engine-ui-logging-split"
        defaultLeftRatio={0.58}
        left={
          <div>
            {visible.length === 0 && !picoLogs.waiting ? (
              <p className="text-muted mb-0">No matching transactions.</p>
            ) : null}
            {traceRoots(visible).map((txn) => {
              const legacy = Array.isArray(txn.entries) && !txn.steps;
              if (legacy) {
                return (
                  <div key={txn.txnId} className="mb-2">
                    <div className="text-mono small">
                      {txn.time} {txn.header}
                    </div>
                    {txn.entries!.map((entry, index) => (
                      <pre key={index}>{entry}</pre>
                    ))}
                  </div>
                );
              }
              return (
                <TxnTree
                  key={txn.txnId}
                  txn={txn}
                  grouped={traceChildren(visible)}
                  filters={filters}
                  selected={selected}
                  onSelect={(txnId, index) => setSelected({ txnId, index })}
                />
              );
            })}
          </div>
        }
        right={
          selectedTxn && selectedStep ? (
            <Inspector
              pico={pico}
              txn={selectedTxn}
              step={selectedStep}
              channelTags={channelTags}
              onSelectStep={(index) =>
                setSelected({ txnId: selectedTxn.txnId, index })
              }
            />
          ) : (
            <p className="text-muted mb-0">Select a step.</p>
          )
        }
      />
    </div>
  );
}
