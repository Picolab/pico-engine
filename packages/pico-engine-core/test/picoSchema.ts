/**
 * Pico schema merge and ctx schema queries.
 */

import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import {
  channelSchemaForEci,
  mergePicoSchema,
  schemaBindingsFromRuleset,
} from "../src/picoSchema";
import type { ChannelConfig } from "pico-framework";
import { PicoEngineCore } from "../src/PicoEngineCore";
import { RulesetRegistryLoaderMem } from "../src/RulesetRegistryLoaderMem";
import { allowAllChannelConf } from "./helpers/allowAllChannelConf";
import { mkdb } from "./helpers/mkdb";

const schemaA = `ruleset io.test.a {
  meta { shares readSchema, readRsSchema }
  global {
    /** @returns Map */
    readSchema = function() { ctx:picoSchema() }
    /** @returns Map */
    readRsSchema = function() { ctx:rulesetSchema("io.test.a") }
  }
  /**
   * Create A.
   * @attr name String
   */
  rule createA {
    select when test create
    if event:attr("name") then every { noop() }
  }
}`;

const schemaB = `ruleset io.test.b {
  /**
   * Also on create.
   * @attr name Number
   */
  rule createB {
    select when test create
    if event:attr("name") then every { noop() }
  }
}`;

test("mergePicoSchema carries operation examples onto events", (t) => {
  const krl = `ruleset io.test {
    /**
     * Open.
     * @attr name String
     * @example "demo" { "name": "hello" }
     */
    rule open {
      select when app open
      if event:attr("name") then every { noop() }
    }
  }`;
  const schema = require("krl-compiler").check(krl).rulesetSchema;
  const merged = mergePicoSchema([{ rid: "io.test", schema }]);
  t.is(merged.events[0].examples?.length, 1);
  t.is(merged.events[0].examples?.[0].name, "demo");
  t.deepEqual(merged.events[0].examples?.[0].attrs, { name: "hello" });
});

test("mergePicoSchema records cross-ruleset attr type conflicts", (t) => {
  const merged = mergePicoSchema([
    {
      rid: "io.test.a",
      schema: require("krl-compiler").check(schemaA).rulesetSchema,
    },
    {
      rid: "io.test.b",
      schema: require("krl-compiler").check(schemaB).rulesetSchema,
    },
  ]);
  t.is(merged.events.length, 1);
  t.is(merged.conflicts.length, 1);
  t.is(merged.conflicts[0].attr, "name");
});

test.serial("ctx picoSchema and rulesetSchema after install", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://a": schemaA,
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

  const chann = await core.picoFramework.rootPico.newChannel(allowAllChannelConf);
  const eci = chann.id;

  const rs = await core.rsRegistry.load("mem://a");
  await core.picoFramework.rootPico.install(rs.ruleset, { url: "mem://a" });

  const aggregate = (await core.picoFramework.query({
    eci,
    rid: "io.test.a",
    name: "readSchema",
    args: {},
  })) as any;
  t.is(aggregate.version, 1);
  t.true(aggregate.events.some((e: any) => e.domain === "test"));

  t.is(aggregate.rulesets.some((r: any) => r.rid === "io.test.a"), true);

  const rsSchema = (await core.picoFramework.query({
    eci,
    rid: "io.test.a",
    name: "readRsSchema",
    args: {},
  })) as any;
  t.is(rsSchema.rid, "io.test.a");
  t.true(rsSchema.operations.some((op: any) => op.rule === "createA"));
});

test("schemaBindingsFromRuleset lists entry events and shared queries", (t) => {
  const schema = require("krl-compiler").check(schemaA).rulesetSchema;
  const bindings = schemaBindingsFromRuleset(schema);
  t.is(bindings.version, 1);
  t.true(bindings.events.some((e) => e.domain === "test" && e.name === "create"));
  t.true(bindings.queries.some((q) => q.name === "readSchema"));
});

test.serial("channelSchema intersects pico schema with channel policy", async (t) => {
  const krlUrls: { [url: string]: string } = {
    "mem://a": schemaA,
    "mem://b": schemaB,
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

  await core.rsRegistry.load("mem://a");
  await core.rsRegistry.load("mem://b");
  await core.picoFramework.rootPico.install(
    (await core.rsRegistry.load("mem://a")).ruleset,
    { url: "mem://a" },
  );
  await core.picoFramework.rootPico.install(
    (await core.rsRegistry.load("mem://b")).ruleset,
    { url: "mem://b" },
  );

  const narrowChannel: ChannelConfig = {
    tags: ["narrow"],
    eventPolicy: {
      allow: [{ domain: "test", name: "create" }],
      deny: [],
    },
    queryPolicy: {
      allow: [{ rid: "io.test.a", name: "readSchema" }],
      deny: [],
    },
  };
  const ch = await core.picoFramework.rootPico.newChannel(narrowChannel);

  const filtered = channelSchemaForEci(
    core.picoFramework.rootPico,
    core.rsRegistry,
    (eci) => core.picoFramework.lookupChannel(eci),
    ch.id,
  );
  t.true(filtered.events.every((ev) => ev.domain === "test"));
  t.true(
    filtered.queries.every(
      (q) => q.rid === "io.test.a" && q.name === "readSchema",
    ),
  );
  t.is(filtered.queries.length, 1);
});
