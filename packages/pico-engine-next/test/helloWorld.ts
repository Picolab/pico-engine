import test from "ava";
import { readTestKrl } from "./helpers/readTestKrl";
import { startTestEngine } from "./helpers/startTestEngine";

test("hello-world.krl", async t => {
  const pe = await startTestEngine();

  const chann = await pe.pf.rootPico.newChannel({
    tags: ["allow-all"],
    eventPolicy: {
      allow: [{ domain: "*", name: "*" }],
      deny: []
    },
    queryPolicy: {
      allow: [{ rid: "*", name: "*" }],
      deny: []
    }
  });
  const eci = chann.id;

  let err = await t.throwsAsync(
    pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: { name: "bob" }
    })
  );
  t.is(err + "", "Error: Pico doesn't have io.picolabs.hello_world installed.");

  const krl = await readTestKrl("hello-world.krl");
  await pe.rsRegistry.publish(krl);

  err = await t.throwsAsync(
    pe.pf.query({
      eci,
      rid: "io.picolabs.hello_world",
      name: "hello",
      args: { name: "bob" }
    })
  );
  t.is(err + "", "Error: Pico doesn't have io.picolabs.hello_world installed.");

  await pe.pf.rootPico.install("io.picolabs.hello_world", "0.0.0");

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
