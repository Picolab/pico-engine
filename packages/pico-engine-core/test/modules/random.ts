import test from "ava";
import { krl } from "krl-stdlib";
import krandom from "../../src/modules/random";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

var assertNumRange = function (
  n: any,
  low: any,
  high: any,
  shouldBeInt?: boolean
) {
  if (krl.isNumber(n) && n >= low && n <= high) {
    if (shouldBeInt && n % 1 !== 0) {
      throw new Error("not an int: " + n);
    }
    return true;
  }
  throw new Error("invalid number range: " + low + " <= " + n + " <= " + high);
};

test("module - random:*", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();

  var i;
  for (i = 0; i < 5; i++) {
    t.truthy(/^c[^\s]+$/.test(await krandom.uuid(ctx, [])));
    t.truthy(/^[^\s]+$/.test(await krandom.word(ctx, [])));
  }

  // just throwup when there is a fail, so we don't polute the tap log with 100s of asserts
  var n;
  for (i = 0; i < 100; i++) {
    n = await krandom.integer(ctx, []);
    assertNumRange(n, 0, 1, true);

    n = await krandom.integer(ctx, [0]);
    assertNumRange(n, 0, 0, true);

    n = await krandom.integer(ctx, [10]);
    assertNumRange(n, 0, 10, true);

    n = await krandom.integer(ctx, [-7]);
    assertNumRange(n, -7, 0, true);

    n = await krandom.integer(ctx, [-3, 5]);
    assertNumRange(n, -3, 5, true);

    n = await krandom.integer(ctx, [-3, "five"]);
    assertNumRange(n, -3, 0, true);

    n = await krandom.integer(ctx, ["4.49", -8]);
    assertNumRange(n, -8, 4, true);

    n = await krandom.integer(ctx, ["four", -8.49]);
    assertNumRange(n, -8, 0, true);

    n = await krandom.number(ctx, []);
    assertNumRange(n, 0, 1);

    n = await krandom.number(ctx, [0]);
    assertNumRange(n, 0, 0);

    n = await krandom.number(ctx, [7]);
    assertNumRange(n, 0, 7);

    n = await krandom.number(ctx, [-1.2]);
    assertNumRange(n, -1.2, 0);

    n = await krandom.number(ctx, [-3, 5]);
    assertNumRange(n, -3, 5);

    n = await krandom.integer(ctx, [-3, "five"]);
    assertNumRange(n, -3, 0, true);

    n = await krandom.integer(ctx, ["four", -8]);
    assertNumRange(n, -8, 0, true);

    n = await krandom.number(ctx, [9.87, "-3.6"]);
    assertNumRange(n, -3.6, 9.87);
  }
  // if an assert hasn't thrown up by now, we're good
  t.truthy(true, "random:integer passed");
  t.truthy(true, "random:number passed");
});
