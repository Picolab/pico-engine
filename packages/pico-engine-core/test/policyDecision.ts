import test from "ava";
import { matchEventPolicy, matchQueryPolicy } from "../src/policyDecision";

test("event policy uses the first matching deny, then allow, then default", (t) => {
  const policy = {
    deny: [{ domain: "sensor", name: "reset" }],
    allow: [
      { domain: "sensor", name: "read" },
      { domain: "*", name: "*" },
    ],
  };
  t.deepEqual(matchEventPolicy(policy, { domain: "sensor", name: "reset" }), {
    allowed: false,
    rule: { domain: "sensor", name: "reset" },
  });
  t.deepEqual(matchEventPolicy(policy, { domain: "sensor", name: "read" }), {
    allowed: true,
    rule: { domain: "sensor", name: "read" },
  });
  t.deepEqual(matchEventPolicy(policy, { domain: "other", name: "ping" }), {
    allowed: true,
    rule: { domain: "*", name: "*" },
  });
  t.deepEqual(
    matchEventPolicy(
      { deny: [], allow: [] },
      { domain: "sensor", name: "read" }
    ),
    { allowed: false, rule: "default" }
  );
});

test("query policy matches rid and name the same way", (t) => {
  t.deepEqual(
    matchQueryPolicy(
      {
        deny: [],
        allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
      },
      { rid: "io.picolabs.wrangler", name: "children" }
    ),
    { allowed: false, rule: "default" }
  );
});
