/**
 * PicoEvent normalization via cleanEvent.
 */

import test from "ava";
import { cleanEvent } from "../src/PicoEvent";

test("event = cleanEvent(event)", function(t) {
  try {
    cleanEvent(null);
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.eci");
  }
  try {
    cleanEvent({ eci: 0 });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.eci");
  }
  try {
    cleanEvent({ eci: "" });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.eci");
  }
  try {
    cleanEvent({ eci: "  " });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.eci");
  }
  try {
    cleanEvent({ eci: "eci-1", domain: "" });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.domain");
  }
  try {
    cleanEvent({ eci: "eci-1", domain: "foo" });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.name");
  }
  try {
    cleanEvent({ eci: "eci-1", domain: "foo", name: " " });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing event.name");
  }

  // bare minimum
  t.deepEqual(
    cleanEvent(
      {
        eci: "eci123",
        domain: "foo",
        name: "bar"
      },
      123
    ),
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs: {} },
      time: 123
    }
  );

  // attrs can be null or undefined
  t.deepEqual(
    cleanEvent(
      {
        eci: "eci123",
        domain: "foo",
        name: "bar",
        data: { attrs: null }
      },
      123
    ),
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs: {} },
      time: 123
    }
  );
  t.deepEqual(
    cleanEvent(
      {
        eci: "eci123",
        domain: "foo",
        name: "bar",
        data: { attrs: undefined }
      },
      123
    ),
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs: {} },
      time: 123
    }
  );

  // attrs - should not be mutable
  const attrs = { what: { is: ["this"] } };
  const event = cleanEvent(
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs }
    },
    1010
  );
  t.deepEqual(event, {
    eci: "eci123",
    domain: "foo",
    name: "bar",
    data: { attrs },
    time: 1010
  });
  if (!event.data) {
    throw new Error("missing event.data");
  }
  t.deepEqual(
    event.data.attrs,
    attrs,
    "they should match before event.data.attrs mutates"
  );
  event.data.attrs.what = "blah";
  t.notDeepEqual(event.data.attrs, attrs, "oops, attrs was mutable");

  // trim up inputs
  t.deepEqual(
    cleanEvent(
      {
        eci: "  eci123   ",
        domain: "  foo\n ",
        name: "  \t bar  ",
        data: { attrs: { " foo ": " don't trim these   " } }
      },
      1010
    ),
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs: { " foo ": " don't trim these   " } },
      time: 1010
    }
  );

  // no timestamp
  t.deepEqual(
    cleanEvent(
      {
        eci: "eci123",
        domain: "foo",
        name: "bar",
        timestamp: new Date(),
        time: 54321
      },
      1122
    ),
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs: {} },
      time: 1122
    }
  );

  // no for_rid
  t.deepEqual(
    cleanEvent(
      {
        eci: "eci123",
        domain: "foo",
        name: "bar",
        for_rid: "rid"
      },
      1212
    ),
    {
      eci: "eci123",
      domain: "foo",
      name: "bar",
      data: { attrs: {} },
      time: 1212
    }
  );

  function cleanAttrs(attrs: any) {
    const e = cleanEvent(
      {
        eci: "eci123",
        domain: "foo",
        name: "bar",
        data: { attrs }
      },
      1212
    );
    return e.data && e.data.attrs;
  }

  t.deepEqual(cleanAttrs(null), {}, "null attrs defaults to {}");
  t.deepEqual(cleanAttrs(undefined), {}, "undefined attrs defaults to {}");

  for (const val of [() => 1, 1, '{"one":1}', [1, 2]]) {
    t.throws(
      () => cleanAttrs(val),
      {
        instanceOf: Error,
        message: "Expected a JSON map for event.data.attrs"
      },
      JSON.stringify(val) + " should fail"
    );
  }

  t.deepEqual(
    cleanAttrs({
      one: 2,
      three: function() {}
    }),
    { one: 2 },
    "remove non-jsonable things"
  );

  t.deepEqual(
    cleanAttrs({ a: null, b: NaN, c: void 0 }),
    { a: null, b: null },
    "attrs normalize to JSON null's"
  );

  (function(a, b) {
    t.deepEqual(
      cleanAttrs(arguments),
      { "0": "foo", "1": "bar" },
      'non "plain" objects should work as Maps'
    );
  })("foo", "bar");
});
