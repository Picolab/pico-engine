/**
 * 1.10 §1: /c/* is internal. Host is not a credential, proxy headers are not
 * loopback, and the dev MCP uses the startup internal token.
 */

import test from "ava";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import fetch from "cross-fetch";
import {
  headersForKrl,
  internalTokenPath,
  isDirectLoopbackRequest,
  readInternalToken,
  requestCarriesProxyClientHeaders,
  timingSafeEqualString,
  writeInternalToken,
  type ClientAddressRequest,
} from "../src/internalAccess";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

function req(partial: Partial<ClientAddressRequest> & Pick<ClientAddressRequest, "headers">): ClientAddressRequest {
  return partial;
}

test("direct loopback ignores Host and refuses proxy headers", (t) => {
  t.true(
    isDirectLoopbackRequest(
      req({ ip: "127.0.0.1", headers: { host: "evil.example" } })
    )
  );
  t.true(
    isDirectLoopbackRequest(
      req({ ip: "::ffff:127.0.0.1", headers: {} })
    )
  );
  t.true(
    isDirectLoopbackRequest(
      req({ socket: { remoteAddress: "::1" }, headers: { host: "localhost:3000" } })
    )
  );
  t.false(
    isDirectLoopbackRequest(
      req({
        ip: "203.0.113.5",
        headers: { host: "localhost:3000" },
      })
    ),
    "a spoofed Host from a non-loopback address is not local"
  );
  t.false(
    isDirectLoopbackRequest(
      req({
        ip: "127.0.0.1",
        headers: { "x-forwarded-for": "203.0.113.5" },
      })
    )
  );
  t.false(
    isDirectLoopbackRequest(
      req({ ip: "127.0.0.1", headers: { "x-real-ip": "203.0.113.5" } })
    )
  );
  t.false(
    isDirectLoopbackRequest(
      req({ ip: "127.0.0.1", headers: { forwarded: "for=203.0.113.5" } })
    )
  );
  t.true(
    requestCarriesProxyClientHeaders({ "x-forwarded-for": "" })
  );
  t.false(isDirectLoopbackRequest(req({ ip: "10.0.0.8", headers: {} })));
});

test("headersForKrl drops credential headers and keeps the rest", (t) => {
  const headers = headersForKrl({
    host: "localhost:3000",
    authorization: "Bearer oat_secret",
    "proxy-authorization": "Basic cA==",
    cookie: "pico_session=abc",
    "x-pico-internal": "internal-secret",
    accept: "application/json",
  });
  t.deepEqual(headers, {
    host: "localhost:3000",
    accept: "application/json",
  });
});

test("timingSafeEqualString rejects different lengths and values", (t) => {
  t.true(timingSafeEqualString("abc", "abc"));
  t.false(timingSafeEqualString("abc", "abd"));
  t.false(timingSafeEqualString("abc", "abcd"));
});

test("writeInternalToken stores a 0600 secret", (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "pe-internal-"));
  const token = writeInternalToken(home);
  t.true(token.length >= 32);
  t.is(readInternalToken(home), token);
  const mode = fs.statSync(internalTokenPath(home)).mode & 0o777;
  t.is(mode, 0o600);
  fs.rmSync(home, { recursive: true, force: true });
});

test.serial("unauthenticated /c/ is refused; the internal token is accepted", async (t) => {
  const pe = await startIsolatedEngine({
    autoCreateRootPico: true,
    allowLocalhostChannelBypass: false,
  });
  try {
    const eci = pe.uiECI;
    t.truthy(eci);
    const url = `${pe.base_url}/c/${eci}/query/io.picolabs.pico-engine-ui/name`;

    const spoofed = await fetch(url, { headers: { Host: "localhost:3000" } });
    t.is(spoofed.status, 401);

    const proxied = await fetch(url, {
      headers: { "X-Forwarded-For": "203.0.113.5", "X-Real-IP": "203.0.113.5" },
    });
    t.is(proxied.status, 401);

    const wrong = await fetch(url, { headers: { "X-Pico-Internal": "not-the-token" } });
    t.is(wrong.status, 401);

    const token = readInternalToken(pe.home);
    t.truthy(token);
    const authed = await fetch(url, { headers: { "X-Pico-Internal": token! } });
    t.is(authed.status, 200);

    const authedBehindProxy = await fetch(url, {
      headers: {
        "X-Pico-Internal": token!,
        "X-Forwarded-For": "203.0.113.5",
        Forwarded: "for=203.0.113.5",
      },
    });
    t.is(authedBehindProxy.status, 200);

    const devDenied = await fetch(`${pe.base_url}/api/dev/local`);
    t.is(devDenied.status, 403);
    const dev = await fetch(`${pe.base_url}/api/dev/local`, {
      headers: { "X-Pico-Internal": token! },
    });
    t.is(dev.status, 200);
    const devBody = (await dev.json()) as { rootUiEci?: string };
    t.is(devBody.rootUiEci, eci);

    const tryDenied = await fetch(`${pe.base_url}/api/try-it`);
    t.is(tryDenied.status, 401);
    const tryOk = await fetch(`${pe.base_url}/api/try-it`, {
      headers: { "X-Pico-Internal": token! },
    });
    t.is(tryOk.status, 200);

    const ui = (await (await fetch(`${pe.base_url}/api/ui-context`)).json()) as {
      hasRoots?: boolean;
      eci?: string;
    };
    t.true(ui.hasRoots);
    t.is(ui.eci, undefined);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { EngineClient } = require("../mcp/engineClient.js") as {
      EngineClient: new (opts: { baseUrl: string }) => {
        channelQuery: (eci: string, rid: string, name: string, args?: object) => Promise<unknown>;
      };
    };
    const client = new EngineClient({ baseUrl: pe.base_url });
    const name = await client.channelQuery(eci!, "io.picolabs.pico-engine-ui", "name", {});
    t.is(typeof name, "string");
  } finally {
    await pe.shutdown();
  }
});

test.serial(
  "opt-in localhost bypass allows a direct loopback connection and refuses a proxied one",
  async (t) => {
    const pe = await startIsolatedEngine({
      autoCreateRootPico: true,
      allowLocalhostChannelBypass: true,
    });
    try {
      const url = `${pe.base_url}/c/${pe.uiECI}/query/io.picolabs.pico-engine-ui/name`;
      const direct = await fetch(url, { headers: { Host: "localhost:3000" } });
      t.is(direct.status, 200);

      const forwarded = await fetch(url, {
        headers: { "X-Forwarded-For": "203.0.113.5" },
      });
      t.is(forwarded.status, 401);

      const realIp = await fetch(url, { headers: { "X-Real-IP": "203.0.113.5" } });
      t.is(realIp.status, 401);

      const rfc = await fetch(url, { headers: { Forwarded: "for=203.0.113.5" } });
      t.is(rfc.status, 401);

      const devDirect = await fetch(`${pe.base_url}/api/dev/local`);
      t.is(devDirect.status, 200);
      const devProxied = await fetch(`${pe.base_url}/api/dev/local`, {
        headers: { "X-Forwarded-For": "203.0.113.5" },
      });
      t.is(devProxied.status, 403);
    } finally {
      await pe.shutdown();
    }
  }
);
