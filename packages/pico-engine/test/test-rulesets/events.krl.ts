import test from "ava";
import { cleanDirectives } from "../helpers/cleanDirectives";
import { startTestEngine } from "../helpers/startTestEngine";

test("events.krl", async (t) => {
  const { pe, eci, signal, mkQuery } = await startTestEngine(["events.krl"]);

  const query = mkQuery("io.picolabs.events");

  t.deepEqual(await signal("events", "bind", { name: "blah?!" }), [
    { name: "bound", options: { name: "blah?!" } },
  ]);

  t.deepEqual(await signal("events", "get", { thing: "asdf" }), [
    { name: "get", options: { thing: "asdf" } },
  ]);

  t.deepEqual(await signal("events", "noop", {}), []);

  t.deepEqual(await signal("events", "noop2", {}), []);
  t.deepEqual(await signal("events", "ignored", {}), []); // is inactive

  t.deepEqual(await signal("events", "ifthen", { name: "something" }), [
    { name: "ifthen", options: {} },
  ]);

  t.deepEqual(await signal("events", "ifthen", {}), []);

  t.deepEqual(await signal("events", "on_fired", { name: "blah" }), [
    { name: "on_fired", options: { previous_name: null } },
  ]);

  t.deepEqual(await signal("events", "on_fired", {}), [
    { name: "on_fired", options: { previous_name: "blah" } },
  ]);

  t.deepEqual(await signal("events", "on_choose", { thing: "one" }), [
    { name: "on_choose - one", options: {} },
  ]);

  t.deepEqual(await query("getOnChooseFired"), true);

  t.deepEqual(await signal("events", "on_choose", { thing: "two" }), [
    { name: "on_choose - two", options: {} },
  ]);

  t.deepEqual(await signal("events", "on_choose", { thing: "wat?" }), []);

  t.deepEqual(await query("getOnChooseFired"), true); // still true even though no match

  t.deepEqual(
    await signal("events", "on_choose_if", { fire: "no", thing: "one" }),
    [],
    "condition failed"
  );

  t.deepEqual(await query("getOnChooseFired"), false); // b/c condition failed

  t.deepEqual(
    await signal("events", "on_choose_if", { fire: "yes", thing: "one" }),
    [{ name: "on_choose_if - one", options: {} }]
  );

  t.deepEqual(await query("getOnChooseFired"), true);

  t.deepEqual(
    await signal("events", "on_choose_if", { fire: "yes", thing: "wat?" }),
    []
  );

  t.deepEqual(await query("getOnChooseFired"), true); // b/c condition true

  let resp = await signal("events", "on_sample");
  t.is(resp.length, 1, "only one action should be sampled");
  t.truthy(/^on_sample - (one|two|three)$/.test(resp[0].name));

  t.deepEqual(await signal("events", "on_sample_if"), []); // nothing b/c it did not fire

  resp = await signal("events", "on_sample_if", { fire: "yes" });
  t.is(resp.length, 1, "only one action should be sampled");
  t.truthy(/^on_sample - (one|two|three)$/.test(resp[0].name));

  t.deepEqual(await signal("events", "select_where", { something: "wat?" }), [
    { name: "select_where", options: {} },
  ]);

  t.deepEqual(
    await signal("events", "select_where", { something: "ok wat?" }),
    []
  );

  t.deepEqual(await signal("events", "where_match_0", { something: 0 }), [
    { name: "where_match_0", options: {} },
  ]);

  t.deepEqual(await signal("events", "where_match_null", { something: null }), [
    { name: "where_match_null", options: {} },
  ]);

  t.deepEqual(
    await signal("events", "where_match_false", { something: false }),
    [{ name: "where_match_false", options: {} }]
  );
  t.deepEqual(
    await signal("events", "where_match_empty_str", { something: "" }),
    [{ name: "where_match_empty_str", options: {} }]
  );
  t.deepEqual(await signal("events", "where_after_setting", { a: "one" }), [
    { name: "where_after_setting", options: {} },
  ]);
  t.deepEqual(await signal("events", "where_after_setting", { a: "two" }), []);

  // test that select() scope overrides the global scope
  t.deepEqual(await signal("events", "where_using_global", { a: "g one" }), [
    { name: "where_using_global", options: {} },
  ]);

  // test that event:attr scope doesn't stomp over global
  t.deepEqual(
    await signal("events", "where_using_global", {
      a: "g one",
      global1: "haha! if this works the rule will not select",
    }),
    [{ name: "where_using_global", options: {} }]
  );

  // test that event:attr scope doesn't stomp over setting()
  t.deepEqual(
    await signal("events", "where_using_global", {
      a: "g one",
      global0: "haha! if this works the rule will not select",
    }),
    [{ name: "where_using_global", options: {} }]
  );

  t.deepEqual(await signal("events", "implicit_match_0", { something: 0 }), [
    { name: "implicit_match_0", options: {} },
  ]);

  t.deepEqual(
    await signal("events", "implicit_match_null", { something: null }),
    [{ options: {}, name: "implicit_match_null" }]
  );

  t.deepEqual(
    await signal("events", "implicit_match_false", { something: false }),
    [{ options: {}, name: "implicit_match_false" }]
  );

  t.deepEqual(
    await signal("events", "implicit_match_empty_str", { something: "" }),
    [{ options: {}, name: "implicit_match_empty_str" }]
  );

  t.deepEqual(await signal("events", "no_action", { fired: "no" }), []);

  t.deepEqual(await query("getNoActionFired"), null);

  t.deepEqual(await signal("events", "no_action", { fired: "yes" }), []);

  t.deepEqual(await query("getNoActionFired"), true); // fired even though no actions

  // Testing action ctx:event
  t.deepEqual(await signal("events", "store_sent_name", { name: "Bob" }), []);
  t.deepEqual(await query("getSentAttrs"), { name: "Bob" });
  t.deepEqual(await query("getSentName"), "Bob");
  t.deepEqual(await signal("events", "action_send", { name: "Jim" }), []);
  // this should in turn call store_sent_name and change it
  t.deepEqual(await query("getSentAttrs"), {
    name: "Jim",
    empty: [],
    r: {},
  });
  t.deepEqual(await query("getSentName"), "Jim");

  /////////////////////////////////////////////////////////////////////////////
  // Testing raise <domain> event
  t.deepEqual(await signal("events", "raise_basic"), [
    { name: "event_attrs", options: { attrs: {} } },
  ]);

  t.deepEqual(await signal("events", "raise_set_name", { name: "Raised" }), []);
  t.deepEqual(await query("getSentAttrs"), { name: "Raised" });
  t.deepEqual(await query("getSentName"), "Raised");

  t.deepEqual(
    await signal("events", "raise_set_name_attr", { name: "Raised-2" }),
    []
  );
  t.deepEqual(await query("getSentAttrs"), { name: "Raised-2" });
  t.deepEqual(await query("getSentName"), "Raised-2");

  t.deepEqual(
    await signal("events", "raise_set_name_rid", { name: "Raised-3" }),
    []
  );
  t.deepEqual(await query("getSentAttrs"), { name: "Raised-3" });
  t.deepEqual(await query("getSentName"), "Raised-3");

  /////////////////////////////////////////////////////////////////////////////
  // Testing raise event <domainAndType>

  t.deepEqual(
    await signal("events", "raise_dynamic", {
      domainType: "events:store_sent_name",
      name: "Mr. Dynamic",
    }),
    []
  );
  t.deepEqual(await query("getSentName"), "Mr. Dynamic");

  t.deepEqual(
    await signal("events", "raise_dynamic", {
      domainType: "events:get",
      thing: "something?",
    }),
    [{ name: "get", options: { thing: "something?" } }]
  );

  /////////////////////////////////////////////////////////////////////////////
  const resp2 = await pe.pf.eventWait({
    eci,
    domain: "events",
    name: "event_eid",
    data: { attrs: {} },
    time: 0,
  });
  t.deepEqual(cleanDirectives(resp2.responses), [
    { name: "event_eid", options: { eid: resp2.eid } },
  ]);
});
