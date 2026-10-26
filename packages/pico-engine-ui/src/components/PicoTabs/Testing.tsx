import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../../api";
import { Channel } from "../../types/Channel";
import { PicoBox } from "../../types/PicoBox";
import { PicoDetails, PicoRuleset } from "../../types/PicoDetails";
import { rulesetSchemaToTesting } from "../../rulesetSchemaToTesting";
import { testingFormsFromOperation } from "../../testingFormsFromOperation";
import {
  RulesetSchema,
  RulesetSchemaOperation,
} from "../../types/RulesetSchema";
import { TestingSchema } from "../../types/TestingSchema";
import {
  emitSummaryLine,
  precheckSummaryLine,
} from "../../schemaEmitText";
import useAsyncLoader from "../../useAsyncLoader";
import SchemaEventTryForm from "../schema/SchemaEventTryForm";
import SchemaQueryTryForm from "../schema/SchemaQueryTryForm";
import ErrorStatus from "../widgets/ErrorStatus";
import CopyToClipboardButton from "../widgets/CopyToClipboardButton";
import SplitPane from "../widgets/SplitPane";
import {
  parseTestingTryParams,
  testingEventFormDomId,
  testingOperationDomId,
  testingQueryFormDomId,
} from "../../testingTryParams";
import {
  appendTestingHistory,
  capHistoryResult,
  clearTestingHistory,
  errorFromResultJson,
  loadTestingHistory,
  maskSensitivePayload,
  newHistoryId,
  parseEventWaitResult,
  queryResponseError,
  TestingHistoryEntry,
  TestingRunSpec,
} from "../../testingHistory";
import { runTestingSpec } from "../../testingRunSpec";
import {
  deleteTestingSaved,
  formatAtExampleAnnotation,
  historyEntryToSaved,
  historyToRunSpec,
  loadTestingSaved,
  savedToRunSpec,
  TestingSavedRequest,
  upsertTestingSaved,
} from "../../testingSaved";
import TestingHistoryPanel from "./TestingHistoryPanel";
import TestingSavedPanel from "./TestingSavedPanel";

interface Props {
  pico: PicoBox;
}

function entrySendLabel(op: RulesetSchemaOperation): string {
  const parts = (op.entry || [])
    .filter((e) => e.domain && e.name)
    .map((e) => `${e.domain}:${e.name}`);
  return parts.length ? parts.join(", ") : op.rule;
}

const Testing: React.FC<Props> = ({ pico }) => {
  const [searchParams] = useSearchParams();
  const tryParams = parseTestingTryParams("?" + searchParams.toString());

  const picoDetails = useAsyncLoader<PicoDetails | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/pico`)
  );
  const getTestingECI = useAsyncLoader<string | null>(null, () =>
    apiGet(`/c/${pico.eci}/query/io.picolabs.pico-engine-ui/testingECI`)
  );

  const [testingECI, setTestingECI] = React.useState<string>(pico.eci);
  const [testError, setTestError] = React.useState<string | null>(null);
  const [isTesting, setIsTesting] = React.useState<boolean>(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  const [testingSchema, setTestingSchema] = React.useState<{
    [rid: string]: {
      waiting?: boolean;
      error?: string | null;
      schema?: TestingSchema;
      rulesetSchema?: RulesetSchema | null;
    };
  }>({});

  const [selectedRid, setSelectedRid] = React.useState<string>("");
  const [consoleExpr, setConsoleExpr] = React.useState<string>("");
  const [consoleWaiting, setConsoleWaiting] = React.useState(false);
  const [history, setHistory] = React.useState<TestingHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [saved, setSaved] = React.useState<TestingSavedRequest[]>([]);
  const [savedLoading, setSavedLoading] = React.useState(false);

  async function refreshHistory() {
    setHistoryLoading(true);
    try {
      setHistory(await loadTestingHistory(pico.eci));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function refreshSaved() {
    setSavedLoading(true);
    try {
      setSaved(await loadTestingSaved(pico.eci));
    } catch {
      setSaved([]);
    } finally {
      setSavedLoading(false);
    }
  }

  React.useEffect(() => {
    picoDetails.load();
    getTestingECI.load();
    setTestingSchema({});
    setSelectedRid("");
    refreshHistory();
    refreshSaved();
  }, [pico.eci]);

  React.useEffect(() => {
    const list = picoDetails.data?.rulesets || [];
    if (!list.length) return;
    if (tryParams?.rid && list.some((r) => r.rid === tryParams.rid)) {
      setSelectedRid(tryParams.rid);
      return;
    }
    if (!selectedRid || !list.some((r) => r.rid === selectedRid)) {
      setSelectedRid(list[0].rid);
    }
  }, [picoDetails.data, tryParams?.rid, selectedRid]);

  React.useEffect(() => {
    if (getTestingECI.data) {
      setTestingECI(getTestingECI.data);
    }
  }, [getTestingECI.data]);

  React.useEffect(() => {
    if (!selectedRid) return;
    if (testingSchema[selectedRid] !== undefined) return;
    getTestingSchema(selectedRid);
  }, [selectedRid, pico.eci, testingSchema]);

  React.useEffect(() => {
    if (!tryParams?.rid || tryParams.rid !== selectedRid) return;
    const block = testingSchema[selectedRid];
    if (!block?.rulesetSchema && !block?.schema) return;

    let scrollId: string | null = null;
    if (tryParams.query) {
      scrollId = testingQueryFormDomId(
        tryParams.rid,
        tryParams.query,
        tryParams.example
      );
    } else if (tryParams.rule) {
      const op = block.rulesetSchema?.operations?.find(
        (o) => o.rule === tryParams.rule
      );
      const entry = op?.entry?.find((e) => e.domain && e.name);
      if (entry?.domain && entry.name) {
        scrollId = tryParams.example
          ? testingEventFormDomId({
              rid: tryParams.rid,
              rule: tryParams.rule,
              domain: entry.domain,
              name: entry.name,
              exampleName: tryParams.example,
            })
          : testingOperationDomId(tryParams.rid, tryParams.rule);
      }
    }
    if (!scrollId) return;

    const t = window.setTimeout(() => {
      document.getElementById(scrollId!)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
    return () => window.clearTimeout(t);
  }, [tryParams, testingSchema, selectedRid]);

  async function finishTry(
    meta: TestingRunSpec,
    result: string | null,
    error: string | null
  ) {
    const effectiveError =
      error || errorFromResultJson(result) || null;
    setTestError(effectiveError);
    setTestResult(result);
    setIsTesting(false);

    const payload =
      meta.kind === "console"
        ? undefined
        : maskSensitivePayload(meta.payload);
    const hasPayload =
      payload !== undefined && Object.keys(payload).length > 0;

    let entry: TestingHistoryEntry = {
      id: newHistoryId(),
      time: new Date().toISOString(),
      kind: meta.kind,
      rid: meta.rid,
      label: meta.label,
      domain: meta.domain,
      eventName: meta.eventName,
      queryName: meta.queryName,
      exampleName: meta.exampleName,
      eci: testingECI,
      payload: hasPayload ? payload : undefined,
      ok: !effectiveError,
      error: effectiveError || undefined,
    };
    if (
      !effectiveError &&
      result &&
      (meta.kind === "console" || meta.kind === "query")
    ) {
      entry.result = capHistoryResult(result);
    }
    if (meta.kind === "event" && result && !effectiveError) {
      Object.assign(entry, parseEventWaitResult(result));
    }

    try {
      await appendTestingHistory(pico.eci, meta.rid, entry);
      setHistory((prev) => [entry, ...prev].slice(0, 50));
    } catch (err) {
      console.error(err);
    }
  }

  async function rerunSpec(spec: TestingRunSpec) {
    if (spec.rid !== selectedRid) {
      setSelectedRid(spec.rid);
    }
    if (spec.kind === "console") {
      setConsoleExpr(spec.label);
    }
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);
    const { result, error } = await runTestingSpec(testingECI, spec);
    await finishTry(spec, result, error);
  }

  async function saveHistoryEntry(entry: TestingHistoryEntry) {
    const defaultName =
      entry.exampleName ||
      entry.label.slice(0, 48) ||
      "Saved request";
    const name = window.prompt("Name for saved request", defaultName);
    if (!name?.trim()) return;
    const savedEntry = historyEntryToSaved(entry, name);
    try {
      await upsertTestingSaved(pico.eci, entry.rid, savedEntry);
      setSaved((prev) => [
        savedEntry,
        ...prev.filter((s) => s.id !== savedEntry.id),
      ]);
    } catch (err) {
      window.alert(String(err));
    }
  }

  async function copyAtExample(spec: TestingRunSpec) {
    const defaultName = spec.exampleName || "from testing";
    const name = window.prompt("@example name", defaultName);
    if (!name?.trim()) return;
    const line = formatAtExampleAnnotation(spec, name);
    if (!line) {
      window.alert(
        "Console expressions are not @example annotations. Copy the expression from the label instead."
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(line);
    } catch {
      window.prompt("Copy this line into your ruleset doc comment:", line);
    }
  }

  async function clearHistory(filterRid?: string) {
    const scope = filterRid
      ? `history for ${filterRid}`
      : "all testing history on this pico";
    if (!window.confirm(`Clear ${scope}? Saved requests are kept.`)) {
      return;
    }
    try {
      await clearTestingHistory(pico.eci, filterRid);
      if (filterRid) {
        setHistory((prev) => prev.filter((e) => e.rid !== filterRid));
      } else {
        setHistory([]);
      }
    } catch (err) {
      window.alert(String(err));
    }
  }

  async function deleteSavedEntry(entry: TestingSavedRequest) {
    if (
      !window.confirm(`Delete saved request "${entry.name}"?`)
    ) {
      return;
    }
    try {
      await deleteTestingSaved(pico.eci, entry.rid, entry.id);
      setSaved((prev) => prev.filter((s) => s.id !== entry.id));
    } catch (err) {
      window.alert(String(err));
    }
  }

  async function getTestingSchema(rid: string) {
    setTestingSchema((prev) => ({
      ...prev,
      [rid]: { waiting: true, error: null },
    }));
    try {
      let schema: TestingSchema | null = null;
      let rulesetSchema: RulesetSchema | null = null;
      try {
        const rsSchema = (await apiPost(
          `/c/${pico.eci}/query/io.picolabs.wrangler/rulesetSchema`,
          { rid },
          false
        )) as RulesetSchema | null;
        if (rsSchema && (rsSchema.operations?.length || rsSchema.queries?.length)) {
          rulesetSchema = rsSchema;
          schema = rulesetSchemaToTesting(rsSchema);
        }
      } catch {
        // wrangler missing or rulesetSchema unavailable
      }
      if (!schema) {
        schema = await apiGet(`/c/${pico.eci}/query/${rid}/__testing`);
      }
      setTestingSchema((prev) => ({
        ...prev,
        [rid]: {
          schema: schema || undefined,
          rulesetSchema: rulesetSchema || undefined,
        },
      }));
    } catch (err) {
      setTestingSchema((prev) => ({
        ...prev,
        [rid]: { error: err + "" },
      }));
    }
  }

  const rulesets: PicoRuleset[] = picoDetails.data
    ? picoDetails.data.rulesets
    : [];

  const channels: Channel[] =
    (picoDetails.data &&
      picoDetails.data.channels.filter((channel) => {
        return channel.familyChannelPicoID === null;
      })) ||
    [];

  const testing = selectedRid ? testingSchema[selectedRid] || null : null;

  return (
    <div>
      <SplitPane
        storageKey="pico-engine-ui-testing-split"
        defaultLeftRatio={0.55}
        left={
          <>
          <h3>Testing</h3>
          <div className="mt-3 mb-3">
            <form className="form-inline flex-wrap">
              <label className="mr-2">ECI:</label>
              <select
                className="form-control form-control-sm mr-3 mb-1 text-mono"
                value={testingECI}
                onChange={(e) => {
                  setTestingECI(e.target.value);
                  apiPost(`/c/${pico.eci}/event/engine_ui/testing_eci`, {
                    eci: e.target.value,
                  }).catch(console.error);
                }}
              >
                {channels.map((channel) => {
                  const label =
                    channel.id +
                    " " +
                    channel.tags.map((tag) => `#${tag}`).join(" ");
                  return (
                    <option key={channel.id} value={channel.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <label className="mr-2">Ruleset:</label>
              <select
                className="form-control form-control-sm mb-1 text-mono"
                value={selectedRid}
                onChange={(e) => setSelectedRid(e.target.value)}
              >
                {rulesets.map((rs) => (
                  <option key={rs.rid} value={rs.rid}>
                    {rs.rid}
                  </option>
                ))}
              </select>
            </form>
          </div>

          <div className="border rounded p-2 mb-3 bg-light">
            <h4 className="h6 mb-2">KRL console</h4>
            <p className="small text-muted mb-2">
              Evaluate a read-only expression in the selected ruleset&apos;s
              context (globals, modules, <code>ent:</code> reads).
            </p>
            <form
              className="mb-0"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedRid.trim() || !consoleExpr.trim()) return;
                setConsoleWaiting(true);
                setIsTesting(true);
                setTestError(null);
                setTestResult(null);
                const expr = consoleExpr.trim();
                try {
                  const data = await apiPost(
                    `/c/${testingECI}/query/${selectedRid}/__consoleEval`,
                    { expr },
                    false
                  );
                  const text = JSON.stringify(data, undefined, 2);
                  await finishTry(
                    {
                      kind: "console",
                      rid: selectedRid,
                      label: expr,
                    },
                    text,
                    queryResponseError(data)
                  );
                } catch (err) {
                  await finishTry(
                    {
                      kind: "console",
                      rid: selectedRid,
                      label: expr,
                    },
                    null,
                    String(err)
                  );
                } finally {
                  setConsoleWaiting(false);
                }
              }}
            >
              <textarea
                className="form-control form-control-sm text-mono mb-2"
                rows={3}
                placeholder='e.g. ent:settings or wrangler:pico()'
                value={consoleExpr}
                onChange={(ev) => setConsoleExpr(ev.target.value)}
              />
              <button
                type="submit"
                className="btn btn-sm btn-secondary"
                disabled={
                  consoleWaiting || !selectedRid || !consoleExpr.trim()
                }
              >
                {consoleWaiting ? "Evaluating…" : "Evaluate"}
              </button>
            </form>
          </div>

          {selectedRid ? (
            <div className="mb-3">
              <ErrorStatus error={testing?.error} />
              {testing?.schema || testing?.rulesetSchema ? (
                <div>
                  {(testing.schema?.queries || []).map((q, qi) => {
                    const qMeta = testing.rulesetSchema?.queries?.find(
                      (x) => x.name === q.name
                    );
                    const formKey = q.exampleName
                      ? `${q.name}:${q.exampleName}`
                      : q.name;
                    return (
                      <SchemaQueryTryForm
                        key={formKey + qi}
                        rid={selectedRid}
                        name={q.name}
                        args={q.args}
                        defaults={q.defaults}
                        exampleName={q.exampleName}
                        argMeta={qMeta?.args}
                        testingEci={testingECI}
                        exampleAsPlaceholder
                        formId={testingQueryFormDomId(
                          selectedRid,
                          q.name,
                          q.exampleName
                        )}
                        onResult={(result, error, payload) => {
                          if (result !== null || error !== null) {
                            void finishTry(
                              {
                                kind: "query",
                                rid: selectedRid,
                                label: q.exampleName
                                  ? `${q.name} (${q.exampleName})`
                                  : q.name,
                                queryName: q.name,
                                exampleName: q.exampleName,
                                payload,
                              },
                              result,
                              error ||
                                (result
                                  ? errorFromResultJson(result)
                                  : null)
                            );
                          } else {
                            setIsTesting(true);
                            setTestError(null);
                            setTestResult(null);
                          }
                        }}
                      />
                    );
                  })}
                  {testing.rulesetSchema?.operations?.length
                    ? testing.rulesetSchema.operations.map((op) => {
                        const opEvents =
                          testingFormsFromOperation(op).events || [];
                        return (
                          <div
                            key={op.rule}
                            id={testingOperationDomId(selectedRid, op.rule)}
                            className="border border-secondary p-2 mb-2"
                          >
                            <div>
                              <strong>{entrySendLabel(op)}</strong>
                              <span className="text-muted small">
                                {" "}
                                ({op.rule})
                              </span>
                            </div>
                            {op.description ? (
                              <div className="small text-muted mb-1">
                                {op.description}
                              </div>
                            ) : null}
                            {op.prechecks && op.prechecks.length > 0 ? (
                              <div className="small mb-1">
                                Check first:{" "}
                                {op.prechecks.map((p, i) => (
                                  <span key={i}>
                                    {i > 0 ? "; " : ""}
                                    <code>
                                      {precheckSummaryLine(
                                        p as Record<string, unknown>
                                      )}
                                    </code>
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            {op.condition ? (
                              <div className="small mb-1">
                                Acts when:{" "}
                                <code className="text-mono">{op.condition}</code>
                              </div>
                            ) : null}
                            {op.select ? (
                              <details className="small mb-1">
                                <summary>Select expression</summary>
                                <pre className="small mb-0 text-mono">
                                  {op.select}
                                </pre>
                              </details>
                            ) : null}
                            {op.emits && op.emits.length > 0 ? (
                              <details className="small mb-1">
                                <summary>
                                  May emit (possible, not guaranteed)
                                </summary>
                                <ul className="mb-0 pl-3">
                                  {op.emits.map((em, i) => (
                                    <li key={i}>
                                      {emitSummaryLine(
                                        em as Record<string, unknown>,
                                        op.condition
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : null}
                            {op.alsoSelectedBy &&
                            op.alsoSelectedBy.length > 0 ? (
                              <details className="small mb-1">
                                <summary>
                                  Also selected by {op.alsoSelectedBy.length}{" "}
                                  rule(s)
                                </summary>
                                <ul className="mb-0 pl-3">
                                  {op.alsoSelectedBy.map((peer) => (
                                    <li key={peer.rule}>
                                      <code>{peer.rule}</code>
                                      {peer.condition ? (
                                        <span>
                                          {" "}
                                          — <code>{peer.condition}</code>
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : null}
                            {opEvents.map((e, i) => {
                              const doname = `${e.domain}:${e.name}`;
                              const formKey = e.exampleName
                                ? `${doname}:${e.exampleName}`
                                : doname;
                              return (
                                <SchemaEventTryForm
                                  key={formKey + i}
                                  domain={e.domain}
                                  name={e.name}
                                  attrs={e.attrs}
                                  defaults={e.defaults}
                                  exampleName={e.exampleName}
                                  attrMeta={op.attrs}
                                  testingEci={testingECI}
                                  exampleAsPlaceholder
                                  formId={testingEventFormDomId({
                                    rid: selectedRid,
                                    rule: op.rule,
                                    domain: e.domain,
                                    name: e.name,
                                    exampleName: e.exampleName,
                                  })}
                                  onResult={(result, error, payload) => {
                                    if (result !== null || error !== null) {
                                      void finishTry(
                                        {
                                          kind: "event",
                                          rid: selectedRid,
                                          label: e.exampleName
                                            ? `${doname} (${e.exampleName})`
                                            : doname,
                                          domain: e.domain,
                                          eventName: e.name,
                                          exampleName: e.exampleName,
                                          payload,
                                        },
                                        result,
                                        error
                                      );
                                    } else {
                                      setIsTesting(true);
                                      setTestError(null);
                                      setTestResult(null);
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        );
                      })
                    : (testing.schema?.events || []).map((e, i) => {
                        const doname = `${e.domain}:${e.name}`;
                        const formKey = e.exampleName
                          ? `${doname}:${e.exampleName}`
                          : doname;
                        return (
                          <SchemaEventTryForm
                            key={formKey + i}
                            domain={e.domain}
                            name={e.name}
                            attrs={e.attrs}
                            defaults={e.defaults}
                            exampleName={e.exampleName}
                            testingEci={testingECI}
                            exampleAsPlaceholder
                            className="border border-warning p-2 mb-2"
                            onResult={(result, error, payload) => {
                              if (result !== null || error !== null) {
                                void finishTry(
                                  {
                                    kind: "event",
                                    rid: selectedRid,
                                    label: e.exampleName
                                      ? `${doname} (${e.exampleName})`
                                      : doname,
                                    domain: e.domain,
                                    eventName: e.name,
                                    exampleName: e.exampleName,
                                    payload,
                                  },
                                  result,
                                  error
                                );
                              } else {
                                setIsTesting(true);
                                setTestError(null);
                                setTestResult(null);
                              }
                            }}
                          />
                        );
                      })}
                </div>
              ) : testing?.waiting ? (
                <div className="text-muted small">Loading testing forms…</div>
              ) : (
                <div className="text-muted small">
                  No testing forms for this ruleset (no annotations and no
                  __testing).
                </div>
              )}
            </div>
          ) : null}
          </>
        }
        right={
          <>
          <div className="float-right">
            <span className="text-muted">Legend:</span>
            <span className="badge badge-primary ml-1">query</span>
            <span className="badge badge-warning ml-1">event</span>
            <span className="badge badge-secondary ml-1">console</span>
          </div>
          <h3>Results</h3>

          <ErrorStatus error={testError} />

          {isTesting ? (
            "Testing..."
          ) : testResult ? (
            <div className="d-flex align-items-start">
              <pre className="flex-grow-1 mb-0">{testResult}</pre>
              <CopyToClipboardButton text={testResult} className="ml-2 mt-1" />
            </div>
          ) : (
            ""
          )}

          <TestingSavedPanel
            entries={saved}
            loading={savedLoading}
            filterRid={selectedRid || undefined}
            onRerun={(e) => void rerunSpec(savedToRunSpec(e))}
            onCopyExample={(e) => void copyAtExample(savedToRunSpec(e))}
            onDelete={(e) => void deleteSavedEntry(e)}
          />

          <TestingHistoryPanel
            entries={history}
            loading={historyLoading}
            filterRid={selectedRid || undefined}
            onSave={(e) => void saveHistoryEntry(e)}
            onRerun={(e) => void rerunSpec(historyToRunSpec(e))}
            onCopyExample={(e) => void copyAtExample(historyToRunSpec(e))}
            onClear={(rid) => void clearHistory(rid)}
          />
          </>
        }
      />
    </div>
  );
};

export default Testing;
