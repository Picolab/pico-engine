/**
 * Phase B — subtree export/import.
 */

import test from "ava";
import { makeKrlLogger } from "krl-stdlib";
import { PicoEngineCore } from "../src/PicoEngineCore";
import { RulesetRegistryLoaderMem } from "../src/RulesetRegistryLoaderMem";
import {
  openPortableBlob,
  sealPortableBlob,
} from "../src/rulesetStateCrypto";
import {
  exportSubtree as exportSubtreeImpl,
  importSubtree as importSubtreeImpl,
  type SubtreeExportPayload,
} from "../src/subtreeState";
import { allowAllChannelConf } from "./helpers/allowAllChannelConf";
import { mkSignalBase } from "./helpers/mkSignalBase";
import { mkdb } from "./helpers/mkdb";

const LEAF_KRL = `ruleset leaf_test {
  meta { shares getLabel }
  global {
    getLabel = function() { ent:label }
  }
  rule setLabel {
    select when leaf_test:setLabel
    always {
      ent:label := event:attrs{"label"}
    }
  }
}`;

const STATE_KRL = `ruleset state_test {
  meta {
    shares getCounter, exportSubtree, importSubtree
  }
  global {
    getCounter = function() { ent:counter }
    exportSubtree = function(picoId, secret) {
      ctx:exportSubtree(picoId, secret)
    }
    importSubtree = function(blob, secret) {
      ctx:importSubtree(blob, secret)
    }
  }
  rule set {
    select when state_test:set
    always {
      ent:counter := event:attrs{"value"}
    }
  }
}`;

async function mkCore(krlUrls: Record<string, string> = {}) {
  const sources: Record<string, string> = {
    "mem://state_test": STATE_KRL,
    "mem://leaf_test": LEAF_KRL,
    ...krlUrls,
  };
  const core = new PicoEngineCore({
    db: mkdb(),
    rsRegLoader: RulesetRegistryLoaderMem(async (url) => {
      const krl = sources[url];
      if (!krl) {
        throw new Error("Unknown ruleset url: " + url);
      }
      return krl;
    }),
    log: makeKrlLogger(() => null),
    async getPicoLogs() {
      return [];
    },
  });
  await core.start();
  return core;
}

test("exportSubtree packs rulesets, ent, and user channels", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  await root.install((await core.rsRegistry.load("mem://state_test")).ruleset, {
    url: "mem://state_test",
    config: { tier: "silver" },
  });
  await root.putEnt("state_test", "counter", 3);
  const ch = await root.newChannel({
    tags: ["sensor", "temp"],
    eventPolicy: { allow: [{ domain: "sensor", name: "tick" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const queryCh = await root.newChannel(allowAllChannelConf);

  const blob = await core.picoFramework.query({
    eci: queryCh.id,
    rid: "state_test",
    name: "exportSubtree",
    args: { picoId: root.id, secret: "move" },
  });

  const payload = openPortableBlob(blob as string, "move") as SubtreeExportPayload;
  t.is(payload.version, 1);
  t.is(payload.root.oldPicoId, root.id);
  t.true(payload.root.rulesets.some((r) => r.rid === "state_test"));
  t.is(payload.root.ent.state_test.counter, 3);
  t.is(payload.root.channels.length, 2); // user channels only (not self/family)
  t.true(payload.root.channels.some((c) => c.oldEci === ch.id));
  t.is(payload.root.children.length, 0);
});

test("importSubtree recreates pico under new parent with fresh ECIs", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  const sourceRs = await core.rsRegistry.load("mem://state_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: sourceRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;

  const sourceCh = await sourceChild.newChannel({
    tags: ["sensor", "temp"],
    eventPolicy: {
      allow: [
        { domain: "sensor", name: "tick" },
        { domain: "state_test", name: "set" },
      ],
      deny: [],
    },
    queryPolicy: { allow: [{ rid: "state_test", name: "getCounter" }], deny: [] },
  });

  const srcSignal = mkSignalBase(core.picoFramework)(sourceCh.id);
  await srcSignal("state_test", "set", { value: 42 });

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "x"
  );

  const importResult = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "x"
  );

  t.not(importResult.newRootPicoId, sourceChild.id);
  t.is(importResult.picoIdMap[sourceChild.id], importResult.newRootPicoId);
  t.is(importResult.eciMap[sourceChild.id], importResult.newRootPicoId);
  t.is(importResult.eciMap[sourceCh.id].length > 0, true);
  t.not(importResult.eciMap[sourceCh.id], sourceCh.id);

  const destPico = core.picoFramework.getPico(importResult.newRootPicoId)!;
  t.is(await destPico.getEnt("state_test", "counter"), 42);

  const destUserCh = destPico
    .toReadOnly()
    .channels.find((c) => !c.familyChannelPicoID && c.id !== destPico.id);
  t.deepEqual(destUserCh?.tags.slice().sort(), ["sensor", "temp"]);
});

test("exportSubtree recurses into child picos by default", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  const stateRs = await core.rsRegistry.load("mem://state_test");
  const parentEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const parent = core.picoFramework.lookupChannel(parentEci).pico;
  await parent.putEnt("state_test", "counter", 7);

  const leafRs = await core.rsRegistry.load("mem://leaf_test");
  const childEci = await parent.newPico({
    rulesets: [{ rs: leafRs.ruleset, config: { url: "mem://leaf_test" } }],
  });
  const child = core.picoFramework.lookupChannel(childEci).pico;
  await child.putEnt("leaf_test", "label", "deep");

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    parent.id,
    "tree"
  );
  const payload = openPortableBlob(blob, "tree") as SubtreeExportPayload;
  t.is(payload.root.children.length, 1);
  t.is(payload.root.children[0].oldPicoId, child.id);
  t.is(payload.root.ent.state_test.counter, 7);
  t.is(payload.root.children[0].ent.leaf_test.label, "deep");

  const importResult = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "tree"
  );
  const newParent = core.picoFramework.getPico(importResult.newRootPicoId)!;
  t.is(await newParent.getEnt("state_test", "counter"), 7);
  const newChildId = importResult.picoIdMap[child.id];
  const newChild = core.picoFramework.getPico(newChildId)!;
  t.is(await newChild.getEnt("leaf_test", "label"), "deep");
});

test("exportSubtree inlines KRL for local file: rulesets", async (t) => {
  const fileUrl = "file:///tmp/dev-only/custom.krl";
  const core = await mkCore({ [fileUrl]: STATE_KRL });
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  const rs = await core.rsRegistry.load(fileUrl);
  await root.install(rs.ruleset, { url: fileUrl, config: { tier: "gold" } });
  await root.putEnt("state_test", "counter", 99);

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    root.id,
    "file"
  );
  const payload = openPortableBlob(blob, "file") as SubtreeExportPayload;
  t.is(typeof payload.root.rulesets[0].krl, "string");
  t.true(payload.root.rulesets[0].krl!.includes("ruleset state_test"));

  const destCore = await mkCore();
  const destRoot = destCore.picoFramework.rootPico;
  const destServices = {
    db: destCore.picoFramework.db,
    rsRegistry: destCore.rsRegistry,
  };
  const result = await importSubtreeImpl(
    destServices,
    destCore.picoFramework,
    destRoot,
    blob,
    "file"
  );
  const imported = destCore.picoFramework.getPico(result.newRootPicoId)!;
  t.is(await imported.getEnt("state_test", "counter"), 99);
  const installed = imported.toReadOnly().rulesets.find(
    (r) => r.rid === "state_test"
  );
  t.true(installed?.config.url.startsWith("portable://"));
});

test("exportSubtree with recurse false omits child picos", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  const stateRs = await core.rsRegistry.load("mem://state_test");
  const parentEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const parent = core.picoFramework.lookupChannel(parentEci).pico;

  const leafRs = await core.rsRegistry.load("mem://leaf_test");
  await parent.newPico({
    rulesets: [{ rs: leafRs.ruleset, config: { url: "mem://leaf_test" } }],
  });

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    parent.id,
    "flat",
    { recurse: false }
  );
  const payload = openPortableBlob(blob, "flat") as SubtreeExportPayload;
  t.is(payload.root.children.length, 0);
});

test("exportSubtree rejects unknown picoId", async (t) => {
  const core = await mkCore();
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  await t.throwsAsync(
    exportSubtreeImpl(
      services,
      core.picoFramework,
      "missing-pico",
      "secret"
    ),
    { message: /not found/i }
  );
});

test("importSubtree rejects wrong secret", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  await root.install((await core.rsRegistry.load("mem://state_test")).ruleset, {
    url: "mem://state_test",
  });
  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    root.id,
    "right"
  );
  await t.throwsAsync(
    importSubtreeImpl(services, core.picoFramework, root, blob, "wrong"),
    { message: /decryption failed/i }
  );
});

test("importSubtree rejects invalid payload", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const blob = sealPortableBlob({ version: 99, root: null }, "secret");
  await t.throwsAsync(
    importSubtreeImpl(services, core.picoFramework, root, blob, "secret"),
    { message: /invalid subtree export payload/i }
  );
});

test("importSubtree rejects ruleset rid mismatch", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const blob = sealPortableBlob(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      root: {
        oldPicoId: "old",
        rulesets: [
          {
            rid: "wrong_rid",
            url: "mem://state_test",
            config: {},
          },
        ],
        ent: {},
        channels: [],
        children: [],
      },
    },
    "secret"
  );
  await t.throwsAsync(
    importSubtreeImpl(services, core.picoFramework, root, blob, "secret"),
    { message: /export expects wrong_rid/i }
  );
});

test("importSubtree preserves channel policies and ruleset config", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  await root.install((await core.rsRegistry.load("mem://state_test")).ruleset, {
    url: "mem://state_test",
    config: { tier: "silver", flags: { a: true } },
  });
  const eventPolicy = {
    allow: [{ domain: "sensor", name: "tick" }],
    deny: [{ domain: "admin", name: "*" }],
  };
  const queryPolicy = {
    allow: [{ rid: "state_test", name: "getCounter" }],
    deny: [{ rid: "other", name: "*" }],
  };
  const sourceCh = await root.newChannel({
    tags: ["sensor", "temp"],
    eventPolicy,
    queryPolicy,
  });

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    root.id,
    "policy"
  );
  const childEci = await root.newPico({});
  const destParent = core.picoFramework.getPico(childEci)!;
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    destParent,
    blob,
    "policy"
  );

  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  const rs = imported.toReadOnly().rulesets.find((r) => r.rid === "state_test");
  t.deepEqual(rs?.config.config, { tier: "silver", flags: { a: true } });

  const destCh = imported
    .toReadOnly()
    .channels.find((c) => c.id === result.eciMap[sourceCh.id]);
  t.deepEqual(destCh?.eventPolicy, eventPolicy);
  t.deepEqual(destCh?.queryPolicy, queryPolicy);
});

test("importSubtree via ctx function recreates subtree", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const stateRs = await core.rsRegistry.load("mem://state_test");
  await root.install(stateRs.ruleset, { url: "mem://state_test" });

  const childEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  await sourceChild.putEnt("state_test", "counter", 55);

  const exportCh = await root.newChannel(allowAllChannelConf);
  const blob = await core.picoFramework.query({
    eci: exportCh.id,
    rid: "state_test",
    name: "exportSubtree",
    args: { picoId: sourceChild.id, secret: "ctx" },
  });

  const importParentEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const importParent = core.picoFramework.getPico(importParentEci)!;
  const importCh = await importParent.newChannel(allowAllChannelConf);
  const result = (await core.picoFramework.query({
    eci: importCh.id,
    rid: "state_test",
    name: "importSubtree",
    args: { blob, secret: "ctx" },
  })) as {
    newRootPicoId: string;
    eciMap: Record<string, string>;
  };

  t.not(result.newRootPicoId, sourceChild.id);
  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  t.is(await imported.getEnt("state_test", "counter"), 55);
});

test("exportSubtree does not inline KRL for mem URLs", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  await root.install((await core.rsRegistry.load("mem://state_test")).ruleset, {
    url: "mem://state_test",
  });
  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    root.id,
    "mem"
  );
  const payload = openPortableBlob(blob, "mem") as SubtreeExportPayload;
  t.is(payload.root.rulesets[0].krl, undefined);
});
