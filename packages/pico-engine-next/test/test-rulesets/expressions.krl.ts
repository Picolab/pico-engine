import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";
import * as krl from "../../src/krl";

test("expressions.krl", async t => {
  let directives: any[] = [];

  const { pe, eci } = await startTestEngine(["expressions.krl"], {
    modules: {
      custom: {
        send_directive: krl.Action(["name", "options"], (name, options) => {
          const directive = { name, options };
          directives.push(directive);
          return directive;
        })
      }
    }
  });

  function query(name: string, args: any = {}) {
    return pe.pf.query({
      eci,
      rid: "io.picolabs.expressions",
      name,
      args
    });
  }

  t.deepEqual(await query("obj"), {
    a: 1,
    b: { c: [2, 3, 4, { d: { e: 5 } }, 6, 7] }
  });

  t.deepEqual(await query("path1"), { e: 5 });

  t.deepEqual(await query("path2"), 7);

  t.deepEqual(await query("index1"), 1);
  t.deepEqual(await query("index2"), 3);

  t.deepEqual(await query("paramFnTest"), [
    [4, 6, "6?"],
    ["one", "one2", "one2?"],
    [3, 4, 5]
  ]);
});
