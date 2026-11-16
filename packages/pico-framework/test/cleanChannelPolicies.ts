/**
 * Channel policy normalization: cleanEventPolicy and cleanQueryPolicy.
 */

import test from "ava";
import { cleanEventPolicy, cleanQueryPolicy } from "../src/Channel";

test("policy = cleanEventPolicy(policy)", function(t) {
  for (const val of [
    null,
    {},
    () => {},
    { allow: 1, deny: 2 },
    {
      allow: { domain: "hi", name: "bye" },
      deny: { domain: "hi", name: "bye" }
    },
    { allow: [], deny: [], extra: [] }
  ]) {
    t.throws(() => cleanEventPolicy(val), {
      instanceOf: TypeError,
      message:
        "EventPolicy expects {allow: EventPolicyRule[], deny: EventPolicyRule[]}"
    });
  }

  let policy = cleanEventPolicy({ allow: [], deny: [] });
  t.deepEqual(policy, { allow: [], deny: [] });

  policy = cleanEventPolicy({
    allow: [{ domain: "hi", name: "bye" }],
    deny: [{ domain: "hi", name: "bye" }]
  });
  t.deepEqual(policy, {
    allow: [{ domain: "hi", name: "bye" }],
    deny: [{ domain: "hi", name: "bye" }]
  });

  for (const val of [
    null,
    {},
    () => {},
    { domain: "hi" },
    { name: "bye" },
    { domain: "hi", name: "bye", extra: "thing" }
  ]) {
    t.throws(() => cleanEventPolicy({ allow: [val], deny: [] }), {
      instanceOf: TypeError,
      message: "EventPolicyRule expects {domain: string, name: string}"
    });
    t.throws(() => cleanEventPolicy({ allow: [], deny: [val] }), {
      instanceOf: TypeError,
      message: "EventPolicyRule expects {domain: string, name: string}"
    });
  }
});

test("policy = cleanQueryPolicy(policy)", function(t) {
  for (const val of [
    null,
    {},
    () => {},
    { allow: 1, deny: 2 },
    {
      allow: { rid: "hi", name: "bye" },
      deny: { rid: "hi", name: "bye" }
    },
    { allow: [], deny: [], extra: [] }
  ]) {
    t.throws(() => cleanQueryPolicy(val), {
      instanceOf: TypeError,
      message:
        "QueryPolicy expects {allow: QueryPolicyRule[], deny: QueryPolicyRule[]}"
    });
  }

  let policy = cleanQueryPolicy({ allow: [], deny: [] });
  t.deepEqual(policy, { allow: [], deny: [] });

  policy = cleanQueryPolicy({
    allow: [{ rid: "hi", name: "bye" }],
    deny: [{ rid: "hi", name: "bye" }]
  });
  t.deepEqual(policy, {
    allow: [{ rid: "hi", name: "bye" }],
    deny: [{ rid: "hi", name: "bye" }]
  });

  for (const val of [
    null,
    {},
    () => {},
    { rid: "hi" },
    { name: "bye" },
    { rid: "hi", name: "bye", extra: "thing" }
  ]) {
    t.throws(() => cleanQueryPolicy({ allow: [val], deny: [] }), {
      instanceOf: TypeError,
      message: "QueryPolicyRule expects {rid: string, name: string}"
    });
    t.throws(() => cleanQueryPolicy({ allow: [], deny: [val] }), {
      instanceOf: TypeError,
      message: "QueryPolicyRule expects {rid: string, name: string}"
    });
  }
});
