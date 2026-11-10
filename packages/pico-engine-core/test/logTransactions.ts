import test from "ava";
import {
  assembleLogTransactions,
  LogTransaction,
  RawLogEntry,
} from "../src/logTransactions";

const krlCompiler = require("krl-compiler");

function ev(
  partial: RawLogEntry & { msg: string; txnId?: string }
): RawLogEntry {
  return {
    level: "debug",
    time: "2026-11-09T18:00:00.000Z",
    txnId: "t1",
    ...partial,
  };
}

function event(domain: string, name: string, attrs: Record<string, unknown> = {}) {
  return {
    eci: "eci1",
    domain,
    name,
    data: { attrs },
  };
}

function byType(txn: LogTransaction, type: string) {
  return txn.steps.filter((step) => step.type === type);
}

test("assembles an event, rules, and duration; newest transaction first", (t) => {
  const txns = assembleLogTransactions([
    ev({
      txnId: "t0",
      time: "2026-11-09T17:00:00.000Z",
      msg: "txnQueued",
      txn: { kind: "query", query: { eci: "eci1", rid: "io.picolabs.wrangler", name: "name", args: { _headers: { a: 1 } } } },
    }),
    ev({ txnId: "t0", time: "2026-11-09T17:00:00.005Z", msg: "txnStart" }),
    ev({ txnId: "t0", time: "2026-11-09T17:00:00.008Z", msg: "txnDone" }),
    ev({
      time: "2026-11-09T18:00:00.000Z",
      msg: "txnQueued",
      txn: { kind: "event", event: event("engine_ui", "setup", { _headers: { host: "h" }, ok: 1 }) },
    }),
    ev({ time: "2026-11-09T18:00:00.010Z", msg: "txnStart" }),
    ev({
      time: "2026-11-09T18:00:00.011Z",
      msg: "event added to schedule",
      rid: "io.picolabs.pds",
      event: event("engine_ui", "setup", { ok: 1 }),
    }),
    ev({
      time: "2026-11-09T18:00:00.012Z",
      msg: "event added to schedule",
      rid: "io.picolabs.wrangler",
      event: event("engine_ui", "setup", { ok: 1 }),
    }),
    ev({
      time: "2026-11-09T18:00:00.020Z",
      msg: "rule selected",
      rid: "io.picolabs.wrangler",
      rule_name: "ensure_discovery_channel_on_setup",
    }),
    ev({
      time: "2026-11-09T18:00:00.030Z",
      msg: "not fired",
      rid: "io.picolabs.wrangler",
    }),
    ev({ time: "2026-11-09T18:00:00.040Z", msg: "txnDone" }),
  ]);

  t.is(txns.length, 2);
  t.is(txns[0].txnId, "t1");
  t.is(txns[0].kind, "event");
  t.is(txns[0].outcome, "ok");
  t.is(txns[0].durationMs, 30);
  const incoming = txns[0].steps[0];
  t.is(incoming.type, "in");
  if (incoming.type === "in") {
    t.is(incoming.event?.domain, "engine_ui");
    t.deepEqual(incoming.event?.attrs, { ok: 1 });
  }
  t.is(byType(txns[0], "raise").length, 0);
  const rule = byType(txns[0], "rule")[0];
  t.is(rule.type, "rule");
  if (rule.type === "rule") {
    t.is(rule.rule, "ensure_discovery_channel_on_setup");
    t.is(rule.result, "not_fired");
    t.is(rule.depth, 1);
  }
  const done = txns[0].steps[txns[0].steps.length - 1];
  t.is(done.type, "done");
  if (done.type === "done") t.is(done.fired, 0);

  t.is(txns[1].kind, "query");
  const q = txns[1].steps[0];
  if (q.type === "in") t.deepEqual(q.query?.args, {});
});

test("a query transaction keeps the return value from txnDone", (t) => {
  const txns = assembleLogTransactions([
    ev({
      msg: "txnQueued",
      txn: {
        kind: "query",
        query: {
          eci: "eci1",
          rid: "com.example.temperature_sensors_view",
          name: "latestReadingsForView",
          args: {},
        },
      },
    }),
    ev({ msg: "txnStart", time: "2026-11-09T18:00:00.001Z" }),
    ev({
      msg: "txnDone",
      time: "2026-11-09T18:00:00.009Z",
      result: [{ sensor: "Beehive" }],
    }),
  ]);
  t.is(txns[0].kind, "query");
  t.is(txns[0].durationMs, 8);
  t.deepEqual(txns[0].result, [{ sensor: "Beehive" }]);
  const done = txns[0].steps[txns[0].steps.length - 1];
  t.is(done.type, "done");
  if (done.type === "done") t.is(done.fired, 0);
});

test("a same-engine call keeps the caller's trace and records the call", (t) => {
  const txns = assembleLogTransactions([
    ev({
      msg: "txnQueued",
      txn: {
        kind: "query",
        query: {
          eci: "view",
          rid: "com.example.temperature_sensors_view",
          name: "latestReadingsForView",
          args: {},
        },
      },
    }),
    ev({ msg: "txnStart", time: "2026-11-09T18:00:00.001Z" }),
    ev({
      msg: "query out",
      time: "2026-11-09T18:00:00.002Z",
      targetEci: "data",
      targetRid: "com.example.temperature_sensors",
      targetName: "latestReadings",
    }),
    ev({ msg: "txnDone", time: "2026-11-09T18:00:00.009Z", result: [] }),
    ev({
      txnId: "child",
      time: "2026-11-09T18:00:00.003Z",
      msg: "txnQueued",
      txn: {
        kind: "query",
        query: {
          eci: "data",
          rid: "com.example.temperature_sensors",
          name: "latestReadings",
          args: { __eid: "t1", __parent_txn: "t1", limit: 1 },
        },
      },
    }),
    ev({ txnId: "child", time: "2026-11-09T18:00:00.004Z", msg: "txnStart" }),
    ev({ txnId: "child", time: "2026-11-09T18:00:00.008Z", msg: "txnDone" }),
  ]);
  const parent = txns.find((txn) => txn.txnId === "t1");
  const child = txns.find((txn) => txn.txnId === "child");
  t.truthy(parent);
  t.truthy(child);
  t.is(parent?.traceId, "t1");
  t.is(child?.traceId, "t1");
  t.is(child?.parentTxnId, "t1");
  const called = parent?.steps.find((step) => step.type === "query_out");
  t.is(called?.type, "query_out");
  if (called?.type === "query_out") {
    t.is(called.rid, "com.example.temperature_sensors");
    t.is(called.name, "latestReadings");
  }
  const incoming = child?.steps[0];
  if (incoming?.type === "in") {
    t.deepEqual(incoming.query?.args, { limit: 1 });
  }
});

test("nests a raised event under the rule that raised it", (t) => {
  const read = event("sensor", "read");
  const decoded = event("sensor", "decoded", { id: "a" });
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: read } }),
    ev({ msg: "txnStart" }),
    ev({ msg: "event added to schedule", rid: "A", event: read }),
    ev({ msg: "event added to schedule", rid: "B", event: read }),
    ev({ msg: "rule selected", rid: "A", rule_name: "decode" }),
    ev({ msg: "event added to schedule", rid: "A", event: decoded }),
    ev({ msg: "event added to schedule", rid: "B", event: decoded }),
    ev({ msg: "fired", rid: "A", rule_name: "decode" }),
    ev({ msg: "rule selected", rid: "B", rule_name: "store" }),
    ev({ msg: "not fired", rid: "B", rule_name: "store" }),
    ev({ msg: "rule selected", rid: "A", rule_name: "check" }),
    ev({ level: "klog", msg: "decoded", rid: "A", val: { n: 1 } }),
    ev({ msg: "fired", rid: "A", rule_name: "check" }),
    ev({ msg: "rule selected", rid: "B", rule_name: "alert" }),
    ev({ msg: "fired", rid: "B" }),
    ev({ level: "info", msg: "hello info", rid: "B" }),
    ev({ msg: "txnDone" }),
  ]);

  const steps = txns[0].steps.map((step) => {
    if (step.type === "rule") return `rule:${step.rule}:${step.result}:${step.depth}`;
    if (step.type === "raise") return `raise:${step.event.domain}:${step.event.name}:${step.depth}:${step.rule}`;
    if (step.type === "klog") return `klog:${step.msg}:${step.rule}:${step.depth}`;
    if (step.type === "log") return `log:${step.msg}:${step.depth}`;
    return step.type;
  });
  t.deepEqual(steps, [
    "in",
    "rule:decode:fired:1",
    "raise:sensor:decoded:1:decode",
    "rule:store:not_fired:1",
    "rule:check:fired:2",
    "klog:decoded:check:2",
    "rule:alert:fired:2",
    "log:hello info:2",
    "done",
  ]);
  const done = txns[0].steps[txns[0].steps.length - 1];
  if (done.type === "done") t.is(done.fired, 3);
});

test("a raise that selects no rules is still a step, and errors close the transaction", (t) => {
  const read = event("sensor", "read");
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: read } }),
    ev({ msg: "txnStart" }),
    ev({ msg: "event added to schedule", rid: "A", event: read }),
    ev({ msg: "rule selected", rid: "A", rule_name: "decode" }),
    ev({ msg: "event added to schedule", rid: "A", event: event("sensor", "decoded") }),
    ev({ msg: "fired", rid: "A", rule_name: "decode" }),
    ev({
      level: "error",
      msg: "txnError",
      error: "Error: boom",
      line: 12,
      column: 4,
    }),
  ]);
  const types = txns[0].steps.map((step) => step.type);
  t.deepEqual(types, ["in", "rule", "raise", "error", "done"]);
  t.is(txns[0].outcome, "error");
  const err = txns[0].steps[3];
  if (err.type === "error") {
    t.is(err.error, "Error: boom");
    t.is(err.line, 12);
  }
});

test("a rule that was not selected is a row before the first raise", (t) => {
  const read = event("sensor", "read");
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: read } }),
    ev({ msg: "txnStart" }),
    ev({ msg: "rule selected", rid: "A", rule_name: "decode" }),
    ev({ msg: "fired", rid: "A", rule_name: "decode" }),
    ev({
      msg: "event added to schedule",
      rid: "A",
      event: event("sensor", "decoded"),
    }),
    ev({
      msg: "txnDone",
      ruleOutcomes: [
        { rid: "A", rule: "decode", status: "fired" },
        {
          rid: "A",
          rule: "ignore",
          status: "not_selected",
          select: 'select when sensor read',
        },
      ],
    }),
  ]);
  const rules = txns[0].steps.filter((step) => step.type === "rule");
  t.is(rules.length, 2);
  const skipped = rules[1];
  if (skipped.type === "rule") {
    t.is(skipped.rule, "ignore");
    t.is(skipped.result, "not_selected");
    t.is(skipped.select, "select when sensor read");
    t.is(skipped.depth, 1);
  }
  const raiseAt = txns[0].steps.findIndex((step) => step.type === "raise");
  const skippedAt = txns[0].steps.findIndex(
    (step) => step.type === "rule" && step.rule === "ignore"
  );
  t.true(skippedAt > 0 && skippedAt < raiseAt);
});

test("an event keeps the directives it returned", (t) => {
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: event("echo", "hello") } }),
    ev({ msg: "txnStart" }),
    ev({
      msg: "txnDone",
      directives: [{ name: "hi", options: { n: 1 }, rid: "A", rule: "hello" }],
    }),
  ]);
  const done = txns[0].steps.find((step) => step.type === "done");
  t.is(done?.type, "done");
  if (done?.type === "done") {
    t.deepEqual(done.directives, [
      { name: "hi", options: { n: 1 }, rid: "A", rule: "hello" },
    ]);
  }
});

test("a local send records the target and the child transaction", (t) => {
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: event("sensor", "read") } }),
    ev({ msg: "rule selected", rid: "A", rule_name: "forward" }),
    ev({
      msg: "send",
      rid: "A",
      rule_name: "forward",
      transport: "local",
      targetEci: "child-eci",
      childTxn: "child-txn",
      event: event("sensor", "decoded", { _headers: { host: "h" }, id: "a" }),
    }),
    ev({ msg: "fired", rid: "A", rule_name: "forward" }),
    ev({ msg: "txnDone" }),
  ]);
  const sent = txns[0].steps.find((step) => step.type === "send");
  t.is(sent?.type, "send");
  if (sent?.type === "send") {
    t.is(sent.transport, "local");
    t.is(sent.eci, "child-eci");
    t.is(sent.childTxn, "child-txn");
    t.is(sent.event.domain, "sensor");
    t.is(sent.event.name, "decoded");
    t.deepEqual(sent.event.attrs, { id: "a" });
    t.is(sent.rule, "forward");
  }
});

test("an entity write is a step with the value before and after", (t) => {
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: event("sensor", "read") } }),
    ev({ msg: "rule selected", rid: "A", rule_name: "store" }),
    ev({
      msg: "ent write",
      rid: "A",
      rule_name: "store",
      name: "readings",
      before: null,
      after: { n: 1 },
    }),
    ev({ msg: "fired", rid: "A", rule_name: "store" }),
    ev({ msg: "txnDone" }),
  ]);
  const write = txns[0].steps.find((step) => step.type === "ent");
  t.is(write?.type, "ent");
  if (write?.type === "ent") {
    t.is(write.name, "readings");
    t.is(write.rule, "store");
    t.deepEqual(write.before, null);
    t.deepEqual(write.after, { n: 1 });
  }
});

test("a policy decision stays on the transaction", (t) => {
  const read = event("sensor", "read");
  const txns = assembleLogTransactions([
    ev({ msg: "txnQueued", txn: { kind: "event", event: read } }),
    ev({
      msg: "policy decision",
      eci: "eci1",
      allowed: false,
      rule: { domain: "sensor", name: "*" },
    }),
    ev({ msg: "txnError", error: "Denied by channel policy" }),
  ]);
  t.is(txns[0].outcome, "error");
  t.deepEqual(txns[0].policy, {
    eci: "eci1",
    allowed: false,
    rule: { domain: "sensor", name: "*" },
  });
  t.false(txns[0].steps.some((step) => step.type === "log"));
});

test("fired and not fired log the rule name", (t) => {
  const out = krlCompiler(`ruleset com.example.log_rule_name {
  meta { name "log rule name" }
  rule hello {
    select when echo hello
    send_directive("hi")
  }
}`);
  t.regex(out.code, /\$ctx\.log\.debug\("fired",\s*\{\s*"rule_name": "hello"\s*\}\)/);
  t.regex(out.code, /\$ctx\.log\.debug\("not fired",\s*\{\s*"rule_name": "hello"\s*\}\)/);
});
