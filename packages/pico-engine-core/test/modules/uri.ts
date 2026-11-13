/**
 * KRL uri module builtins.
 */

import test from "ava";
import kuri from "../../src/modules/uri";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

test("module - uri:*", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();

  t.is(await kuri.escape(ctx, ["This is a test"]), "This%20is%20a%20test");
  t.is(await kuri.escape(ctx, ["a&b=c/d?é"]), "a%26b%3Dc%2Fd%3F%C3%A9");
  t.is(await kuri.escape(ctx, [42]), "42");
  t.is(await kuri.unescape(ctx, ["This%20is%20a%20test"]), "This is a test");
  t.is(await kuri.unescape(ctx, ["a%26b%3Dc%2Fd%3F%C3%A9"]), "a&b=c/d?é");
  await t.throwsAsync(async () => kuri.unescape(ctx, ["100%"]), { message: /malformed escape/ });
});
