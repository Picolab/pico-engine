/**
 * Custom channel id at creation time.
 */

import test from "ava";
import { PicoFramework } from "../src";
import { validateCustomChannelId } from "../src/Channel";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";
import { testPicoFramework } from "./helpers/testPicoFramework";

test("validateCustomChannelId accepts valid ids", (t) => {
  t.is(validateCustomChannelId("abcdefghijkl"), "abcdefghijkl");
  t.is(validateCustomChannelId("  my_webhook-01  "), "my_webhook-01");
});

test("validateCustomChannelId rejects invalid ids", (t) => {
  t.throws(() => validateCustomChannelId("short"), {
    message: "Channel id must be at least 12 characters.",
  });
  t.throws(() => validateCustomChannelId("has spaces_here"), {
    message:
      "Channel id may only contain letters, digits, hyphen, and underscore.",
  });
  t.throws(() => validateCustomChannelId(""), {
    message: "Channel id cannot be empty.",
  });
});

test("newChannel uses custom id when provided", async (t) => {
  const { pf } = await testPicoFramework([]);
  const root = pf.rootPicos()[0];
  const customId = "my-test-hook-01";

  const chann = await root.newChannel({
    id: customId,
    tags: ["hook"],
  });

  t.is(chann.id, customId);
  t.is(pf.lookupChannel(customId).pico.id, root.id);
});

test("newChannel rejects duplicate custom id engine-wide", async (t) => {
  const { pf } = await testPicoFramework([]);
  const root = pf.rootPicos()[0];
  const customId = "duplicate-id-01";

  await root.newChannel({ id: customId, tags: ["one"] });

  const childEci = await root.newPico();
  const child = pf.getPico(childEci);

  const err = await t.throwsAsync(
    child.newChannel({ id: customId, tags: ["two"] }),
  );
  t.is(err?.message, `Channel id already in use: ${customId}`);
});

test("newChannel rejects custom id matching a pico id", async (t) => {
  let n = 0;
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: rulesetRegistry().loader,
    genID: () => `pico-${String(++n).padStart(8, "0")}`,
  });
  await pf.start();
  const root = pf.rootPicos()[0];
  const childEci = await root.newPico();
  const child = pf.getPico(childEci);

  const err = await t.throwsAsync(
    root.newChannel({ id: child.id, tags: ["reserved"] }),
  );
  t.is(err?.message, `Channel id already in use: ${child.id}`);
});

test("family channels ignore custom id", async (t) => {
  const { pf } = await testPicoFramework([]);
  const root = pf.rootPicos()[0];
  const childEci = await root.newPico();
  const child = pf.getPico(childEci);

  const familyChannel = Object.values(child.channels).find(
    (c) => c.familyChannelPicoID === root.id,
  );
  t.truthy(familyChannel);
  t.not(familyChannel!.id, "family-should-not-use-this");
});
