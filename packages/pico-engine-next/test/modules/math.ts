import test from "ava";
import { KrlCtx } from "krl-stdlib";
import kmath from "../../src/modules/math";
import makeCoreAndKrlCtx from "../helpers/makeCoreAndKrlCtx";

test("module - math:*", async function (t) {
  const { krlCtx: ctx } = await makeCoreAndKrlCtx();

  async function terr(method: string, ctx: KrlCtx, args: any, error: string) {
    try {
      await kmath[method](ctx, args);
      t.fail("should have thrown");
    } catch (err) {
      t.is(err + "", error);
    }
  }

  t.is(await kmath.base64encode(ctx, ["}{"]), "fXs=", "base64encode");
  t.is(
    await kmath.base64encode(ctx, [null]),
    await kmath.base64encode(ctx, ["null"]),
    "base64encode coreces to strings"
  );

  t.is(await kmath.base64decode(ctx, ["fXs="]), "}{", "base64decode");

  t.truthy(Array.isArray(kmath.hashAlgorithms(ctx)));

  t.is(
    await kmath.hash(ctx, ["sha256", "hello"]),
    "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    'sha256 "hello"'
  );
  t.is(
    await kmath.hash(ctx, ["sha256", "hello", "base64"]),
    "LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=",
    'sha256 "hello" base64'
  );
  t.is(
    await kmath.hash(ctx, ["sha256", null]),
    await kmath.hash(ctx, ["sha256", "null"]),
    "sha2 coerces inputs to Strings"
  );
  t.is(
    await kmath.hash(ctx, ["sha256", [1, 2]]),
    await kmath.hash(ctx, ["sha256", "[Array]"]),
    "sha2 coerces inputs to Strings"
  );

  await terr(
    "hash",
    ctx,
    [],
    "TypeError: math:hash was given null instead of a algorithm string"
  );
  await terr(
    "hash",
    ctx,
    [0, null],
    "TypeError: math:hash was given 0 instead of a algorithm string"
  );
  await terr(
    "hash",
    ctx,
    ["0", null],
    "Error: math:hash doesn't recognize the hash algorithm 0"
  );

  t.is(
    await kmath.hmac(ctx, ["sha256", "a secret", "some message"]),
    "86de43245b44531ac38b6a6a691996287d932a8dea03bc69b193b90caf48ff53"
  );
  t.is(
    await kmath.hmac(ctx, ["sha256", "a secret", "some message", "base64"]),
    "ht5DJFtEUxrDi2pqaRmWKH2TKo3qA7xpsZO5DK9I/1M="
  );
  await terr("hmac", ctx, [], "Error: math:hmac needs a key string");
  await terr(
    "hmac",
    ctx,
    ["foo", "", ""],
    "Error: math:hmac doesn't recognize the hash algorithm foo"
  );
  t.is(await kmath.abs(ctx, [0.46]), 0.46);
  t.is(await kmath.abs(ctx, [-0.46]), 0.46);

  t.is(await kmath.ceiling(ctx, [0.46]), 1);
  t.is(await kmath.ceiling(ctx, [-0.46]), -0);

  t.is(await kmath.floor(ctx, [0.46]), 0);
  t.is(await kmath.floor(ctx, [-0.46]), -1);

  t.is(await kmath.int(ctx, [10.46]), 10);
  t.is(await kmath.int(ctx, [-10.46]), -10);

  t.is(await kmath.round(ctx, [0.46]), 0);
  t.is(await kmath.round(ctx, [-0.46]), -0);
  t.is(await kmath.round(ctx, [-0.46, 1]), -0.5);
  t.is(await kmath.round(ctx, [4066, 0]), 4066);
  t.is(await kmath.round(ctx, [4066, -1]), 4070);
  t.is(await kmath.round(ctx, [4066, -2]), 4100);
  t.is(await kmath.round(ctx, [4066, -3]), 4000);
  t.is(await kmath.round(ctx, [4066, -4]), 0);
});
