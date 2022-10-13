import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("__testing", async (t) => {
  const { pe, eci } = await startTestEngine(["testing.krl"]);

  t.deepEqual(
    await pe.pf.query({
      eci,
      rid: "io.picolabs.testing",
      name: "__testing",
      args: {},
    }),
    {
      queries: [{ name: "joke" }],
      event: [
        {
          domain: "say",
          name: "hello",
          attrs: ["name"],
        },
      ],
    }
  );
});
