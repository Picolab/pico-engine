/**
 * The csv, uri, ical, rss, and telnet libraries and the query operator from
 * compiled KRL, and telnet events reaching the pico that connected.
 */

import test from "ava";
import * as net from "net";
import { startTestEngine } from "./helpers/startTestEngine";

const RID = "io.picolabs.test.libraries";

test("csv, uri, ical, rss, and query work from KRL", async (t) => {
  const { pe, mkQuery } = await startTestEngine(["libraries.krl"]);
  const query = mkQuery(RID);

  const out = await query("csvOut", { rows: [{ a: "1", b: "x, y" }], fields: ["b", "a"] });
  t.is(out, 'b,a\n"x, y",1\n');
  t.deepEqual(await query("csvIn", { text: out }), [{ b: "x, y", a: "1" }]);
  t.is(await query("escaped", { s: "a b&c" }), "a%20b%26c");
  t.is(await query("unescaped", { s: "a%20b%26c" }), "a b&c");
  const cal = await query("calendar");
  t.true(cal.includes("X-WR-CALNAME:Picos\r\n") && cal.includes("DTSTART;VALUE=DATE:20261120\r\n"));
  const xml = "<rss version='2.0'><channel><title>Blog</title><item><title>Post</title></item></channel></rss>";
  t.is(await query("feedTitle", { xml }), "Blog / Post");
  const fleet = { vehicles: [{ trips: [{ miles: 8.7 }, { miles: 2.7 }] }, { trips: [{ miles: 40 }] }] };
  t.deepEqual(await query("longTrips", { fleet, min: 5 }), [8.7, 40], "the query operator");
  await pe.pf.db.close();
});

test("telnet connects per pico, sends, and raises telnet:closed when the host hangs up", async (t) => {
  const { pe, signal, mkQuery } = await startTestEngine(["libraries.krl"]);
  const query = mkQuery(RID);
  const sockets: net.Socket[] = [];
  const server = net.createServer((sock) => {
    sockets.push(sock);
    sock.on("data", (d) => sock.write("ok " + d.toString().trim() + "\r\n"));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as net.AddressInfo).port;

  await signal("test", "telnet_connect", { port });
  t.like((await query("telnetState")).connect, { connected: true, port });
  await signal("test", "telnet_send", { command: "status" });
  t.is((await query("telnetState")).reply, "ok status");

  sockets.forEach((s) => s.destroy());
  server.close();
  const end = Date.now() + 5000;
  let events: string[] = [];
  while (Date.now() < end && !events.includes("closed")) {
    await new Promise((r) => setTimeout(r, 100));
    events = (await query("telnetState")).events;
  }
  t.true(events.includes("closed"), JSON.stringify(events));
  await pe.pf.db.close();
});
