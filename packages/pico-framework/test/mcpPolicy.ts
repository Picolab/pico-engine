/**
 * MCP exposure on a channel. Missing policy denies. A ceiling constrains it
 * only when the ceiling itself has an mcpPolicy.
 */

import test from "ava";
import { allowsMcpPolicy, cleanMcpPolicy } from "../src/Channel";
import {
  assertChannelPolicyWithinCeiling,
  mcpPolicySubsetOf,
  policyCeilingSubsetOf,
  PERMISSIVE_POLICY_CEILING,
} from "../src/policyCeiling";

const events = { allow: [{ domain: "*", name: "*" }], deny: [] };
const queries = { allow: [{ rid: "*", name: "*" }], deny: [] };

test("a missing or empty MCP policy denies both surfaces", (t) => {
  t.false(allowsMcpPolicy(undefined, "channel"));
  t.false(allowsMcpPolicy(undefined, "mesh"));
  t.false(allowsMcpPolicy({ allow: [], deny: [] }, "channel"));
  t.true(
    allowsMcpPolicy({ allow: [{ surface: "channel" }], deny: [] }, "channel")
  );
  t.false(
    allowsMcpPolicy({ allow: [{ surface: "channel" }], deny: [] }, "mesh")
  );
  t.true(allowsMcpPolicy({ allow: [{ surface: "*" }], deny: [] }, "mesh"));
  t.false(
    allowsMcpPolicy(
      { allow: [{ surface: "*" }], deny: [{ surface: "mesh" }] },
      "mesh"
    )
  );
});

test("a ceiling without mcpPolicy does not block channel exposure", (t) => {
  t.notThrows(() =>
    assertChannelPolicyWithinCeiling(
      events,
      queries,
      PERMISSIVE_POLICY_CEILING,
      { allow: [{ surface: "channel" }], deny: [] }
    )
  );
});

test("a ceiling mcpPolicy denies a wider channel", (t) => {
  const ceiling = {
    eventPolicy: events,
    queryPolicy: queries,
    mcpPolicy: { allow: [], deny: [] },
  };
  t.throws(
    () =>
      assertChannelPolicyWithinCeiling(events, queries, ceiling, {
        allow: [{ surface: "channel" }],
        deny: [],
      }),
    { message: "Channel MCP policy exceeds pico policy ceiling" }
  );
  t.false(
    policyCeilingSubsetOf(
      { eventPolicy: events, queryPolicy: queries },
      ceiling
    )
  );
  t.true(
    mcpPolicySubsetOf(
      { allow: [{ surface: "channel" }], deny: [] },
      { allow: [{ surface: "*" }], deny: [] }
    )
  );
  t.deepEqual(cleanMcpPolicy({ allow: [{ surface: "mesh" }], deny: [] }), {
    allow: [{ surface: "mesh" }],
    deny: [],
  });
});
