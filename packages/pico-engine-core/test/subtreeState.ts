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

const SCHED_KRL = `ruleset sched_test {
  meta { shares readSchedule }
  global {
    readSchedule = function() { schedule:list() }
  }
}`;

const HOOK_KRL = `ruleset import_hook {
  meta { shares lastImport }
  global {
    lastImport = function() { ent:lastImport }
  }
  rule on_import {
    select when wrangler pico_imported
    always {
      ent:lastImport := event:attrs
    }
  }
}`;

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
    "mem://sched_test": SCHED_KRL,
    "mem://import_hook": HOOK_KRL,
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

test("importSubtree remaps _schedule ECI references", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  const schedRs = await core.rsRegistry.load("mem://sched_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: schedRs.ruleset, config: { url: "mem://sched_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const tickCh = await sourceChild.newChannel({
    tags: ["tick"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  const jobId = "job-1";
  await sourceChild.putEnt("sched_test", "_schedule", {
    [jobId]: {
      id: jobId,
      type: "at",
      time: Date.now() + 86400000,
      event: {
        eci: tickCh.id,
        domain: "sched_test",
        name: "tick",
        data: { attrs: {} },
        time: 0,
      },
    },
  });

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "sched"
  );
  const importResult = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "sched"
  );

  const imported = core.picoFramework.getPico(importResult.newRootPicoId)!;
  const schedule = (await imported.getEnt("sched_test", "_schedule")) as Record<
    string,
    { event: { eci: string } }
  >;
  t.is(schedule[jobId].event.eci, importResult.eciMap[tickCh.id]);
  t.not(schedule[jobId].event.eci, tickCh.id);
});

test("importSubtree remaps subscription Rx ECIs but keeps external Tx", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };

  const stateRs = await core.rsRegistry.load("mem://state_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const rxCh = await sourceChild.newChannel({
    tags: ["wellKnown_Rx", "Tx_Rx"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await sourceChild.putEnt("state_test", "established", [
    {
      Id: "sub-1",
      Rx: rxCh.id,
      Tx: "external-peer-eci",
      layer2: false,
    },
  ]);

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "sub"
  );
  const importResult = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "sub"
  );

  const imported = core.picoFramework.getPico(importResult.newRootPicoId)!;
  const established = (await imported.getEnt(
    "state_test",
    "established"
  )) as Array<{ Rx: string; Tx: string }>;
  t.is(established[0].Rx, importResult.eciMap[rxCh.id]);
  t.is(established[0].Tx, "external-peer-eci");
});

test("importSubtree via ctx raises wrangler pico_imported", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const hookRs = await core.rsRegistry.load("mem://import_hook");
  await root.install(stateRs.ruleset, { url: "mem://state_test" });

  const childEci = await root.newPico({
    rulesets: [
      { rs: stateRs.ruleset, config: { url: "mem://state_test" } },
      { rs: hookRs.ruleset, config: { url: "mem://import_hook" } },
    ],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  await sourceChild.putEnt("state_test", "counter", 3);

  const exportCh = await root.newChannel(allowAllChannelConf);
  const blob = await core.picoFramework.query({
    eci: exportCh.id,
    rid: "state_test",
    name: "exportSubtree",
    args: { picoId: sourceChild.id, secret: "hook" },
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
    args: { blob, secret: "hook" },
  })) as { newRootPicoId: string; oldRootPicoId: string };

  t.is(result.oldRootPicoId, sourceChild.id);
  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  const importedCh = await imported.newChannel(allowAllChannelConf);
  const hookAttrs = await core.picoFramework.query({
    eci: importedCh.id,
    rid: "import_hook",
    name: "lastImport",
    args: {},
  });
  const attrs = hookAttrs as {
    oldRootPicoId: string;
    newRootPicoId: string;
    eciMap: Record<string, string>;
  };
  t.is(attrs.oldRootPicoId, sourceChild.id);
  t.is(attrs.newRootPicoId, result.newRootPicoId);
  t.is(attrs.eciMap[sourceChild.id], result.newRootPicoId);
});

test("importSubtree returns oldRootPicoId", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "id"
  );
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "id"
  );
  t.is(result.oldRootPicoId, sourceChild.id);
});

test("exportSubtree excludes self and family channels", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const userCh = await sourceChild.newChannel({
    tags: ["app"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "ch"
  );
  const payload = openPortableBlob(blob, "ch") as SubtreeExportPayload;
  const exportedEcis = payload.root.channels.map((c) => c.oldEci);
  t.false(exportedEcis.includes(sourceChild.id));
  t.true(exportedEcis.includes(userCh.id));
  for (const ch of sourceChild.toReadOnly().channels) {
    if (ch.familyChannelPicoID) {
      t.false(exportedEcis.includes(ch.id));
    }
  }
});

test("importSubtree remaps parent ent referencing nested child channel", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const leafRs = await core.rsRegistry.load("mem://leaf_test");
  const parentEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const parent = core.picoFramework.lookupChannel(parentEci).pico;
  const childEci = await parent.newPico({
    rulesets: [{ rs: leafRs.ruleset, config: { url: "mem://leaf_test" } }],
  });
  const child = core.picoFramework.lookupChannel(childEci).pico;
  const leafCh = await child.newChannel({
    tags: ["leaf"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  await parent.putEnt("state_test", "leafTickCh", leafCh.id);

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    parent.id,
    "nested"
  );
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "nested"
  );

  const newParent = core.picoFramework.getPico(result.newRootPicoId)!;
  t.is(await newParent.getEnt("state_test", "leafTickCh"), result.eciMap[leafCh.id]);
  t.not(await newParent.getEnt("state_test", "leafTickCh"), leafCh.id);
});

test("recursive importSubtree maps nested child channel ECIs", async (t) => {
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
  const childEci = await parent.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const child = core.picoFramework.lookupChannel(childEci).pico;
  const childCh = await child.newChannel({
    tags: ["nested"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    parent.id,
    "map"
  );
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "map"
  );

  t.is(result.picoIdMap[child.id], result.eciMap[child.id]);
  t.true(result.eciMap[childCh.id].length > 0);
  t.not(result.eciMap[childCh.id], childCh.id);
});

test("importSubtree remaps inbound subscription ECIs", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const rxCh = await sourceChild.newChannel({
    tags: ["wellKnown_Rx", "Tx_Rx"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await sourceChild.putEnt("state_test", "inbound", [
    { Id: "in-1", Rx: rxCh.id, Tx: "remote-initiator-eci" },
  ]);

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "in"
  );
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "in"
  );
  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  const inbound = (await imported.getEnt("state_test", "inbound")) as Array<{
    Rx: string;
    Tx: string;
  }>;
  t.is(inbound[0].Rx, result.eciMap[rxCh.id]);
  t.is(inbound[0].Tx, "remote-initiator-eci");
});

test("importSubtree remaps outbound wellKnown_Tx ECIs", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const childEci = await root.newPico({
    rulesets: [{ rs: stateRs.ruleset, config: { url: "mem://state_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const wellKnownCh = await sourceChild.newChannel({
    tags: ["wellKnown_Tx"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const rxCh = await sourceChild.newChannel({
    tags: ["wellKnown_Rx", "Tx_Rx"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await sourceChild.putEnt("state_test", "outbound", [
    {
      Id: "out-1",
      wellKnown_Tx: wellKnownCh.id,
      Rx: rxCh.id,
      Tx: "remote-peer-eci",
    },
  ]);

  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "out"
  );
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "out"
  );
  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  const outbound = (await imported.getEnt("state_test", "outbound")) as Array<{
    wellKnown_Tx: string;
    Rx: string;
    Tx: string;
  }>;
  t.is(outbound[0].wellKnown_Tx, result.eciMap[wellKnownCh.id]);
  t.is(outbound[0].Rx, result.eciMap[rxCh.id]);
  t.is(outbound[0].Tx, "remote-peer-eci");
});

test("direct importSubtree does not fire pico_imported hook", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const services = {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
  };
  const stateRs = await core.rsRegistry.load("mem://state_test");
  const hookRs = await core.rsRegistry.load("mem://import_hook");
  const childEci = await root.newPico({
    rulesets: [
      { rs: stateRs.ruleset, config: { url: "mem://state_test" } },
      { rs: hookRs.ruleset, config: { url: "mem://import_hook" } },
    ],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const blob = await exportSubtreeImpl(
    services,
    core.picoFramework,
    sourceChild.id,
    "nohook"
  );
  const result = await importSubtreeImpl(
    services,
    core.picoFramework,
    root,
    blob,
    "nohook"
  );
  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  t.is(await imported.getEnt("import_hook", "lastImport"), null);
});

test("ctx importSubtree reloads schedule jobs after ECI remap", async (t) => {
  const core = await mkCore();
  const root = core.picoFramework.rootPico;
  const schedRs = await core.rsRegistry.load("mem://sched_test");
  const stateRs = await core.rsRegistry.load("mem://state_test");
  await root.install(stateRs.ruleset, { url: "mem://state_test" });

  const childEci = await root.newPico({
    rulesets: [{ rs: schedRs.ruleset, config: { url: "mem://sched_test" } }],
  });
  const sourceChild = core.picoFramework.lookupChannel(childEci).pico;
  const tickCh = await sourceChild.newChannel({
    tags: ["tick"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });
  const jobId = "job-reload";
  await sourceChild.putEnt("sched_test", "_schedule", {
    [jobId]: {
      id: jobId,
      type: "at",
      time: Date.now() + 86400000,
      event: {
        eci: tickCh.id,
        domain: "sched_test",
        name: "tick",
        data: { attrs: {} },
        time: 0,
      },
    },
  });

  const exportCh = await root.newChannel(allowAllChannelConf);
  const blob = await core.picoFramework.query({
    eci: exportCh.id,
    rid: "state_test",
    name: "exportSubtree",
    args: { picoId: sourceChild.id, secret: "reload" },
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
    args: { blob, secret: "reload" },
  })) as { newRootPicoId: string; eciMap: Record<string, string> };

  const imported = core.picoFramework.getPico(result.newRootPicoId)!;
  const queryCh = await imported.newChannel(allowAllChannelConf);
  const jobs = (await core.picoFramework.query({
    eci: queryCh.id,
    rid: "sched_test",
    name: "readSchedule",
    args: {},
  })) as Array<{ id: string; event: { eci: string } }>;
  t.is(jobs.length, 1);
  t.is(jobs[0].id, jobId);
  t.is(jobs[0].event.eci, result.eciMap[tickCh.id]);
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
