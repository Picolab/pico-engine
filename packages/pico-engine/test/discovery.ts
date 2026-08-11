/**
 * Discovery channel provisioning and capabilities directive aggregation.
 */

import test from "ava";
import { startTestEngine } from "./helpers/startTestEngine";

test.serial("every pico gets a discovery channel on setup", async (t) => {
  const { mkQuery } = await startTestEngine();

  const discovery = await mkQuery("io.picolabs.wrangler")("discoveryChannel");
  t.truthy(discovery);
  t.deepEqual(discovery.tags, ["discovery"]);
  t.deepEqual(discovery.eventPolicy, {
    allow: [{ domain: "discovery", name: "capabilities" }],
    deny: [],
  });
  t.deepEqual(discovery.queryPolicy, {
    allow: [],
    deny: [{ rid: "*", name: "*" }],
  });
});

test.serial("discovery capabilities aggregates capability directives", async (t) => {
  const { mkQuery, mkSignal } = await startTestEngine([
    "io.picolabs.discovery_test.krl",
  ]);

  const discovery = await mkQuery("io.picolabs.wrangler")("discoveryChannel");
  const directives = await mkSignal(discovery.id)(
    "discovery",
    "capabilities",
    {}
  );

  const capabilities = directives.filter(
    (d: any) => d.name === "discovery capability"
  );
  t.is(capabilities.length, 1);
  t.is(capabilities[0].options.rid, "io.picolabs.discovery_test");
  t.is(capabilities[0].options.bindings.queries.length, 2);
});

test.serial("discovery capabilities filters bindings by caller eci policy", async (t) => {
  const { pe, mkQuery, mkSignal } = await startTestEngine([
    "io.picolabs.discovery_test.krl",
  ]);
  const root = pe.pf.rootPicos()[0];

  const restricted = await root.newChannel({
    tags: ["restricted"],
    eventPolicy: {
      allow: [{ domain: "discovery_test", name: "open" }],
      deny: [],
    },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.discovery_test", name: "ping" }],
      deny: [],
    },
  });

  const discovery = await mkQuery("io.picolabs.wrangler")("discoveryChannel");
  const directives = await mkSignal(discovery.id)("discovery", "capabilities", {
    eci: restricted.id,
  });

  const capability = directives.find(
    (d: any) => d.name === "discovery capability"
  );
  t.truthy(capability);
  t.deepEqual(
    capability!.options.bindings.queries.map((q: any) => q.name),
    ["ping"]
  );
  t.deepEqual(
    capability!.options.bindings.events.map((e: any) => e.name),
    ["open"]
  );
});

test.serial("discovery capabilities tolerates empty bindings with caller eci", async (t) => {
  const { mkQuery, mkSignal } = await startTestEngine([
    "io.picolabs.discovery_empty_bindings.krl",
  ]);

  const discovery = await mkQuery("io.picolabs.wrangler")("discoveryChannel");
  const directives = await mkSignal(discovery.id)("discovery", "capabilities", {
    eci: discovery.id,
  });

  const capability = directives.find(
    (d: any) => d.name === "discovery capability"
  );
  t.truthy(capability);
  t.deepEqual(capability!.options.bindings.queries, []);
  t.deepEqual(capability!.options.bindings.events, []);
});

test.serial("child pico gets a discovery channel", async (t) => {
  const { signal, mkQuery } = await startTestEngine();

  await signal("wrangler", "new_child_request", { name: "child" });

  const children = await mkQuery("io.picolabs.wrangler")("children");
  t.is(children.length, 1);

  const childDiscovery = await mkQuery("io.picolabs.wrangler")("picoQuery", {
    eci: children[0].eci,
    mod: "io.picolabs.wrangler",
    func: "discoveryChannel",
    params: {},
  });
  t.truthy(childDiscovery);
  t.deepEqual(childDiscovery.tags, ["discovery"]);
});
