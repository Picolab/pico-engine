import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("hello-world.krl", async t => {
  const { pe, eci, installTestFile } = await startTestEngine();

  let err = await t.throwsAsync(
    pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: { name: "bob" }
    })
  );
  t.is(err + "", "Error: Pico doesn't have io.picolabs.hello_world installed.");

  err = await t.throwsAsync(
    pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: { name: "bob" }
    })
  );
  t.is(err + "", "Error: Pico doesn't have io.picolabs.hello_world installed.");

  await installTestFile(pe.pf.rootPico, "hello-world.krl");

  t.is(
    await pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: { name: "bob" }
    }),
    "Hello bob"
  );

  t.is(
    await pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: {}
    }),
    "Hello default"
  );

  t.is(
    await pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: {}
    }),
    "Hello default"
  );

  t.is(
    await pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "said",
      args: {}
    }),
    null
  );

  await pe.pf.eventWait({
    eci,
    domain: "say",
    name: "hello",
    data: { attrs: { name: "said something ok" } },
    time: 0
  });

  t.is(
    await pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "said",
      args: {}
    }),
    "said something ok"
  );
});
