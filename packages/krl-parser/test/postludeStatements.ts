import test from "ava";
import { parseRuleset } from "../src/krl";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";
const mk = require("./helpers/astMaker");
const rmLoc = require("./helpers/rmLoc");

function parseRulesetBody(src: string, map?: (node: ast.Ruleset) => any) {
  try {
    const node = parseRuleset(tokenizer(`ruleset a{${src}}`));
    return rmLoc(map ? map(node) : node);
  } catch (err) {
    return `${err}|${err.token.type}|${err.token.src}|${err.token.loc.start}`;
  }
}

function makeTestPostlude(t: any) {
  return function(srcCore: string, expected: any) {
    var src = "rule a{ fired{" + srcCore + "}}";

    t.deepEqual(
      parseRulesetBody(
        src,
        rs => rs.rules[0].postlude && rs.rules[0].postlude.fired
      ),
      expected
    );
  };
}

test("ClearPersistentVariable", t => {
  var testPostlude = makeTestPostlude(t);

  testPostlude("clear ent:foo", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("ent", "foo"),
      path_expression: null
    }
  ]);

  testPostlude("clear app:bar", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("app", "bar"),
      path_expression: null
    }
  ]);

  testPostlude("clear app:bar{key}", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("app", "bar"),
      path_expression: mk.id("key")
    }
  ]);

  testPostlude("clear app:bar{[key]}", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("app", "bar"),
      path_expression: { type: "Array", value: [mk.id("key")] }
    }
  ]);
});

test("LastStatement", t => {
  var testPostlude = makeTestPostlude(t);

  testPostlude("last", [
    {
      type: "LastStatement"
    }
  ]);

  testPostlude("last if(x==4)", [
    {
      type: "GuardCondition",
      condition: mk.op("==", mk.id("x"), mk(4)),
      statement: {
        type: "LastStatement"
      }
    }
  ]);

  testPostlude("last if x == 4", [
    {
      type: "GuardCondition",
      condition: mk.op("==", mk.id("x"), mk(4)),
      statement: {
        type: "LastStatement"
      }
    }
  ]);
});

test("LogStatement", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('log info "foo"', [
    {
      type: "LogStatement",
      level: "info",
      expression: mk("foo")
    }
  ]);

  testPostlude('log error {"baz": [1, 2]}', [
    {
      type: "LogStatement",
      level: "error",
      expression: mk({ baz: mk([1, 2]) })
    }
  ]);
});

test("ErrorStatement", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('error error "foo"', [
    {
      type: "ErrorStatement",
      level: "error",
      expression: mk("foo")
    }
  ]);

  testPostlude('error warn {"baz": [1, 2]}', [
    {
      type: "ErrorStatement",
      level: "warn",
      expression: mk({ baz: mk([1, 2]) })
    }
  ]);

  testPostlude("error info info", [
    {
      type: "ErrorStatement",
      level: "info",
      expression: mk.id("info")
    }
  ]);

  testPostlude("error debug debug()", [
    {
      type: "ErrorStatement",
      level: "debug",
      expression: mk.app(mk.id("debug"))
    }
  ]);
});

test("raise event", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('raise domain event "type"', [
    {
      type: "RaiseEventStatement",
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      for_rid: null,
      event_attrs: null
    }
  ]);

  testPostlude('raise domain event "type" for "io.picolabs.test"', [
    {
      type: "RaiseEventStatement",
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      for_rid: mk("io.picolabs.test"),
      event_attrs: null
    }
  ]);

  testPostlude('raise domain event "type" attributes {"a":1,"b":2}', [
    {
      type: "RaiseEventStatement",
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      for_rid: null,
      event_attrs: mk({ a: mk(1), b: mk(2) })
    }
  ]);

  // dynamic event domain and type

  testPostlude('raise event "foo:bar"', [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk("foo:bar"),
      for_rid: null,
      event_attrs: null
    }
  ]);

  testPostlude('raise event "foo:bar" for "some.rid.ok"', [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk("foo:bar"),
      for_rid: mk("some.rid.ok"),
      event_attrs: null
    }
  ]);

  testPostlude('raise event "foo:bar" attributes {"a":1,"b":2}', [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk("foo:bar"),
      for_rid: null,
      event_attrs: mk({ a: mk(1), b: mk(2) })
    }
  ]);

  testPostlude(
    'raise event "foo:bar" for "some.rid.ok" attributes {"a":1,"b":2}',
    [
      {
        type: "RaiseEventStatement",
        event_domainAndType: mk("foo:bar"),
        for_rid: mk("some.rid.ok"),
        event_attrs: mk({ a: mk(1), b: mk(2) })
      }
    ]
  );

  testPostlude("raise event event", [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk.id("event"),
      for_rid: null,
      event_attrs: null
    }
  ]);

  testPostlude("raise event event attributes {}", [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk.id("event"),
      for_rid: null,
      event_attrs: mk({})
    }
  ]);
});

test("schedule event", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('schedule domain event "type" at "time"', [
    {
      type: "ScheduleEventStatement",
      at: mk("time"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: null
    }
  ]);

  testPostlude(
    'schedule domain event "type" at "time" attributes {"a":1,"b":2}',
    [
      {
        type: "ScheduleEventStatement",
        at: mk("time"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({ a: mk(1), b: mk(2) }),
        setting: null
      }
    ]
  );

  testPostlude('schedule domain event "type" at "time" setting(foo)', [
    {
      type: "ScheduleEventStatement",
      at: mk("time"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: mk.id("foo")
    }
  ]);

  testPostlude(
    'schedule domain event "type" at "time" attributes {} setting(foo)',
    [
      {
        type: "ScheduleEventStatement",
        at: mk("time"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({}),
        setting: mk.id("foo")
      }
    ]
  );

  testPostlude('schedule domain event "type" repeat "5 0 * * *"', [
    {
      type: "ScheduleEventStatement",
      timespec: mk("5 0 * * *"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: null
    }
  ]);

  testPostlude(
    'schedule domain event "type" repeat "5 0 * * *" attributes {"a":1,"b":2}',
    [
      {
        type: "ScheduleEventStatement",
        timespec: mk("5 0 * * *"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({ a: mk(1), b: mk(2) }),
        setting: null
      }
    ]
  );

  testPostlude('schedule domain event "type" repeat "5 0 * * *" setting(foo)', [
    {
      type: "ScheduleEventStatement",
      timespec: mk("5 0 * * *"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: mk.id("foo")
    }
  ]);

  testPostlude(
    'schedule domain event "type" repeat "5 0 * * *" attributes {} setting(foo)',
    [
      {
        type: "ScheduleEventStatement",
        timespec: mk("5 0 * * *"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({}),
        setting: mk.id("foo")
      }
    ]
  );

  testPostlude('schedule event "foo:bar" at "sometime"', [
    {
      type: "ScheduleEventStatement",
      at: mk("sometime"),
      event_domainAndType: mk("foo:bar"),
      event_attrs: null,
      setting: null
    }
  ]);

  testPostlude('schedule event "foo:bar" repeat "5 0 * * *"', [
    {
      type: "ScheduleEventStatement",
      timespec: mk("5 0 * * *"),
      event_domainAndType: mk("foo:bar"),
      event_attrs: null,
      setting: null
    }
  ]);
});

test("GuardCondition", t => {
  const testPost = makeTestPostlude(t);

  testPost('raise domain event "type" on final', [
    {
      type: "GuardCondition",
      condition: "on final",
      statement: {
        type: "RaiseEventStatement",
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        for_rid: null,
        event_attrs: null
      }
    }
  ]);

  testPost("ent:foo := bar on final", [
    {
      type: "GuardCondition",
      condition: "on final",
      statement: {
        type: "PersistentVariableAssignment",
        op: ":=",
        left: mk.dID("ent", "foo"),
        path_expression: null,
        right: mk.id("bar")
      }
    }
  ]);

  testPost("foo = bar on final", [
    {
      type: "GuardCondition",
      condition: "on final",
      statement: mk.declare("=", mk.id("foo"), mk.id("bar"))
    }
  ]);

  testPost("foo = bar if baz > 0", [
    {
      type: "GuardCondition",
      condition: mk.op(">", mk.id("baz"), mk(0)),
      statement: mk.declare("=", mk.id("foo"), mk.id("bar"))
    }
  ]);

  testPost("ent:foo := bar if baz > 0", [
    {
      type: "GuardCondition",
      condition: mk.op(">", mk.id("baz"), mk(0)),
      statement: {
        type: "PersistentVariableAssignment",
        op: ":=",
        left: mk.dID("ent", "foo"),
        path_expression: null,
        right: mk.id("bar")
      }
    }
  ]);

  testPost('raise domain event "type" if baz > 0', [
    {
      type: "GuardCondition",
      condition: mk.op(">", mk.id("baz"), mk(0)),
      statement: {
        type: "RaiseEventStatement",
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        for_rid: null,
        event_attrs: null
      }
    }
  ]);
});

test("PersistentVariableAssignment", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude("ent:name := 1", [
    {
      type: "PersistentVariableAssignment",
      op: ":=",
      left: mk.dID("ent", "name"),
      path_expression: null,
      right: mk(1)
    }
  ]);

  testPostlude('ent:user{["firstname"]} := "bob"', [
    {
      type: "PersistentVariableAssignment",
      op: ":=",
      left: mk.dID("ent", "user"),
      path_expression: mk(["firstname"]),
      right: mk("bob")
    }
  ]);
});
