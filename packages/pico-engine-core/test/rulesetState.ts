/**
 * Integration tests — ctx:exportRulesetState / ctx:importRulesetState (Phase A).
 */

import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import { PicoEngineCore } from "../src/PicoEngineCore";
import { RulesetRegistryLoaderMem } from "../src/RulesetRegistryLoaderMem";
import { importRulesetState as importRulesetStateImpl } from "../src/rulesetState";
import {
  openRulesetState,
  sealRulesetState,
  type RulesetStateEnvelope,
  type RulesetStatePayload,
} from "../src/rulesetStateCrypto";
import { allowAllChannelConf } from "./helpers/allowAllChannelConf";
import { mkSignalBase } from "./helpers/mkSignalBase";
import { mkdb } from "./helpers/mkdb";

const STATE_KRL = `ruleset state_test {
  meta {
    shares getCounter, exportState, importState, exportRid, getRulesetConfig
  }
  global {
    getCounter = function() { ent:counter }
    exportState = function(secret) {
      ctx:exportRulesetState("state_test", secret)
    }
    exportRid = function(rid, secret) {
      ctx:exportRulesetState(rid, secret)
    }
    importState = function(blob, secret) {
      ctx:importRulesetState(blob, secret)
    }
    getRulesetConfig = function() {
      ctx:rulesets.filter(function(r){ r["rid"] == "state_test" })[0]["config"]
    }
  }
  rule set {
    select when state_test:set
    always {
      ent:counter := event:attrs{"value"}
    }
  }
}`;

function samplePayload(
  overrides: Partial<RulesetStatePayload> = {}
): RulesetStatePayload {
  return {
    version: 1,
    rid: "state_test",
    url: "mem://state_test",
    config: { tier: "gold" },
    ent: { counter: 42, note: "hello" },
    exportedAt: new Date().toISOString(),
    ...overrides,
  };
}

test("ruleset state crypto roundtrip and wrong secret fails", (t) => {
  const payload = samplePayload();
  const blob = sealRulesetState(payload, "s3cret");
  t.deepEqual(openRulesetState(blob, "s3cret"), payload);
  t.throws(() => openRulesetState(blob, "wrong"), {
    message: /decryption failed/i,
  });
});

test("seal and open reject empty secret", (t) => {
  const payload = samplePayload();
  t.throws(() => sealRulesetState(payload, ""), {
    message: /non-empty string/i,
  });
  const blob = sealRulesetState(payload, "ok");
  t.throws(() => openRulesetState(blob, ""), {
    message: /non-empty string/i,
  });
});

test("open rejects invalid JSON blob", (t) => {
  t.throws(() => openRulesetState("not-json", "secret"), {
    message: /invalid portable state blob/i,
  });
});

test("open rejects unsupported envelope version", (t) => {
  const blob = sealRulesetState(samplePayload(), "secret");
  const parsed = JSON.parse(blob) as RulesetStateEnvelope;
  const tampered = { ...parsed, v: 99 as unknown as 1 };
  t.throws(() => openRulesetState(JSON.stringify(tampered), "secret"), {
    message: /unsupported portable state version/i,
  });
});

test("open rejects tampered ciphertext", (t) => {
  const blob = sealRulesetState(samplePayload(), "secret");
  const envelope = JSON.parse(blob) as RulesetStateEnvelope;
  const data = Buffer.from(envelope.data, "base64");
  data[0] ^= 0xff;
  const tampered = { ...envelope, data: data.toString("base64") };
  t.throws(() => openRulesetState(JSON.stringify(tampered), "secret"), {
    message: /decryption failed/i,
  });
});

test("open rejects tampered auth tag", (t) => {
  const blob = sealRulesetState(samplePayload(), "secret");
  const envelope = JSON.parse(blob) as RulesetStateEnvelope;
  const tag = Buffer.from(envelope.tag, "base64");
  tag[0] ^= 0xff;
  const tampered = { ...envelope, tag: tag.toString("base64") };
  t.throws(() => openRulesetState(JSON.stringify(tampered), "secret"), {
    message: /decryption failed/i,
  });
});

async function mkStateCore() {
  const krlUrls: Record<string, string> = {
    "mem://state_test": STATE_KRL,
  };
  const core = new PicoEngineCore({
    db: mkdb(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => krlUrls[url]),
    log: makeKrlLogger(() => null),
    async getPicoLogs() {
      return [];
    },
  });
  await core.start();
  return core;
}

async function installStateTest(
  core: PicoEngineCore,
  config: Record<string, unknown> = {}
) {
  const rs = await core.rsRegistry.load("mem://state_test");
  await core.picoFramework.rootPico.install(rs.ruleset, {
    url: "mem://state_test",
    config,
  });
  return rs;
}

async function stateQuery(
  core: PicoEngineCore,
  eci: string,
  name: string,
  args: Record<string, unknown> = {}
) {
  return core.picoFramework.query({
    eci,
    rid: "state_test",
    name,
    args,
  });
}

test("export rejects uninstalled rid", async (t) => {
  const core = await mkStateCore();
  await installStateTest(core);
  const ch = await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  await t.throwsAsync(
    stateQuery(core, ch.id, "exportRid", { rid: "missing_rid", secret: "s" }),
    { message: /not installed/i }
  );
});

test("import rejects rid and url mismatch", async (t) => {
  const core = await mkStateCore();
  await installStateTest(core);
  const ch = await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const blob = sealRulesetState(
    samplePayload({ rid: "wrong_rid", url: "mem://state_test" }),
    "secret"
  );
  await t.throwsAsync(
    stateQuery(core, ch.id, "importState", { blob, secret: "secret" }),
    { message: /blob expects wrong_rid/i }
  );
});

test("export and import preserve nested ent vars and config", async (t) => {
  const core = await mkStateCore();
  const pico = core.picoFramework.rootPico;
  await installStateTest(core, { tier: "gold", flags: { a: true } });

  await pico.putEnt("state_test", "nested", {
    user: { first: "Ada", tags: ["dev"] },
  });
  await pico.putEnt("state_test", "counter", 12);
  await pico.putEnt("state_test", "removed", "gone");
  await pico.delEnt("state_test", "removed");

  const ch = await pico.newChannel(allowAllChannelConf);
  const blob = await stateQuery(core, ch.id, "exportState", {
    secret: "move-key",
  });
  const opened = openRulesetState(blob as string, "move-key");
  t.deepEqual(opened.config, { tier: "gold", flags: { a: true } });
  t.deepEqual(opened.ent.nested, { user: { first: "Ada", tags: ["dev"] } });
  t.is(opened.ent.counter, 12);
  t.false("removed" in opened.ent);

  const childEci = await pico.newPico({});
  const dest = core.picoFramework.getPico(childEci)!;
  const destCh = await dest.newChannel(allowAllChannelConf);
  await dest.install((await core.rsRegistry.load("mem://state_test")).ruleset, {
    url: "mem://state_test",
    config: {},
  });

  await stateQuery(core, destCh.id, "importState", {
    blob,
    secret: "move-key",
  });
  t.deepEqual(await stateQuery(core, destCh.id, "getRulesetConfig"), {
    tier: "gold",
    flags: { a: true },
  });
  t.deepEqual(await dest.getEnt("state_test", "nested"), {
    user: { first: "Ada", tags: ["dev"] },
  });
  t.is(await dest.getEnt("state_test", "counter"), 12);
  t.is(await dest.getEnt("state_test", "removed"), null);
});

test("import merges ent vars and does not delete keys absent from blob", async (t) => {
  const core = await mkStateCore();
  const pico = core.picoFramework.rootPico;
  await installStateTest(core);
  await pico.putEnt("state_test", "keep", "original");
  await pico.putEnt("state_test", "counter", 1);

  const ch = await pico.newChannel(allowAllChannelConf);
  const blob = sealRulesetState(
    samplePayload({ ent: { counter: 99 } }),
    "secret"
  );

  await stateQuery(core, ch.id, "importState", { blob, secret: "secret" });
  t.is(await pico.getEnt("state_test", "counter"), 99);
  t.is(await pico.getEnt("state_test", "keep"), "original");
});

test("import applies null ent values as deletion", async (t) => {
  const core = await mkStateCore();
  const pico = core.picoFramework.rootPico;
  await installStateTest(core);
  await pico.putEnt("state_test", "temp", "value");

  const ch = await pico.newChannel(allowAllChannelConf);
  const blob = sealRulesetState(
    samplePayload({ ent: { temp: null, counter: 5 } }),
    "secret"
  );

  await stateQuery(core, ch.id, "importState", { blob, secret: "secret" });
  t.is(await pico.getEnt("state_test", "temp"), null);
  t.is(await pico.getEnt("state_test", "counter"), 5);
});

test("export and import ruleset state on same pico", async (t) => {
  const core = await mkStateCore();
  const ch = await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const signal = mkSignalBase(core.picoFramework)(ch.id);

  await installStateTest(core, { tier: "gold" });

  await signal("state_test", "set", { value: 99 });
  t.is(await stateQuery(core, ch.id, "getCounter"), 99);

  const blob = await stateQuery(core, ch.id, "exportState", {
    secret: "move-key",
  });
  t.true(typeof blob === "string" && blob.length > 0);

  await signal("state_test", "set", { value: 0 });
  t.is(await stateQuery(core, ch.id, "getCounter"), 0);

  await stateQuery(core, ch.id, "importState", { blob, secret: "move-key" });
  t.is(await stateQuery(core, ch.id, "getCounter"), 99);
});

test("import installs ruleset when not yet present on pico", async (t) => {
  const core = await mkStateCore();
  await installStateTest(core, { tier: "bronze" });

  const sourceCh =
    await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const sourceSignal = mkSignalBase(core.picoFramework)(sourceCh.id);
  await sourceSignal("state_test", "set", { value: 11 });

  const blob = await stateQuery(core, sourceCh.id, "exportState", {
    secret: "cold",
  });

  const childEci = await core.picoFramework.rootPico.newPico({});
  const destPico = core.picoFramework.getPico(childEci)!;
  t.false(
    destPico.toReadOnly().rulesets.some((rs) => rs.rid === "state_test")
  );

  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  await importRulesetStateImpl(
    services,
    destPico,
    blob as string,
    "cold",
    (rs, config) => destPico.install(rs, config)
  );
  t.true(destPico.toReadOnly().rulesets.some((rs) => rs.rid === "state_test"));
  t.deepEqual(
    destPico.toReadOnly().rulesets.find((rs) => rs.rid === "state_test")?.config
      .config,
    { tier: "bronze" }
  );
  t.is(await destPico.getEnt("state_test", "counter"), 11);
});

test("import ruleset state onto another pico", async (t) => {
  const core = await mkStateCore();
  await installStateTest(core, { tier: "silver" });

  const sourceCh =
    await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const sourceSignal = mkSignalBase(core.picoFramework)(sourceCh.id);
  await sourceSignal("state_test", "set", { value: 7 });

  const blob = await stateQuery(core, sourceCh.id, "exportState", {
    secret: "x",
  });

  const childEci = await core.picoFramework.rootPico.newPico({});
  const destPico = core.picoFramework.getPico(childEci)!;
  const destCh = await destPico.newChannel(allowAllChannelConf);

  await destPico.install(
    (await core.rsRegistry.load("mem://state_test")).ruleset,
    { url: "mem://state_test", config: {} }
  );

  await stateQuery(core, destCh.id, "importState", { blob, secret: "x" });
  t.is(await stateQuery(core, destCh.id, "getCounter"), 7);
});
