/**
 * Policy ceiling subset logic (1.8 channel policy fix).
 */

import test from "ava";
import {
  eventPolicySubsetOf,
  queryPolicySubsetOf,
  policyCeilingSubsetOf,
  hasUnrestrictedEventAllow,
  hasUnrestrictedQueryAllow,
} from "../src/policyCeiling";
import { allowsEventPolicy, allowsQueryPolicy } from "../src/Channel";

test("deny beats permit when allow is wildcard", (t) => {
  const policy = {
    allow: [{ domain: "*", name: "*" }],
    deny: [{ domain: "wrangler", name: "ping" }],
  };
  t.true(allowsEventPolicy(policy, { domain: "wrangler", name: "pong" }));
  t.false(allowsEventPolicy(policy, { domain: "wrangler", name: "ping" }));
  t.true(allowsEventPolicy(policy, { domain: "manifold", name: "ping" }));
});

test("deny beats permit on queries when allow is wildcard", (t) => {
  const policy = {
    allow: [{ rid: "*", name: "*" }],
    deny: [{ rid: "io.picolabs.wrangler", name: "channels" }],
  };
  t.true(allowsQueryPolicy(policy, { rid: "io.picolabs.wrangler", name: "myself" }));
  t.false(
    allowsQueryPolicy(policy, { rid: "io.picolabs.wrangler", name: "channels" }),
  );
});

test("eventPolicySubsetOf: narrow channel within permissive ceiling", (t) => {
  const ceiling = {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  };
  const channel = {
    allow: [{ domain: "manifold", name: "create_thing" }],
    deny: [],
  };
  t.true(eventPolicySubsetOf(channel, ceiling));
});

test("eventPolicySubsetOf: wildcard channel not within narrow ceiling", (t) => {
  const ceiling = {
    allow: [{ domain: "manifold", name: "*" }],
    deny: [],
  };
  const channel = {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  };
  t.false(eventPolicySubsetOf(channel, ceiling));
});

test("eventPolicySubsetOf: channel deny narrows without exceeding ceiling", (t) => {
  const ceiling = {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  };
  const channel = {
    allow: [{ domain: "*", name: "*" }],
    deny: [{ domain: "wrangler", name: "ping" }],
  };
  t.true(eventPolicySubsetOf(channel, ceiling));
});

test("eventPolicySubsetOf: ceiling deny forbids channel allow", (t) => {
  const ceiling = {
    allow: [{ domain: "*", name: "*" }],
    deny: [{ domain: "admin", name: "reset" }],
  };
  const channel = {
    allow: [{ domain: "admin", name: "reset" }],
    deny: [],
  };
  t.false(eventPolicySubsetOf(channel, ceiling));
});

test("queryPolicySubsetOf: rid-scoped ceiling", (t) => {
  const ceiling = {
    allow: [{ rid: "io.picolabs.wrangler", name: "*" }],
    deny: [],
  };
  t.true(
    queryPolicySubsetOf(
      { allow: [{ rid: "io.picolabs.wrangler", name: "myself" }], deny: [] },
      ceiling,
    ),
  );
  t.false(
    queryPolicySubsetOf(
      { allow: [{ rid: "io.picolabs.other", name: "myself" }], deny: [] },
      ceiling,
    ),
  );
});

test("policyCeilingSubsetOf: child ceiling must fit parent", (t) => {
  const parent = {
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  };
  const childOk = {
    eventPolicy: { allow: [{ domain: "foo", name: "bar" }], deny: [] },
    queryPolicy: { allow: [{ rid: "a.b", name: "q" }], deny: [] },
  };
  const childBad = {
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  };
  t.true(policyCeilingSubsetOf(childOk, parent));
  t.false(policyCeilingSubsetOf(childBad, {
    eventPolicy: { allow: [{ domain: "foo", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "a.b", name: "*" }], deny: [] },
  }));
});

test("hasUnrestricted*Allow detects full wildcards", (t) => {
  t.true(
    hasUnrestrictedEventAllow({
      allow: [{ domain: "*", name: "*" }],
      deny: [],
    }),
  );
  t.false(
    hasUnrestrictedEventAllow({
      allow: [{ domain: "x", name: "*" }],
      deny: [],
    }),
  );
  t.true(
    hasUnrestrictedQueryAllow({
      allow: [{ rid: "*", name: "*" }],
      deny: [],
    }),
  );
});
