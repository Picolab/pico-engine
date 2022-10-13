import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";

test("io.picolabs.test-error-messages.krl", async (t) => {
  const { pe, eci } = await startTestEngine([
    "io.picolabs.test-error-messages.krl",
  ]);

  let err = await t.throwsAsync(pe.pf.query(void 0 as any));
  t.is(err + "", "Error: missing query.eci");

  err = await t.throwsAsync(pe.pf.query({ eci: null } as any));
  t.is(err + "", "Error: missing query.eci");

  err = await t.throwsAsync(
    pe.pf.query({
      eci: "foo",
      rid: "not-an-rid",
      name: "hello",
      args: {},
    } as any)
  );
  t.is(err + "", "Error: ECI not found foo");

  err = await t.throwsAsync(
    pe.pf.query({
      eci: eci,
      rid: "not-an-rid",
      name: "hello",
      args: {},
    } as any)
  );
  t.is(err + "", "Error: Pico doesn't have not-an-rid installed.");

  err = await t.throwsAsync(
    pe.pf.query({
      eci,
      rid: "io.picolabs.test-error-messages",
      name: "zzz",
      args: { obj: "Bob" },
    })
  );
  t.is(
    err + "",
    'Error: Ruleset io.picolabs.test-error-messages does not have query function "zzz"'
  );

  err = await t.throwsAsync(
    pe.pf.query({
      eci,
      rid: "io.picolabs.test-error-messages",
      name: "infiniteRecursion",
      args: {},
    })
  );
  t.is(err + "", "RangeError: Maximum call stack size exceeded");
});
