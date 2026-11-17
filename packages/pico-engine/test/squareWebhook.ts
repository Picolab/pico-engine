/**
 * A channel that keeps the raw body can check a Square-style signature.
 * The signature is HMAC-SHA256 of the notification URL plus the exact body,
 * base64. A tampered body, a bad signature, or a channel that does not keep
 * the body is rejected. The signing key is a secret setting.
 */

import test from "ava";
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const RID = "io.picolabs.test.square_hook";
const KEY = "square-sig-key-test-1";
const OPEN = "square-hook-test";
const CLOSED = "square-hook-closed";
const URL = `https://pay.example/sky/event/${OPEN}/none/square/webhook`;
const BODY = '{"type":"payment.updated", "data":{"id":"abc"}}';

const SRC = `ruleset ${RID} {
  meta {
    use module io.picolabs.pds alias pds
    shares verdict
  }
  global {
    notification_url = "${URL}"
    verdict = function() { ent:verdict || "none" }
  }
  rule verify {
    select when square webhook
    pre {
      key = pds:config_value("signatureKey")
      body = event:raw_body()
      given = event:attr("_headers"){"x-square-hmacsha256-signature"}.defaultsTo("")
      ready = body.typeof() == "String" && key.typeof() == "String"
      expected = ready => math:hmac("sha256", key, notification_url + body, "base64") | ""
      ok = ready && math:timing_safe_equal(expected, given)
    }
    noop()
    fired {
      ent:verdict := ok => "accepted" | "rejected"
    }
  }
}
`;

function sign(body: string): string {
  return crypto.createHmac("sha256", KEY).update(URL + body).digest("base64");
}

test("a signed Square webhook is accepted only with the raw body and the right signature", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "square-hook-"));
  const file = path.join(dir, RID + ".krl");
  fs.writeFileSync(file, SRC);
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"))!;
  const pds = await (async () => {
    const end = Date.now() + 20000;
    for (;;) {
      const found = Object.values(root.channels).find((c) => c.tags.includes("pds"));
      if (found) return found;
      if (Date.now() > end) throw new Error("pds channel was not created");
      await new Promise((r) => setTimeout(r, 50));
    }
  })();

  const policy = {
    eventPolicy: { allow: [{ domain: "square", name: "webhook" }], deny: [] },
    queryPolicy: { allow: [{ rid: RID, name: "verdict" }], deny: [] },
  };
  await pe.pf.eventWait({
    eci: ui.id,
    domain: "engine_ui",
    name: "new_channel",
    data: { attrs: { id: OPEN, tags: ["square"], rawBody: true, ...policy } },
    time: 0,
  });
  await pe.pf.eventWait({
    eci: ui.id,
    domain: "engine_ui",
    name: "new_channel",
    data: { attrs: { id: CLOSED, tags: ["square"], ...policy } },
    time: 0,
  });
  t.true(root.channels[OPEN].rawBody);
  t.false(root.channels[CLOSED].rawBody);

  await pe.pf.eventWait({
    eci: ui.id,
    domain: "engine_ui",
    name: "install",
    data: { attrs: { url: "file://" + file } },
    time: 0,
  });
  await pe.pf.eventWait({
    eci: pds.id,
    domain: "pds",
    name: "add_settings",
    data: {
      attrs: {
        keyed_rid: RID,
        name: "Square",
        data_key: "signatureKey",
        value: KEY,
        secret: true,
      },
    },
    time: 0,
  });

  const post = (eci: string, body: string, signature: string) =>
    fetch(`${pe.base_url}/sky/event/${eci}/none/square/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-square-hmacsha256-signature": signature,
      },
      body,
    });
  const verdict = async () =>
    (await pe.pf.query({
      eci: OPEN,
      rid: RID,
      name: "verdict",
      args: {},
    })) as string;

  const good = sign(BODY);
  t.is((await post(OPEN, BODY, good)).status, 200);
  t.is(await verdict(), "accepted");

  t.is((await post(OPEN, BODY.replace("abc", "zzz"), good)).status, 200);
  t.is(await verdict(), "rejected");

  const flipped = good.slice(0, -1) + (good.endsWith("A") ? "B" : "A");
  t.is((await post(OPEN, BODY, flipped)).status, 200);
  t.is(await verdict(), "rejected");

  t.is((await post(CLOSED, BODY, good)).status, 200);
  t.is(await verdict(), "rejected");

  const listed = (await pe.pf.query({
    eci: pds.id,
    rid: "io.picolabs.pds",
    name: "settings",
    args: { Rid: RID },
  })) as { settings: { data: Record<string, unknown> } };
  t.deepEqual(listed.settings.data.signatureKey, { secret: true, set: true });

  const logs = await pe.pf.query({
    eci: ui.id,
    rid: "io.picolabs.pico-engine-ui",
    name: "logs",
    args: {},
  });
  t.false(JSON.stringify(logs).includes(KEY));

  await pe.shutdown();
});
