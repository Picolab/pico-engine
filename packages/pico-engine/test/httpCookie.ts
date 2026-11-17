/**
 * http:cookie(name) reads one application cookie. The session cookie and the
 * raw Cookie header do not reach KRL.
 */

import test from "ava";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import fetch from "cross-fetch";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const RID = "io.picolabs.test.cookie_read";

const SRC = `ruleset ${RID} {
  meta { shares seen }
  global {
    seen = function(name, _headers) {
      {
        "value": http:cookie(name),
        "raw": _headers{"cookie"}
      }
    }
  }
  rule show {
    select when cookie check
    fired {
      raise cookie event "echo" attributes { "which": event:attr("which") }
    }
  }
  rule echo {
    select when cookie echo
    send_directive("saw", {"value": http:cookie(event:attr("which"))})
  }
}
`;

test("http:cookie returns an application cookie and not the session", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cookie-read-"));
  const file = path.join(dir, RID + ".krl");
  fs.writeFileSync(file, SRC);
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);
  const eci = "cookie-read-test";
  await pe.pf.eventQuery(
    {
      eci: ui!.id,
      domain: "engine_ui",
      name: "new_channel",
      data: {
        attrs: {
          id: eci,
          tags: ["test"],
          eventPolicy: {
            allow: [
              { domain: "cookie", name: "check" },
              { domain: "cookie", name: "echo" },
            ],
            deny: [],
          },
          queryPolicy: { allow: [{ rid: RID, name: "seen" }], deny: [] },
        },
      },
      time: 0,
    },
    { eci: ui!.id, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} }
  );
  await pe.pf.eventQuery(
    {
      eci: ui!.id,
      domain: "engine_ui",
      name: "install",
      data: { attrs: { url: "file://" + file } },
      time: 0,
    },
    { eci: ui!.id, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} }
  );

  const cookie =
    "wellKnown_Rx=abc123; pico-session-3999=sekret; pair=a=b; pico-ceremony=cer";
  const seen = async (name: string) => {
    const res = await fetch(
      `${pe.base_url}/sky/query/${eci}/${RID}/seen?name=${encodeURIComponent(name)}`,
      { headers: { Cookie: cookie } }
    );
    t.is(res.status, 200);
    return res.json();
  };

  const app = await seen("wellKnown_Rx");
  t.is(app.value, "abc123");
  t.is(app.raw, null);

  const pair = await seen("pair");
  t.is(pair.value, "a=b");

  const session = await seen("pico-session-3999");
  t.is(session.value, null);

  const ceremony = await seen("pico-ceremony");
  t.is(ceremony.value, null);

  const event = await fetch(
    `${pe.base_url}/sky/event/${eci}/none/cookie/check?which=wellKnown_Rx`,
    { headers: { Cookie: cookie } }
  );
  const body = await event.json();
  const directive = (body.directives || []).find((d: { name: string }) => d.name === "saw");
  t.is(directive && directive.options && directive.options.value, "abc123");

  await pe.shutdown();
});
