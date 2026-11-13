/**
 * KRL csv module builtins.
 */

import test from "ava";
import kcsv from "../../src/modules/csv";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

test("module - csv:*", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();
  const data = [
    { name: "school", cost: "2.02", start: "-111.712441, 40.332897", category: "business" },
    { cost: "0.63", name: "shopping", start: "-111.687001, 40.334647", category: "" },
  ];

  t.is(
    await kcsv.from_array(ctx, [data]),
    "name,cost,start,category\n" +
      'school,2.02,"-111.712441, 40.332897",business\n' +
      'shopping,0.63,"-111.687001, 40.334647",\n',
    "columns in first-seen key order; values with commas quoted"
  );
  t.is(await kcsv.from_array(ctx, [data, ["category", "name"]]), "category,name\nbusiness,school\n,shopping\n");
  t.is(
    await kcsv.from_array(ctx, [[{ a: 'say "hi"', b: null, c: { x: 1 }, d: 3 }]]),
    'a,b,c,d\n"say ""hi""",,"{""x"":1}",3\n',
    "quotes doubled, null empty, maps as JSON, numbers as text"
  );
  t.is(await kcsv.from_array(ctx, [[]]), "\n");
  await t.throwsAsync(async () => kcsv.from_array(ctx, ["nope"]), { message: /expected an array/ });

  t.deepEqual(await kcsv.to_array(ctx, ["name,note\nAda,\"one, two\"\r\nBob,\"line\nbreak\"\n\nCy\n"]), [
    { name: "Ada", note: "one, two" },
    { name: "Bob", note: "line\nbreak" },
    { name: "Cy", note: "" },
  ]);
  const round = await kcsv.from_array(ctx, [data]);
  t.deepEqual(await kcsv.to_array(ctx, [round]), data, "to_array reads what from_array writes");
  t.deepEqual(await kcsv.to_array(ctx, [""]), []);
});
