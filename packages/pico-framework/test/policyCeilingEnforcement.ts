/**
 * Engine enforcement: newChannel / putChannel / newPico vs pico policy ceiling.
 */

import test from "ava";
import { PicoFramework } from "../src/PicoFramework";
import { PolicyCeiling } from "../src/policyCeiling";
import { Ruleset, RulesetInstance } from "../src/Ruleset";
import { mkdb } from "./helpers/mkdb";

const noopRs: Ruleset = {
  rid: "test.noop",
  init(): RulesetInstance {
    return {};
  },
};

function makePf(defaultRootPolicyCeiling?: PolicyCeiling) {
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: () => noopRs,
    autoCreateRootPico: false,
    defaultRootPolicyCeiling,
  });
  return pf;
}

const narrowCeiling: PolicyCeiling = {
  eventPolicy: {
    allow: [{ domain: "manifold", name: "*" }],
    deny: [],
  },
  queryPolicy: {
    allow: [{ rid: "io.picolabs.manifold_pico", name: "*" }],
    deny: [],
  },
};

test("newChannel rejects event policy above ceiling", async (t) => {
  const pf = makePf(narrowCeiling);
  await pf.start();
  const root = await pf.createRootPico();

  await t.throwsAsync(
    () =>
      root.newChannel({
        tags: ["wide"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: {
          allow: [{ rid: "io.picolabs.manifold_pico", name: "getThings" }],
          deny: [],
        },
      }),
    { message: /event policy exceeds pico policy ceiling/i },
  );

  await pf.db.close();
});

test("newChannel accepts policy within ceiling", async (t) => {
  const pf = makePf(narrowCeiling);
  await pf.start();
  const root = await pf.createRootPico();

  const ch = await root.newChannel({
    tags: ["app"],
    eventPolicy: {
      allow: [{ domain: "manifold", name: "create_thing" }],
      deny: [],
    },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.manifold_pico", name: "getThings" }],
      deny: [],
    },
  });
  t.truthy(ch.id);

  await pf.db.close();
});

test("putChannel rejects widening above ceiling", async (t) => {
  const pf = makePf(narrowCeiling);
  await pf.start();
  const root = await pf.createRootPico();

  const ch = await root.newChannel({
    tags: ["app"],
    eventPolicy: {
      allow: [{ domain: "manifold", name: "create_thing" }],
      deny: [],
    },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.manifold_pico", name: "getThings" }],
      deny: [],
    },
  });

  await t.throwsAsync(
    () =>
      root.putChannel(ch.id, {
        tags: ["app"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: {
          allow: [{ rid: "io.picolabs.manifold_pico", name: "getThings" }],
          deny: [],
        },
      }),
    { message: /event policy exceeds pico policy ceiling/i },
  );

  await pf.db.close();
});

test("child inherits parent ceiling and cannot mint wide channels", async (t) => {
  const pf = makePf(narrowCeiling);
  await pf.start();
  const root = await pf.createRootPico();
  const childEci = await root.newPico();
  const { pico: child } = pf.lookupChannel(childEci);

  t.true(child.policyCeiling != null);
  await t.throwsAsync(
    () =>
      child.newChannel({
        tags: ["leak"],
        eventPolicy: { allow: [{ domain: "wrangler", name: "*" }], deny: [] },
        queryPolicy: {
          allow: [{ rid: "io.picolabs.manifold_pico", name: "getThings" }],
          deny: [],
        },
      }),
    { message: /event policy exceeds pico policy ceiling/i },
  );

  await pf.db.close();
});

test("newPico rejects child ceiling broader than parent", async (t) => {
  const pf = makePf(narrowCeiling);
  await pf.start();
  const root = await pf.createRootPico();

  await t.throwsAsync(
    () =>
      root.newPico({
        policyCeiling: {
          eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
          queryPolicy: {
            allow: [{ rid: "*", name: "*" }],
            deny: [],
          },
        },
      }),
    { message: /Policy ceiling exceeds parent/i },
  );

  await pf.db.close();
});

test("platform-tagged channels skip ceiling (didcomm ingress shape)", async (t) => {
  const pf = makePf(narrowCeiling);
  await pf.start();
  const root = await pf.createRootPico();

  const ingress = await root.newChannel({
    tags: ["didcomm", "ingress"],
    eventPolicy: {
      allow: [{ domain: "dido", name: "didcomm_message" }],
      deny: [],
    },
    queryPolicy: { allow: [], deny: [{ rid: "*", name: "*" }] },
  });
  t.truthy(ingress.id);

  await pf.db.close();
});

test("global event deny applies after channel allows", async (t) => {
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: () => noopRs,
    autoCreateRootPico: false,
    globalEventDeny: [{ domain: "blocked", name: "noop" }],
  });
  await pf.start();
  const root = await pf.createRootPico();
  const ch = await root.newChannel({
    tags: ["t"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await t.throwsAsync(
    () =>
      pf.event({
        eci: ch.id,
        domain: "blocked",
        name: "noop",
        data: { attrs: {} },
        time: 0,
      }),
    { message: /Denied by channel policy/ },
  );

  await pf.db.close();
});
