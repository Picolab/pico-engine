/**
 * PicoQuery normalization via cleanQuery.
 */

import test from "ava";
import { cleanQuery } from "../src/PicoQuery";

test("query = cleanQuery(query)", function (t) {
  try {
    cleanQuery(null);
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.eci");
  }
  try {
    cleanQuery({ eci: 0 });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.eci");
  }
  try {
    cleanQuery({ eci: "" });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.eci");
  }
  try {
    cleanQuery({ eci: "  " });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.eci");
  }
  try {
    cleanQuery({ eci: "eci-1", rid: "" });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.rid");
  }
  try {
    cleanQuery({ eci: "eci-1", rid: "foo" });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.name");
  }
  try {
    cleanQuery({ eci: "eci-1", rid: "foo", name: " " });
    t.fail("should throw");
  } catch (e) {
    t.is(e + "", "Error: missing query.name");
  }

  // bare minimum
  t.deepEqual(
    cleanQuery({
      eci: "eci123",
      rid: "foo",
      name: "bar",
    }),
    {
      eci: "eci123",
      rid: "foo",
      name: "bar",
      args: {},
    }
  );

  // args - should not be mutable
  var args = { what: { is: ["this"] } };
  var query = cleanQuery({
    eci: "eci123",
    rid: "foo",
    name: "bar",
    args: args,
  });
  t.deepEqual(query, {
    eci: "eci123",
    rid: "foo",
    name: "bar",
    args: args,
  });
  t.deepEqual(query.args, args, "they should match before query.args mutates");
  query.args.what = "blah";
  t.notDeepEqual(query.args, args, "oops, args was mutable");

  // trim up inputs
  t.deepEqual(
    cleanQuery({
      eci: "  eci123   ",
      rid: "  foo\n ",
      name: "  \t bar  ",
      args: { " foo ": " don't trim these   " },
    }),
    {
      eci: "eci123",
      rid: "foo",
      name: "bar",
      args: { " foo ": " don't trim these   " },
    }
  );

  // no timestamp
  t.deepEqual(
    cleanQuery({
      eci: "eci123",
      rid: "foo",
      name: "bar",
      timestamp: new Date(),
    }),
    {
      eci: "eci123",
      rid: "foo",
      name: "bar",
      args: {},
    }
  );

  // no for_rid
  t.deepEqual(
    cleanQuery({
      eci: "eci123",
      rid: "foo",
      name: "bar",
      for_rid: "rid",
    }),
    {
      eci: "eci123",
      rid: "foo",
      name: "bar",
      args: {},
    }
  );

  function cleanArgs(args: any) {
    return cleanQuery({
      eci: "eci123",
      rid: "foo",
      name: "bar",
      args,
    }).args;
  }

  for (const val of [() => 1, null, 1, '{"one":1}', [1, 2]]) {
    t.throws(
      () => cleanArgs(val),
      { instanceOf: Error, message: "Expected a JSON map for query.args" },
      JSON.stringify(val) + " should fail"
    );
  }

  const a = { one: 2 };
  const b = cleanArgs(a);
  t.false(a === b, "must be a clone");
  // @ts-ignore
  t.deepEqual(a, b);
  b.extra = 3;
  t.notDeepEqual(a, b);

  t.deepEqual(
    cleanArgs({
      one: 2,
      three: function () {},
    }),
    { one: 2 },
    "remove non-jsonable things"
  );

  t.deepEqual(
    cleanArgs({ a: null, b: NaN, c: void 0 }),
    { a: null, b: null },
    "args normalize to JSON null's"
  );

  (function (a, b) {
    t.deepEqual(
      cleanArgs(arguments),
      { "0": "foo", "1": "bar" },
      'non "plain" objects work as Maps'
    );
  })("foo", "bar");
});
