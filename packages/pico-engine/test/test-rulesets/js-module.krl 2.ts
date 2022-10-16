import test from "ava";
import { krl } from "krl-stdlib";
import { startTestEngine } from "../helpers/startTestEngine";

test("js-module.krl", async (t) => {
  const { signal, mkQuery } = await startTestEngine(["js-module.krl"], {
    modules: {
      myJsModule: {
        // `data = myJsModule:fun0(a, b)`
        fun0: krl.Function(["a", "b"], function (a, b) {
          return a * b;
        }),

        // `myJsModule:act() setting(data)`
        act: krl.Action(["a", "b"], function (a, b) {
          return b / a;
        }),
      },
    },
  });
  const query = mkQuery("io.picolabs.js-module");

  t.deepEqual(await query("qFn", { a: 3 }), 6);
  t.deepEqual(await signal("js_module", "action"), [
    { name: "resp", options: { val: 0.3 } },
  ]);
});
